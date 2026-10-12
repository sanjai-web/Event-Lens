from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.types import Vector512
from app.core.config import settings

class FaceEmbedding(BaseModel):
    __tablename__ = "face_embeddings"

    photo_id = Column(String(36), ForeignKey("photos.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    model_version = Column(String(50), default=settings.FACE_MODEL_VERSION, nullable=False)
    embedding = Column(Vector512, nullable=False)
    bbox = Column(JSON, nullable=False) # e.g. {"x": 100, "y": 80, "w": 150, "h": 150, "confidence": 0.98}
    landmarks = Column(JSON, nullable=True) # 5-point facial landmarks

    # Relationships
    photo = relationship("Photo", back_populates="face_embeddings")
