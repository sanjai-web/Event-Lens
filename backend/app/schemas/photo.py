from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional
from datetime import datetime

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/tiff"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

class PresignPhotoItem(BaseModel):
    filename: str
    size_bytes: int = Field(..., gt=0, le=MAX_FILE_SIZE_BYTES, description="Max 50MB per photo")
    content_type: str = Field(default="image/jpeg", description="MIME type of the photo")

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, v: str) -> str:
        clean_v = v.lower().strip()
        if clean_v not in ALLOWED_MIME_TYPES:
            raise ValueError(f"Unsupported image type: '{v}'. Allowed types: {', '.join(sorted(ALLOWED_MIME_TYPES))}")
        return clean_v

class PresignRequest(BaseModel):
    files: List[PresignPhotoItem] = Field(..., min_length=1, max_length=100)

class PresignedUrlItem(BaseModel):
    photo_id: str
    r2_key_original: str
    presigned_put_url: str

class PresignBatchResponse(BaseModel):
    items: List[PresignedUrlItem]
    storage_used_mb: int
    storage_limit_mb: int

class ConfirmUploadedPhoto(BaseModel):
    photo_id: str
    r2_key_original: str
    original_filename: Optional[str] = None
    file_size_bytes: int = Field(..., gt=0, le=MAX_FILE_SIZE_BYTES)
    width: Optional[int] = None
    height: Optional[int] = None

class ConfirmBatchRequest(BaseModel):
    uploaded: List[ConfirmUploadedPhoto]

class PhotoPublicItem(BaseModel):
    id: str
    thumb_url: str
    web_url: str
    width: Optional[int] = None
    height: Optional[int] = None
    uploaded_at: datetime
    similarity: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class GalleryResponse(BaseModel):
    photos: List[PhotoPublicItem]
    next_cursor: Optional[str] = None
    total_count: int
    event_name: str
    event_date: str
    cover_photo_url: Optional[str] = None
