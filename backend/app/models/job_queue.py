from sqlalchemy import Column, String, Integer, DateTime, Text, JSON
from datetime import datetime, timezone
from app.models.base import BaseModel

class JobQueue(BaseModel):
    __tablename__ = "job_queue"

    job_type = Column(String(50), nullable=False, index=True) # "process_photo", "whatsapp_notify", "archive_event"
    payload = Column(JSON, nullable=False)
    status = Column(String(20), default="queued", nullable=False, index=True) # queued, processing, completed, failed
    attempts = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=3, nullable=False)
    error_message = Column(Text, nullable=True)
    scheduled_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
