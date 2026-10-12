from sqlalchemy import Column, String, Integer, Boolean, Date, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel

class EventStatus(str, enum.Enum):
    CREATED = "created"
    LIVE = "live"
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"

class Event(BaseModel):
    __tablename__ = "events"

    photographer_id = Column(String(36), ForeignKey("photographers.id", ondelete="RESTRICT"), nullable=False, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    event_date = Column(Date, nullable=False)
    status = Column(SQLEnum(EventStatus), default=EventStatus.CREATED, nullable=False, index=True)
    plan_tier = Column(String(50), default="standard_25gb", nullable=False)
    storage_limit_mb = Column(Integer, default=25600, nullable=False)
    storage_used_mb = Column(Integer, default=0, nullable=False)
    cover_photo_url = Column(Text, nullable=True)
    qr_code_url = Column(Text, nullable=True)
    face_search_enabled = Column(Boolean, default=True, nullable=False)
    whatsapp_delivery_enabled = Column(Boolean, default=True, nullable=False)
    
    live_started_at = Column(DateTime(timezone=True), nullable=True)
    archived_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    retention_extended_until = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    photographer = relationship("Photographer", back_populates="events")
    photos = relationship("Photo", back_populates="event", cascade="all, delete-orphan")
    guests = relationship("Guest", back_populates="event", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="event", cascade="all, delete-orphan")
