"""
TerraVision IBVAP — Stream Manager

Manages multiple video sources (cameras), processes frames through
the AI pipeline, and pushes results to the backend via WebSocket.
Handles video looping, frame rate control, and graceful shutdown.
"""

import asyncio
import json
import time
from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np

from detector import Detector, FrameResult
from virtual_fence import VirtualFenceEngine, FenceAlert
from night_enhancer import NightEnhancer


@dataclass
class CameraSource:
    """Configuration for a single camera/video source."""

    id: str
    name: str
    source: str  # File path or RTSP URL
    loop: bool = True  # Loop video files for demo
    enabled: bool = True


class StreamManager:
    """
    Manages multiple camera sources and processes them through the
    AI detection pipeline.

    For the prototype, processes one camera at a time in round-robin
    fashion (single GPU). Each camera gets processed, then the annotated
    frame + detections + alerts are sent to the backend WebSocket.

    Usage:
        manager = StreamManager(detector, fence_engine)
        manager.add_camera(CameraSource(id="cam-01", ...))
        await manager.start(ws_url="ws://localhost:8000/ws/pipeline")
    """

    def __init__(
        self,
        detector: Detector,
        fence_engine: VirtualFenceEngine,
        night_enhancer: Optional[NightEnhancer] = None,
        target_fps: float = 20.0,
    ):
        self.detector = detector
        self.fence_engine = fence_engine
        self.night_enhancer = night_enhancer or NightEnhancer()
        self.target_fps = target_fps
        self.frame_interval = 1.0 / target_fps

        self.cameras: dict[str, CameraSource] = {}
        self._captures: dict[str, cv2.VideoCapture] = {}
        self._running = False
        self._ws = None

    def add_camera(self, camera: CameraSource):
        """Register a camera source."""
        self.cameras[camera.id] = camera
        print(f"[StreamManager] Added camera: {camera.id} ({camera.name}) -> {camera.source}")

    def _open_capture(self, camera: CameraSource) -> Optional[cv2.VideoCapture]:
        """Open a video capture for a camera source."""
        cap = cv2.VideoCapture(camera.source)
        if not cap.isOpened():
            print(f"[StreamManager] ERROR: Cannot open {camera.source}")
            return None
        print(f"[StreamManager] Opened: {camera.id} ({camera.source})")
        return cap

    def _read_frame(self, camera: CameraSource) -> Optional[np.ndarray]:
        """Read a single frame from a camera, handling looping."""
        cap = self._captures.get(camera.id)

        if cap is None or not cap.isOpened():
            cap = self._open_capture(camera)
            if cap is None:
                return None
            self._captures[camera.id] = cap

        ret, frame = cap.read()

        if not ret:
            if camera.loop:
                # Reset to beginning of video
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                self.detector.reset_tracker()
                ret, frame = cap.read()
                if not ret:
                    return None
                print(f"[StreamManager] Looped video: {camera.id}")
            else:
                return None

        return frame

    def _draw_zones_on_frame(
        self, frame: np.ndarray, camera_id: str
    ) -> np.ndarray:
        """Draw virtual fence zone overlays on the annotated frame."""
        zones = self.fence_engine.get_zone_polygons_for_drawing(camera_id)

        for zone in zones:
            # Parse hex color to BGR
            hex_color = zone["color"].lstrip("#")
            r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
            bgr_color = (b, g, r)

            if zone["type"] in ("intrusion", "dwell") and zone["polygon_points"]:
                pts = np.array(zone["polygon_points"], dtype=np.int32)
                # Semi-transparent fill
                overlay = frame.copy()
                cv2.fillPoly(overlay, [pts], bgr_color)
                frame = cv2.addWeighted(overlay, 0.2, frame, 0.8, 0)
                # Solid border
                cv2.polylines(frame, [pts], isClosed=True, color=bgr_color, thickness=2)
                # Label
                if len(pts) > 0:
                    label_pos = (int(pts[0][0]), int(pts[0][1]) - 10)
                    cv2.putText(
                        frame,
                        zone["name"],
                        label_pos,
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        bgr_color,
                        2,
                    )

            elif zone["type"] in ("tripwire", "directional_tripwire") and zone["line_points"]:
                pts = zone["line_points"]
                if len(pts) >= 2:
                    cv2.line(
                        frame,
                        tuple(pts[0]),
                        tuple(pts[1]),
                        bgr_color,
                        thickness=3,
                    )
                    # Label at midpoint
                    mid_x = (pts[0][0] + pts[1][0]) // 2
                    mid_y = (pts[0][1] + pts[1][1]) // 2
                    cv2.putText(
                        frame,
                        zone["name"],
                        (mid_x, mid_y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        bgr_color,
                        2,
                    )

        return frame

    async def _send_to_backend(self, result: FrameResult, alerts: list[FenceAlert]):
        """Send frame result + alerts to backend via WebSocket."""
        if self._ws is None:
            return

        try:
            payload = {
                "type": "frame_update",
                "camera_id": result.camera_id,
                "timestamp": result.timestamp,
                "frame": result.encode_frame_jpeg(quality=70),
                "detections": [
                    {
                        "track_id": d.track_id,
                        "class_name": d.class_name,
                        "category": d.category,
                        "confidence": round(d.confidence, 3),
                        "bbox": d.bbox,
                        "centroid": d.centroid,
                    }
                    for d in result.detections
                ],
                "alerts": [a.to_dict() for a in alerts],
                "stats": {
                    "person_count": result.person_count,
                    "vehicle_count": result.vehicle_count,
                    "fps": round(result.fps, 1),
                },
            }

            await self._ws.send(json.dumps(payload))

        except Exception as e:
            print(f"[StreamManager] WebSocket send error: {e}")

    async def start(self, ws_url: str = "ws://localhost:8000/ws/pipeline"):
        """
        Start the processing loop. Processes all cameras in round-robin
        and sends results to the backend.
        """
        import websockets

        self._running = True
        print(f"[StreamManager] Connecting to backend: {ws_url}")

        try:
            async with websockets.connect(ws_url, ping_interval=None) as ws:
                self._ws = ws
                print("[StreamManager] Connected to backend WebSocket")

                while self._running:
                    for cam_id, camera in self.cameras.items():
                        if not camera.enabled or not self._running:
                            continue

                        t_start = time.perf_counter()

                        # Read frame
                        frame = self._read_frame(camera)
                        if frame is None:
                            continue

                        # Night enhancement
                        frame = self.night_enhancer.process(frame)

                        # Detection + tracking
                        result = self.detector.process_frame(frame, camera_id=cam_id)

                        # Virtual fence check
                        alerts = self.fence_engine.check(
                            result.detections, camera_id=cam_id
                        )

                        # Draw zone overlays on the annotated frame
                        result.annotated_frame = self._draw_zones_on_frame(
                            result.annotated_frame, cam_id
                        )

                        # Log alerts
                        for alert in alerts:
                            print(f"[ALERT] {alert.message}")

                        # Send to backend
                        await self._send_to_backend(result, alerts)

                        # Frame rate control
                        elapsed = time.perf_counter() - t_start
                        sleep_time = max(0, self.frame_interval - elapsed)
                        if sleep_time > 0:
                            await asyncio.sleep(sleep_time)

        except Exception as e:
            print(f"[StreamManager] Connection error: {e}")
            print("[StreamManager] Running in offline mode (no backend)")
            await self._run_offline()

    async def _run_offline(self):
        """
        Fallback: run the pipeline without backend connection.
        Shows annotated frames in an OpenCV window for debugging.
        """
        print("[StreamManager] Running in OFFLINE mode — press 'q' to quit")

        while self._running:
            for cam_id, camera in self.cameras.items():
                if not camera.enabled or not self._running:
                    continue

                t_start = time.perf_counter()

                frame = self._read_frame(camera)
                if frame is None:
                    continue

                frame = self.night_enhancer.process(frame)
                result = self.detector.process_frame(frame, camera_id=cam_id)
                alerts = self.fence_engine.check(result.detections, camera_id=cam_id)
                result.annotated_frame = self._draw_zones_on_frame(
                    result.annotated_frame, cam_id
                )

                for alert in alerts:
                    print(f"[ALERT] {alert.message}")

                # Show in OpenCV window
                cv2.imshow(f"TerraVision - {camera.name}", result.annotated_frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    self._running = False
                    break

                elapsed = time.perf_counter() - t_start
                sleep_time = max(0, self.frame_interval - elapsed)
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)

        cv2.destroyAllWindows()

    def stop(self):
        """Signal the processing loop to stop."""
        self._running = False
        for cap in self._captures.values():
            if cap.isOpened():
                cap.release()
        self._captures.clear()
        print("[StreamManager] Stopped")
