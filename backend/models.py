import time
from sqlalchemy import Column, String, Float, Boolean, JSON, Integer, Text
from database import Base


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    source = Column(String)
    location = Column(String, nullable=True)
    status = Column(String, default="offline")
    enabled = Column(Boolean, default=True)


class FenceZone(Base):
    __tablename__ = "fence_zones"

    id = Column(String, primary_key=True, index=True)
    camera_id = Column(String, index=True)
    name = Column(String)
    zone_type = Column(String)  # intrusion, tripwire, directional_tripwire, dwell
    severity = Column(String, default="high")
    enabled = Column(Boolean, default=True)
    
    polygon_points = Column(JSON, default=list)
    line_points = Column(JSON, default=list)
    direction = Column(String, nullable=True)
    dwell_threshold = Column(Float, default=10.0)
    color = Column(String, default="#ef4444")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    zone_id = Column(String, index=True)
    zone_name = Column(String)
    zone_type = Column(String)
    severity = Column(String, index=True)
    camera_id = Column(String, index=True)
    track_id = Column(Integer)
    class_name = Column(String)
    message = Column(String)
    timestamp = Column(Float, default=time.time, index=True)
    centroid = Column(JSON, default=list)
    acknowledged = Column(Boolean, default=False)
    
    # Store thumbnail as base64 string for prototype simplicity
    thumbnail = Column(Text, nullable=True)


class DetectionEvent(Base):
    __tablename__ = "detection_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    camera_id = Column(String, index=True)
    track_id = Column(Integer)
    class_name = Column(String)
    category = Column(String, index=True)  # person, vehicle
    confidence = Column(Float)
    bbox = Column(JSON)
    timestamp = Column(Float, default=time.time, index=True)
