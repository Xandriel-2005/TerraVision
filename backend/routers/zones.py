from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import FenceZone
from schemas import FenceZoneResponse, FenceZoneCreate, FenceZoneUpdate

router = APIRouter(prefix="/api/zones", tags=["zones"])

@router.get("/", response_model=List[FenceZoneResponse])
async def list_zones(camera_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(FenceZone)
    if camera_id:
        query = query.where(FenceZone.camera_id == camera_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=FenceZoneResponse)
async def create_zone(zone: FenceZoneCreate, db: AsyncSession = Depends(get_db)):
    db_zone = await db.get(FenceZone, zone.id)
    if db_zone:
        raise HTTPException(status_code=400, detail="Zone ID already exists")
        
    new_zone = FenceZone(**zone.model_dump())
    db.add(new_zone)
    await db.commit()
    await db.refresh(new_zone)
    # Note: In a real app, you would notify the AI pipeline via WS/Redis that a zone changed
    return new_zone

@router.put("/{zone_id}", response_model=FenceZoneResponse)
async def update_zone(zone_id: str, zone_update: FenceZoneUpdate, db: AsyncSession = Depends(get_db)):
    db_zone = await db.get(FenceZone, zone_id)
    if not db_zone:
        raise HTTPException(status_code=404, detail="Zone not found")
        
    update_data = zone_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_zone, key, value)
        
    await db.commit()
    await db.refresh(db_zone)
    return db_zone

@router.delete("/{zone_id}")
async def delete_zone(zone_id: str, db: AsyncSession = Depends(get_db)):
    db_zone = await db.get(FenceZone, zone_id)
    if not db_zone:
        raise HTTPException(status_code=404, detail="Zone not found")
        
    await db.delete(db_zone)
    await db.commit()
    return {"message": "Zone deleted"}
