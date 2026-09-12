import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import cameras, zones, alerts, analytics
from ws_manager import manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    print("Shutting down backend...")

app = FastAPI(title="TerraVision IBVAP Backend", lifespan=lifespan)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For prototype only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(cameras.router)
app.include_router(zones.router)
app.include_router(alerts.router)
app.include_router(analytics.router)


# --- WebSockets ---

@app.websocket("/ws/pipeline")
async def websocket_pipeline(websocket: WebSocket):
    """Endpoint for the AI Pipeline to send frames and alerts."""
    await manager.connect_pipeline(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.process_pipeline_message(data)
    except WebSocketDisconnect:
        manager.disconnect_pipeline()

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """Endpoint for Dashboard to receive real-time alerts."""
    await manager.connect_alert_client(websocket)
    try:
        while True:
            # Dashboard clients generally just listen, but we need to receive to keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_alert_client(websocket)

@app.websocket("/ws/stream/{camera_id}")
async def websocket_stream(websocket: WebSocket, camera_id: str):
    """Endpoint for Dashboard to receive live video frames for a specific camera."""
    await manager.connect_stream_client(websocket, camera_id)
    try:
        while True:
            # Same as above, just keeping connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_stream_client(websocket, camera_id)


@app.get("/")
def read_root():
    return {"status": "TerraVision IBVAP API is running"}
