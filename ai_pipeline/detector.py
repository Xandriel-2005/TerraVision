"""
TerraVision IBVAP — Core Detection & Tracking Engine

Uses YOLOv8 for object detection and ByteTrack (via supervision) for
multi-object tracking. Produces annotated frames and structured detection
metadata for downstream processing (virtual fencing, alerts, dashboard).
"""

import time
import base64
from dataclasses import dataclass, field
from typing import Optional

import cv2
import numpy as np
import supervision as sv
from ultralytics import YOLO


# Detection classes we care about (COCO dataset IDs)
# 0=person, 1=bicycle, 2=car, 3=motorcycle, 5=bus, 7=truck
TRACKED_CLASSES = {0, 1, 2, 3, 5, 7}

CLASS_NAMES = {
    0: "person",
    1: "bicycle",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}

# Broader categories for dashboard stats
CLASS_CATEGORIES = {
    0: "person",
    1: "vehicle",
    2: "vehicle",
    3: "vehicle",
    5: "vehicle",
    7: "vehicle",
}


@dataclass
class Detection:
    """A single detected + tracked object."""

    track_id: int
    class_id: int
    class_name: str
    category: str  # "person" or "vehicle"
    confidence: float
    bbox: list[int]  # [x1, y1, x2, y2]
    centroid: list[int]  # [cx, cy]


@dataclass
class FrameResult:
    """Complete result from processing one frame."""

    camera_id: str
    timestamp: float
    annotated_frame: np.ndarray  # BGR annotated image
    detections: list[Detection] = field(default_factory=list)
    person_count: int = 0
    vehicle_count: int = 0
    fps: float = 0.0

    def to_dict(self) -> dict:
        """Serialize to JSON-compatible dict (without frame bytes)."""
        return {
            "camera_id": self.camera_id,
            "timestamp": self.timestamp,
            "detections": [
                {
                    "track_id": d.track_id,
                    "class_id": d.class_id,
                    "class_name": d.class_name,
                    "category": d.category,
                    "confidence": round(d.confidence, 3),
                    "bbox": d.bbox,
                    "centroid": d.centroid,
                }
                for d in self.detections
            ],
            "stats": {
                "person_count": self.person_count,
                "vehicle_count": self.vehicle_count,
                "fps": round(self.fps, 1),
            },
        }

    def encode_frame_jpeg(self, quality: int = 70) -> str:
        """Encode annotated frame as base64 JPEG string."""
        _, buffer = cv2.imencode(
            ".jpg", self.annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, quality]
        )
        return base64.b64encode(buffer).decode("utf-8")


class Detector:
    """
    YOLOv8 + ByteTrack detection and tracking engine.

    Usage:
        detector = Detector(model_path="yolov8m.pt", device="cuda:0")
        for frame in video_frames:
            result = detector.process_frame(frame, camera_id="cam-01")
            # result.annotated_frame — BGR image with drawn bounding boxes
            # result.detections — list of Detection objects
    """

    def __init__(
        self,
        model_path: str = "yolov8m.pt",
        device: str = "cuda:0",
        confidence: float = 0.4,
        iou_threshold: float = 0.5,
        img_size: int = 640,
    ):
        print(f"[Detector] Loading model: {model_path} on {device}")
        self.model = YOLO(model_path)
        self.device = device
        self.confidence = confidence
        self.iou_threshold = iou_threshold
        self.img_size = img_size

        # ByteTrack tracker from supervision
        self.tracker = sv.ByteTrack(
            track_activation_threshold=confidence,
            lost_track_buffer=30,  # Keep lost tracks for 30 frames
            minimum_matching_threshold=0.8,
            frame_rate=25,
        )

        # Annotators for drawing on frames
        self.box_annotator = sv.BoxAnnotator(
            thickness=2,
            color=sv.ColorPalette.from_hex(
                ["#06d6a0", "#118ab2", "#ef476f", "#ffd166", "#073b4c"]
            ),
        )
        self.label_annotator = sv.LabelAnnotator(
            text_scale=0.5,
            text_thickness=1,
            text_padding=5,
            color=sv.ColorPalette.from_hex(
                ["#06d6a0", "#118ab2", "#ef476f", "#ffd166", "#073b4c"]
            ),
        )
        self.trace_annotator = sv.TraceAnnotator(
            thickness=2,
            trace_length=50,
            color=sv.ColorPalette.from_hex(
                ["#06d6a0", "#118ab2", "#ef476f", "#ffd166", "#073b4c"]
            ),
        )

        # FPS tracking
        self._frame_times: list[float] = []
        self._fps: float = 0.0

        print(f"[Detector] Ready — confidence={confidence}, device={device}")

    def process_frame(
        self, frame: np.ndarray, camera_id: str = "cam-01"
    ) -> FrameResult:
        """
        Run detection + tracking on a single frame.

        Args:
            frame: BGR image (numpy array from OpenCV)
            camera_id: Identifier for the camera source

        Returns:
            FrameResult with annotated frame, detections, and stats
        """
        t_start = time.perf_counter()

        # --- Run YOLOv8 inference ---
        results = self.model(
            frame,
            conf=self.confidence,
            iou=self.iou_threshold,
            imgsz=self.img_size,
            device=self.device,
            verbose=False,
        )[0]

        # Convert to supervision Detections
        sv_detections = sv.Detections.from_ultralytics(results)

        # Filter to only tracked classes
        mask = np.array(
            [cls_id in TRACKED_CLASSES for cls_id in sv_detections.class_id],
            dtype=bool,
        )
        sv_detections = sv_detections[mask]

        # --- Run ByteTrack ---
        sv_detections = self.tracker.update_with_detections(sv_detections)

        # --- Build detection list ---
        detections: list[Detection] = []
        person_count = 0
        vehicle_count = 0

        if sv_detections.tracker_id is not None:
            for i in range(len(sv_detections)):
                cls_id = int(sv_detections.class_id[i])
                track_id = int(sv_detections.tracker_id[i])
                conf = float(sv_detections.confidence[i])
                bbox = sv_detections.xyxy[i].astype(int).tolist()
                cx = int((bbox[0] + bbox[2]) / 2)
                cy = int((bbox[1] + bbox[3]) / 2)

                category = CLASS_CATEGORIES.get(cls_id, "unknown")
                if category == "person":
                    person_count += 1
                elif category == "vehicle":
                    vehicle_count += 1

                detections.append(
                    Detection(
                        track_id=track_id,
                        class_id=cls_id,
                        class_name=CLASS_NAMES.get(cls_id, f"class_{cls_id}"),
                        category=category,
                        confidence=conf,
                        bbox=bbox,
                        centroid=[cx, cy],
                    )
                )

        # --- Annotate frame ---
        labels = []
        if sv_detections.tracker_id is not None:
            for i in range(len(sv_detections)):
                cls_id = int(sv_detections.class_id[i])
                track_id = int(sv_detections.tracker_id[i])
                conf = float(sv_detections.confidence[i])
                name = CLASS_NAMES.get(cls_id, f"cls_{cls_id}")
                labels.append(f"#{track_id} {name} {conf:.0%}")

        annotated = frame.copy()
        annotated = self.trace_annotator.annotate(annotated, sv_detections)
        annotated = self.box_annotator.annotate(annotated, sv_detections)
        annotated = self.label_annotator.annotate(
            annotated, sv_detections, labels=labels
        )

        # --- FPS calculation ---
        t_end = time.perf_counter()
        self._frame_times.append(t_end - t_start)
        if len(self._frame_times) > 30:
            self._frame_times.pop(0)
        avg_time = sum(self._frame_times) / len(self._frame_times)
        self._fps = 1.0 / avg_time if avg_time > 0 else 0.0

        return FrameResult(
            camera_id=camera_id,
            timestamp=time.time(),
            annotated_frame=annotated,
            detections=detections,
            person_count=person_count,
            vehicle_count=vehicle_count,
            fps=self._fps,
        )

    def reset_tracker(self):
        """Reset the ByteTrack tracker (e.g., when switching video sources)."""
        self.tracker.reset()
        self._frame_times.clear()
        self._fps = 0.0
