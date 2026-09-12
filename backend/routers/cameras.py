from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Camera
from schemas import CameraResponse, CameraCreate

router = APIRouter(prefix="/api/cameras", tags=["cameras"])

@router.get("/", response_model=List[CameraResponse])
async def list_cameras(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Camera))
    return result.scalars().all()

@router.post("/", response_model=CameraResponse)
async def create_camera(camera: CameraCreate, db: AsyncSession = Depends(get_db)):
    db_camera = await db.get(Camera, camera.id)
    if db_camera:
        raise HTTPException(status_code=400, detail="Camera ID already registered")
        
    new_camera = Camera(**camera.model_dump())
    db.add(new_camera)
    await db.commit()
    await db.refresh(new_camera)
    return new_camera

@router.get("/{camera_id}", response_model=CameraResponse)
async def get_camera(camera_id: str, db: AsyncSession = Depends(get_db)):
    camera = await db.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera
