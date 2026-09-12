from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from database import get_db
from models import Alert
from schemas import AlertResponse, AlertStats

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("/", response_model=List[AlertResponse])
async def list_alerts(
    skip: int = 0,
    limit: int = 50,
    camera_id: Optional[str] = None,
    severity: Optional[str] = None,
    unacknowledged_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    query = select(Alert).order_by(desc(Alert.timestamp))
    
    if camera_id:
        query = query.where(Alert.camera_id == camera_id)
    if severity:
        query = query.where(Alert.severity == severity)
    if unacknowledged_only:
        query = query.where(Alert.acknowledged == False)
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/stats", response_model=AlertStats)
async def get_alert_stats(db: AsyncSession = Depends(get_db)):
    # Total count
    total_result = await db.execute(select(func.count(Alert.id)))
    total = total_result.scalar() or 0
    
    # Unacknowledged count
    unack_result = await db.execute(select(func.count(Alert.id)).where(Alert.acknowledged == False))
    unack = unack_result.scalar() or 0
    
    # By severity
    sev_result = await db.execute(select(Alert.severity, func.count(Alert.id)).group_by(Alert.severity))
    by_sev = {row[0]: row[1] for row in sev_result.all()}
    
    # By type
    type_result = await db.execute(select(Alert.zone_type, func.count(Alert.id)).group_by(Alert.zone_type))
    by_type = {row[0]: row[1] for row in type_result.all()}
    
    return {
        "total": total,
        "unacknowledged": unack,
        "by_severity": by_sev,
        "by_type": by_type
    }

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.put("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.acknowledged = True
    await db.commit()
    await db.refresh(alert)
    return alert
