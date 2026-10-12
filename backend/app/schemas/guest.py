from pydantic import BaseModel, Field
from typing import List, Optional
from app.schemas.photo import PhotoPublicItem

class GuestRegisterRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+?[0-9]{10,14}$")
    whatsapp_opt_in: bool = True
    selfie_base64: Optional[str] = None

class SelfieSearchResponse(BaseModel):
    matched_count: int
    photos: List[PhotoPublicItem]
    scan_time_ms: float
    face_detected: bool = True
    message: Optional[str] = None

class WhatsAppOptInRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+?[0-9]{10,14}$")
    event_id: str

class GuestErasureRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+?[0-9]{10,14}$")

