from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date, datetime
from app.models.event import EventStatus

class EventCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    event_date: date
    plan_tier: str = Field(default="standard_25gb", pattern="^(starter_10gb|standard_25gb|grand_60gb|enterprise_150gb)$")

class EventUpdate(BaseModel):
    name: Optional[str] = None
    event_date: Optional[date] = None
    status: Optional[EventStatus] = None
    face_search_enabled: Optional[bool] = None
    whatsapp_delivery_enabled: Optional[bool] = None

class EventListItem(BaseModel):
    id: str
    slug: str
    name: str
    event_date: date
    status: EventStatus
    plan_tier: str
    storage_limit_mb: int
    storage_used_mb: int
    photo_count: int = 0
    guest_count: int = 0
    cover_photo_url: Optional[str] = None
    qr_code_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EventDetail(EventListItem):
    photographer_id: str
    face_search_enabled: bool
    whatsapp_delivery_enabled: bool
    public_gallery_url: str
    selfie_search_url: str
    live_started_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

class CreateEventResponse(BaseModel):
    event: EventListItem
    razorpay_order_id: Optional[str] = None
    amount_paise: int
    currency: str = "INR"
    key_id: Optional[str] = None
