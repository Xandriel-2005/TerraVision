import asyncio
import json
from typing import Dict, List, Any
from fastapi import WebSocket

from database import AsyncSessionLocal
from models import Alert, DetectionEvent

class ConnectionManager:
    def __init__(self):
        # AI Pipeline connection
        self.pipeline_ws: WebSocket | None = None
        
        # Dashboard client connections for alerts
        self.alert_clients: List[WebSocket] = []
        
        # Dashboard client connections for camera streams: {camera_id: [WebSocket, ...]}
        self.stream_clients: Dict[str, List[WebSocket]] = {}

    async def connect_pipeline(self, websocket: WebSocket):
        await websocket.accept()
        self.pipeline_ws = websocket
        print("[WS] AI Pipeline connected")

    def disconnect_pipeline(self):
        self.pipeline_ws = None
        print("[WS] AI Pipeline disconnected")

    async def connect_alert_client(self, websocket: WebSocket):
        await websocket.accept()
        self.alert_clients.append(websocket)
        print(f"[WS] Alert client connected. Total: {len(self.alert_clients)}")

    def disconnect_alert_client(self, websocket: WebSocket):
        if websocket in self.alert_clients:
            self.alert_clients.remove(websocket)
            print(f"[WS] Alert client disconnected. Total: {len(self.alert_clients)}")

    async def connect_stream_client(self, websocket: WebSocket, camera_id: str):
        await websocket.accept()
        if camera_id not in self.stream_clients:
            self.stream_clients[camera_id] = []
        self.stream_clients[camera_id].append(websocket)
        print(f"[WS] Stream client connected to {camera_id}. Total for cam: {len(self.stream_clients[camera_id])}")

    def disconnect_stream_client(self, websocket: WebSocket, camera_id: str):
        if camera_id in self.stream_clients and websocket in self.stream_clients[camera_id]:
            self.stream_clients[camera_id].remove(websocket)
            print(f"[WS] Stream client disconnected from {camera_id}. Total for cam: {len(self.stream_clients[camera_id])}")

    async def broadcast_alert(self, alert_data: dict):
        """Broadcast alert to all connected dashboard clients."""
        dead_clients = []
        for client in self.alert_clients:
            try:
                await client.send_json({"type": "new_alert", "data": alert_data})
            except Exception:
                dead_clients.append(client)
                
        for client in dead_clients:
            self.disconnect_alert_client(client)

    async def broadcast_stream(self, camera_id: str, frame_data: dict):
        """Broadcast frame data to clients listening to a specific camera."""
        if camera_id not in self.stream_clients:
            return
            
        dead_clients = []
        for client in self.stream_clients[camera_id]:
            try:
                await client.send_json(frame_data)
            except Exception:
                dead_clients.append(client)
                
        for client in dead_clients:
            self.disconnect_stream_client(client, camera_id)

    async def process_pipeline_message(self, message: str):
        """
        Process a message received from the AI pipeline.
        Expected format:
        {
            "type": "frame_update",
            "camera_id": "cam-01",
            "timestamp": 1234567890.12,
            "frame": "<base64>",
            "detections": [...],
            "alerts": [...],
            "stats": {...}
        }
        """
        try:
            data = json.loads(message)
            
            if data.get("type") == "frame_update":
                camera_id = data.get("camera_id")
                
                # 1. Broadcast frame to stream clients
                stream_payload = {
                    "camera_id": camera_id,
                    "timestamp": data.get("timestamp"),
                    "frame": data.get("frame"),
                    "stats": data.get("stats")
                }
                # Run broadcast as a background task so it doesn't block processing
                asyncio.create_task(self.broadcast_stream(camera_id, stream_payload))
                
                # 2. Process alerts
                alerts = data.get("alerts", [])
                if alerts:
                    asyncio.create_task(self._handle_new_alerts(alerts))
                    
                # 3. Process detection events (optional for demo, but good for analytics)
                # Uncomment to store all detections in DB (might be heavy for sqlite in demo)
                # detections = data.get("detections", [])
                # if detections:
                #    asyncio.create_task(self._store_detections(camera_id, detections))
                    
        except json.JSONDecodeError:
            print("[WS] Error decoding message from pipeline")
        except Exception as e:
            print(f"[WS] Error processing pipeline message: {e}")

    async def _handle_new_alerts(self, alerts: List[Dict[str, Any]]):
        """Store alerts in DB and broadcast to clients."""
        async with AsyncSessionLocal() as session:
            for alert_data in alerts:
                # 1. Create DB record
                db_alert = Alert(
                    zone_id=alert_data.get("zone_id"),
                    zone_name=alert_data.get("zone_name"),
                    zone_type=alert_data.get("zone_type"),
                    severity=alert_data.get("severity", "high"),
                    camera_id=alert_data.get("camera_id"),
                    track_id=alert_data.get("track_id"),
                    class_name=alert_data.get("class_name"),
                    message=alert_data.get("message"),
                    timestamp=alert_data.get("timestamp"),
                    centroid=alert_data.get("centroid", []),
                    thumbnail=alert_data.get("thumbnail") # Optional
                )
                session.add(db_alert)
                await session.flush() # Get the ID
                
                # 2. Broadcast to dashboard
                broadcast_data = alert_data.copy()
                broadcast_data["id"] = db_alert.id
                await self.broadcast_alert(broadcast_data)
                
            await session.commit()

    async def _store_detections(self, camera_id: str, detections: List[Dict[str, Any]]):
        """Store detection events for analytics."""
        async with AsyncSessionLocal() as session:
            for det in detections:
                event = DetectionEvent(
                    camera_id=camera_id,
                    track_id=det.get("track_id"),
                    class_name=det.get("class_name"),
                    category=det.get("category"),
                    confidence=det.get("confidence"),
                    bbox=det.get("bbox")
                )
                session.add(event)
            await session.commit()


manager = ConnectionManager()
