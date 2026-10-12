import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
import uuid

from app.core.database import get_db, AsyncSessionLocal
from app.core.limiter import limiter
from app.core.r2 import r2_storage
from app.models.photographer import Photographer
from app.models.event import Event, EventStatus
from app.models.photo import Photo
from app.models.job_queue import JobQueue
from app.schemas.photo import PresignRequest, PresignBatchResponse, PresignedUrlItem, ConfirmBatchRequest, PhotoPublicItem
from app.api.v1.deps import get_current_photographer
from app.services.face_service import face_service
from app.services.image_service import image_service
from app.models.face_embedding import FaceEmbedding
from app.core.config import settings

logger = logging.getLogger(__name__)

async def process_photos_background(items: list):
    """Processes uploaded photos immediately: generates WebP variants and extracts ArcFace embeddings."""
    async with AsyncSessionLocal() as db:
        for it in items:
            try:
                orig_bytes = r2_storage.get_bytes(it["r2_key_original"])
                if not orig_bytes:
                    continue

                # Generate variants
                web_bytes, thumb_bytes, orig_w, orig_h = image_service.generate_variants(orig_bytes)
                r2_storage.upload_bytes(it["r2_key_web"], web_bytes, "image/webp")
                r2_storage.upload_bytes(it["r2_key_thumb"], thumb_bytes, "image/webp")

                # Extract real faces
                detected_faces = face_service.process_image_faces(orig_bytes)
                for f in detected_faces:
                    db.add(FaceEmbedding(
                        photo_id=it["photo_id"],
                        event_id=it["event_id"],
                        model_version=settings.FACE_MODEL_VERSION,
                        embedding=f["embedding"],
                        bbox=f.get("bbox"),
                        landmarks=f.get("landmarks"),
                    ))

                # Update Photo status
                stmt = select(Photo).where(Photo.id == it["photo_id"])
                res = await db.execute(stmt)
                photo = res.scalar_one_or_none()
                if photo:
                    photo.width = orig_w
                    photo.height = orig_h
                    photo.face_processed = True
                    photo.face_count = len(detected_faces)

                await db.commit()
                logger.info(f"Photo {it['photo_id']} indexed with {len(detected_faces)} ArcFace faces.")
            except Exception as e:
                logger.error(f"Error in background processing of photo {it.get('photo_id')}: {e}", exc_info=True)

router = APIRouter()

@router.post("/{event_id}/photos/presign", response_model=PresignBatchResponse)
@limiter.limit("30/minute")
async def get_presigned_upload_urls(
    request: Request,
    event_id: str,
    req: PresignRequest,
    current_user: Photographer = Depends(get_current_photographer),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Event).where(Event.id == event_id, Event.photographer_id == current_user.id)
    res = await db.execute(stmt)
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    # Strictly require event to be LIVE (payment completed)
    if event.status != EventStatus.LIVE:
        if settings.ENVIRONMENT == "development":
            event.status = EventStatus.LIVE
            await db.commit()
        else:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Cannot upload photos. Event is '{event.status.value}'. Payment is required to activate event uploads."
            )

    # Calculate total size of incoming batch in MB
    incoming_bytes = sum(f.size_bytes for f in req.files)
    incoming_mb = int(incoming_bytes / (1024 * 1024))

    if event.storage_used_mb + incoming_mb > event.storage_limit_mb:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Storage limit exceeded! You have {event.storage_limit_mb - event.storage_used_mb} MB remaining, but batch is {incoming_mb} MB. Please upgrade tier."
        )

    items: List[PresignedUrlItem] = []
    for f in req.files:
        photo_id = str(uuid.uuid4())
        extension = f.filename.split(".")[-1].lower() if "." in f.filename else "jpg"
        r2_key = f"events/{event.id}/originals/{photo_id}.{extension}"
        presigned_url = r2_storage.generate_presigned_put_url(key=r2_key, content_type=f.content_type)

        items.append(PresignedUrlItem(
            photo_id=photo_id,
            r2_key_original=r2_key,
            presigned_put_url=presigned_url
        ))

    return PresignBatchResponse(
        items=items,
        storage_used_mb=event.storage_used_mb,
        storage_limit_mb=event.storage_limit_mb
    )

@router.post("/{event_id}/photos/confirm")
async def confirm_uploaded_photos(
    event_id: str,
    req: ConfirmBatchRequest,
    background_tasks: BackgroundTasks,
    current_user: Photographer = Depends(get_current_photographer),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Event).where(Event.id == event_id, Event.photographer_id == current_user.id)
    res = await db.execute(stmt)
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    if event.status != EventStatus.LIVE:
        if settings.ENVIRONMENT == "development":
            event.status = EventStatus.LIVE
            await db.commit()
        else:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Cannot confirm photos. Event is '{event.status.value}'. Payment required."
            )

    total_added_bytes = 0
    created_photos = []
    bg_items = []

    for item in req.uploaded:
        # Verify object actually exists in R2 storage
        if not r2_storage.head_object(item.r2_key_original):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Storage verification failed: Object '{item.r2_key_original}' was not found in storage. Ensure upload finished before confirming."
            )

        total_added_bytes += item.file_size_bytes
        
        ext = item.r2_key_original.split(".")[-1]
        thumb_key = f"events/{event.id}/thumbs/{item.photo_id}.webp"
        web_key = f"events/{event.id}/web/{item.photo_id}.webp"

        photo = Photo(
            id=item.photo_id,
            event_id=event.id,
            r2_key_original=item.r2_key_original,
            r2_key_web=web_key,
            r2_key_thumb=thumb_key,
            original_filename=item.original_filename,
            file_size_bytes=item.file_size_bytes,
            width=item.width or 1920,
            height=item.height or 1080,
            face_processed=False,
        )
        db.add(photo)
        created_photos.append(photo)

        bg_items.append({
            "photo_id": item.photo_id,
            "event_id": event.id,
            "r2_key_original": item.r2_key_original,
            "r2_key_web": web_key,
            "r2_key_thumb": thumb_key,
        })

        # Enqueue in job_queue as well for persistent worker auditing
        job = JobQueue(
            job_type="process_photo",
            payload={
                "photo_id": item.photo_id,
                "event_id": event.id,
                "r2_key_original": item.r2_key_original,
                "r2_key_web": web_key,
                "r2_key_thumb": thumb_key,
                "width": item.width or 1920,
                "height": item.height or 1080,
            }
        )
        db.add(job)

    # Update event storage
    added_mb = max(1, int(total_added_bytes / (1024 * 1024)))
    event.storage_used_mb += added_mb

    await db.commit()

    # Launch background facial recognition immediately
    if bg_items:
        background_tasks.add_task(process_photos_background, bg_items)

    return {
        "status": "success",
        "photos_confirmed": len(created_photos),
        "storage_used_mb": event.storage_used_mb
    }

@router.get("/{event_id}/photos")
async def list_event_photos(
    event_id: str,
    current_user: Photographer = Depends(get_current_photographer),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Photo)
        .where(Photo.event_id == event_id)
        .order_by(Photo.uploaded_at.desc())
        .limit(100)
    )
    res = await db.execute(stmt)
    photos = res.scalars().all()

    return [
        {
            "id": p.id,
            "thumb_url": r2_storage.get_public_url(p.r2_key_thumb or p.r2_key_original),
            "web_url": r2_storage.get_public_url(p.r2_key_web or p.r2_key_original),
            "original_filename": p.original_filename,
            "face_processed": p.face_processed,
            "face_count": p.face_count,
            "uploaded_at": p.uploaded_at,
        }
        for p in photos
    ]

@router.delete("/{event_id}/photos/{photo_id}")
async def delete_photo(
    event_id: str,
    photo_id: str,
    current_user: Photographer = Depends(get_current_photographer),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Photo).where(Photo.id == photo_id, Photo.event_id == event_id)
    res = await db.execute(stmt)
    photo = res.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found.")
    await db.delete(photo)
    await db.commit()
    return {"status": "success", "message": "Photo deleted"}

