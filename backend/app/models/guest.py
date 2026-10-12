from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import BaseModel
from app.models.types import Vector512

class Guest(BaseModel):
    __tablename__ = "guests"

    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    phone_number = Column(String(20), nullable=True, index=True)
    whatsapp_opt_in = Column(Boolean, default=False, nullable=False)
    consent_given_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    selfie_embedding = Column(Vector512, nullable=True)
    selfie_r2_key = Column(String(500), nullable=True)
    last_notified_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    event = relationship("Event", back_populates="guests")
