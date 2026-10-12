from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CreateOrderRequest(BaseModel):
    event_id: str
    plan_tier: str

class CreateOrderResponse(BaseModel):
    order_id: str
    amount_paise: int
    currency: str = "INR"
    key_id: str

class VerifyPaymentRequest(BaseModel):
    event_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PaymentStatusResponse(BaseModel):
    id: str
    event_id: str
    status: str
    tier_selected: str
    amount_paise: int
    created_at: datetime
    verified_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
