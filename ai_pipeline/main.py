"""
TerraVision IBVAP — AI Pipeline Entry Point

Starts the AI detection pipeline, connects to the backend WebSocket,
and processes all configured camera sources.

Usage:
    python main.py                          # Use default config
    python main.py --config config.yaml     # Specify config file
    python main.py --offline                # Run without backend (OpenCV window)
"""

import argparse
import asyncio
import signal
import sys

import yaml

from detector import Detector
from virtual_fence import VirtualFenceEngine, FenceZone, ZoneType, AlertSeverity
from night_enhancer import NightEnhancer
from stream_manager import StreamManager, CameraSource


def load_config(config_path: str) -> dict:
    """Load configuration from YAML file."""
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def create_demo_zones() -> list[FenceZone]:
    """
    Create sample virtual fence zones for demo purposes.
    These demonstrate all four zone types.
    """
    return [
        FenceZone(
            id="zone-01",
            name="Restricted Area",
            camera_id="cam-bop-01",
            zone_type=ZoneType.INTRUSION,
            severity=AlertSeverity.HIGH,
            polygon_points=[
                [100, 200],
                [400, 200],
                [400, 450],
                [100, 450],
            ],
            color="#ef4444",
        ),
        FenceZone(
            id="zone-02",
            name="Border Line",
            camera_id="cam-bop-01",
            zone_type=ZoneType.TRIPWIRE,
            severity=AlertSeverity.HIGH,
            line_points=[
                [50, 350],
                [600, 350],
            ],
            color="#f59e0b",
        ),
        FenceZone(
            id="zone-03",
            name="Checkpoint Dwell",
            camera_id="cam-bop-02",
            zone_type=ZoneType.DWELL,
            severity=AlertSeverity.MEDIUM,
            polygon_points=[
                [150, 150],
                [500, 150],
                [500, 400],
                [150, 400],
            ],
            dwell_threshold=8.0,
            color="#3b82f6",
        ),
    ]


async def main():
    parser = argparse.ArgumentParser(description="TerraVision IBVAP AI Pipeline")
    parser.add_argument(
        "--config",
        type=str,
        default="config.yaml",
        help="Path to configuration YAML file",
    )
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Run without backend connection (show OpenCV window)",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Override model path (e.g., yolov8s.pt for lower GPU)",
    )
    parser.add_argument(
        "--device",
        type=str,
        default=None,
        help="Override device (cuda:0, cpu)",
    )
    args = parser.parse_args()

    # Load config
    try:
        config = load_config(args.config)
    except FileNotFoundError:
        print(f"[Main] Config file not found: {args.config}")
        print("[Main] Using default configuration")
        config = {
            "cameras": [
                {
                    "id": "cam-bop-01",
                    "name": "BOP Alpha - Gate",
                    "source": "./demo_videos/demo1.mp4",
                    "loop": True,
                },
                {
                    "id": "cam-bop-02",
                    "name": "BOP Alpha - Perimeter",
                    "source": "./demo_videos/demo2.mp4",
                    "loop": True,
                },
            ],
            "backend_ws": "ws://localhost:8000/ws/pipeline",
            "model": "yolov8m.pt",
            "confidence": 0.4,
            "device": "cuda:0",
            "target_fps": 20,
        }

    # Apply CLI overrides
    model_path = args.model or config.get("model", "yolov8m.pt")
    device = args.device or config.get("device", "cuda:0")
    confidence = config.get("confidence", 0.4)
    target_fps = config.get("target_fps", 20)
    backend_ws = config.get("backend_ws", "ws://localhost:8000/ws/pipeline")

    print("=" * 60)
    print("  TerraVision IBVAP — AI Pipeline")
    print("=" * 60)
    print(f"  Model:      {model_path}")
    print(f"  Device:     {device}")
    print(f"  Confidence: {confidence}")
    print(f"  Target FPS: {target_fps}")
    print(f"  Backend:    {backend_ws}")
    print(f"  Cameras:    {len(config.get('cameras', []))}")
    print("=" * 60)

    # Initialize components
    detector = Detector(
        model_path=model_path,
        device=device,
        confidence=confidence,
    )

    fence_engine = VirtualFenceEngine()
    night_enhancer = NightEnhancer()

    # Load demo zones
    demo_zones = create_demo_zones()
    for zone in demo_zones:
        fence_engine.add_zone(zone)

    # Create stream manager
    manager = StreamManager(
        detector=detector,
        fence_engine=fence_engine,
        night_enhancer=night_enhancer,
        target_fps=target_fps,
    )

    # Add cameras from config
    for cam_cfg in config.get("cameras", []):
        manager.add_camera(
            CameraSource(
                id=cam_cfg["id"],
                name=cam_cfg.get("name", cam_cfg["id"]),
                source=cam_cfg["source"],
                loop=cam_cfg.get("loop", True),
                enabled=cam_cfg.get("enabled", True),
            )
        )

    # Graceful shutdown handler
    def shutdown(sig, frame):
        print(f"\n[Main] Received signal {sig}, shutting down...")
        manager.stop()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Start processing
    if args.offline:
        print("[Main] Starting in OFFLINE mode (OpenCV window)")
        await manager._run_offline()
    else:
        print("[Main] Starting pipeline with backend connection")
        await manager.start(ws_url=backend_ws)

    print("[Main] Pipeline stopped")


if __name__ == "__main__":
    asyncio.run(main())
