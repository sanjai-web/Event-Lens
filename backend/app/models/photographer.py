from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Photographer(BaseModel):
    __tablename__ = "photographers"

    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    business_name = Column(String(255), nullable=True)
    razorpay_account_id = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    events = relationship("Event", back_populates="photographer", cascade="all, delete-orphan")
