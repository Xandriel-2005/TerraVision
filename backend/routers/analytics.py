from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import time

from database import get_db
from models import DetectionEvent

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/dashboard")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """
    Get high-level dashboard stats.
    For the prototype, this gives a snapshot of recent activity.
    """
    now = time.time()
    five_mins_ago = now - 300
    
    # In a real app, this would query recent detection events.
    # For the prototype, we mostly rely on the WebSocket stream for live stats.
    # We can mock some data here or query if we decide to store detections.
    
    # Query stored detections if any
    person_count_query = await db.execute(
        select(func.count(DetectionEvent.id))
        .where(DetectionEvent.category == "person")
        .where(DetectionEvent.timestamp > five_mins_ago)
    )
    person_count = person_count_query.scalar() or 0
    
    vehicle_count_query = await db.execute(
        select(func.count(DetectionEvent.id))
        .where(DetectionEvent.category == "vehicle")
        .where(DetectionEvent.timestamp > five_mins_ago)
    )
    vehicle_count = vehicle_count_query.scalar() or 0

    return {
        "recent_persons": person_count,
        "recent_vehicles": vehicle_count,
        "status": "online"
    }
