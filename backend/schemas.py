from typing import List, Optional
from pydantic import BaseModel, Field


# --- Camera Schemas ---

class CameraBase(BaseModel):
    name: str
    source: str
    location: Optional[str] = None
    enabled: bool = True

class CameraCreate(CameraBase):
    id: str

class CameraResponse(CameraBase):
    id: str
    status: str

    class Config:
        from_attributes = True


# --- Zone Schemas ---

class FenceZoneBase(BaseModel):
    name: str
    camera_id: str
    zone_type: str
    severity: str = "high"
    enabled: bool = True
    polygon_points: List[List[int]] = []
    line_points: List[List[int]] = []
    direction: Optional[str] = None
    dwell_threshold: float = 10.0
    color: str = "#ef4444"

class FenceZoneCreate(FenceZoneBase):
    id: str

class FenceZoneUpdate(BaseModel):
    name: Optional[str] = None
    zone_type: Optional[str] = None
    severity: Optional[str] = None
    enabled: Optional[bool] = None
    polygon_points: Optional[List[List[int]]] = None
    line_points: Optional[List[List[int]]] = None
    direction: Optional[str] = None
    dwell_threshold: Optional[float] = None
    color: Optional[str] = None

class FenceZoneResponse(FenceZoneBase):
    id: str

    class Config:
        from_attributes = True


# --- Alert Schemas ---

class AlertResponse(BaseModel):
    id: int
    zone_id: str
    zone_name: str
    zone_type: str
    severity: str
    camera_id: str
    track_id: int
    class_name: str
    message: str
    timestamp: float
    centroid: List[int] = []
    acknowledged: bool
    thumbnail: Optional[str] = None

    class Config:
        from_attributes = True


class AlertStats(BaseModel):
    total: int
    unacknowledged: int
    by_severity: dict[str, int]
    by_type: dict[str, int]
