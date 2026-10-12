from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Payment(BaseModel):
    __tablename__ = "payments"

    event_id = Column(String(36), ForeignKey("events.id", ondelete="RESTRICT"), nullable=False, index=True)
    photographer_id = Column(String(36), ForeignKey("photographers.id", ondelete="RESTRICT"), nullable=False)
    razorpay_order_id = Column(String(100), unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String(100), unique=True, nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    amount_paise = Column(Integer, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    tier_selected = Column(String(50), nullable=False)
    status = Column(String(50), default="pending", nullable=False) # pending, paid, failed, refunded
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    event = relationship("Event", back_populates="payments")
