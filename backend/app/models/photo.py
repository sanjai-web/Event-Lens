from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import BaseModel

class Photo(BaseModel):
    __tablename__ = "photos"

    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    r2_key_original = Column(String(500), nullable=False)
    r2_key_web = Column(String(500), nullable=True)
    r2_key_thumb = Column(String(500), nullable=True)
    original_filename = Column(String(255), nullable=True)
    file_size_bytes = Column(BigInteger, default=0, nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    face_processed = Column(Boolean, default=False, nullable=False, index=True)
    face_count = Column(Integer, default=0, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    event = relationship("Event", back_populates="photos")
    face_embeddings = relationship("FaceEmbedding", back_populates="photo", cascade="all, delete-orphan")
