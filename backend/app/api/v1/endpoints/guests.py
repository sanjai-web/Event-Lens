from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.core.database import get_db
from app.core.r2 import r2_storage
from app.models.event import Event, EventStatus
from app.models.photo import Photo
from app.models.guest import Guest
from app.schemas.photo import GalleryResponse, PhotoPublicItem
from app.schemas.guest import GuestRegisterRequest, GuestErasureRequest
from app.services.whatsapp_service import whatsapp_service

router = APIRouter()

@router.get("/public/events/{slug}/info")
async def get_public_event_info(slug: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Event).where(Event.slug == slug)
    res = await db.execute(stmt)
    event = res.scalar_one_or_none()
    if not event or event.status == EventStatus.DELETED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    total_photos = await db.scalar(select(func.count(Photo.id)).where(Photo.event_id == event.id)) or 0

    return {
        "id": event.id,
        "slug": event.slug,
        "name": event.name,
        "event_date": str(event.event_date),
        "status": event.status,
        "total_photos": total_photos,
        "cover_photo_url": event.cover_photo_url,
        "face_search_enabled": event.face_search_enabled,
        "whatsapp_delivery_enabled": event.whatsapp_delivery_enabled,
    }

@router.get("/public/events/{slug}/gallery", response_model=GalleryResponse)
async def get_public_gallery(
    slug: str,
    cursor: Optional[str] = None,
    limit: int = Query(default=40, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Event).where(Event.slug == slug)
    res = await db.execute(stmt)
    event = res.scalar_one_or_none()
    if not event or event.status == EventStatus.DELETED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    total_count = await db.scalar(select(func.count(Photo.id)).where(Photo.event_id == event.id)) or 0

    photo_query = select(Photo).where(Photo.event_id == event.id)
    if cursor:
        photo_query = photo_query.where(Photo.id < cursor)
    photo_query = photo_query.order_by(Photo.uploaded_at.desc(), Photo.id.desc()).limit(limit + 1)

    photos_res = await db.execute(photo_query)
    photo_records = photos_res.scalars().all()

    has_more = len(photo_records) > limit
    records_to_return = photo_records[:limit]
    next_cursor = records_to_return[-1].id if has_more and records_to_return else None

    items = [
        PhotoPublicItem(
            id=p.id,
            thumb_url=r2_storage.get_public_url(p.r2_key_thumb or p.r2_key_original),
            web_url=r2_storage.get_public_url(p.r2_key_web or p.r2_key_original),
            width=p.width,
            height=p.height,
            uploaded_at=p.uploaded_at
        )
        for p in records_to_return
    ]

    return GalleryResponse(
        photos=items,
        next_cursor=next_cursor,
        total_count=total_count,
        event_name=event.name,
        event_date=str(event.event_date),
        cover_photo_url=event.cover_photo_url
    )

@router.post("/public/events/{slug}/guests")
async def register_guest(
    slug: str,
    req: GuestRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Event).where(Event.slug == slug)
    res = await db.execute(stmt)
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    guest = Guest(
        event_id=event.id,
        phone_number=req.phone_number,
        whatsapp_opt_in=req.whatsapp_opt_in,
    )
    db.add(guest)
    await db.commit()

    # Send initial welcome / confirmation ping if opt-in enabled
    if req.whatsapp_opt_in and event.whatsapp_delivery_enabled:
        gallery_url = f"https://eventlens.in/e/{event.slug}"
        await whatsapp_service.send_photos_ready_notification(
            phone_number=req.phone_number,
            event_name=event.name,
            gallery_url=gallery_url,
            matched_count=0
        )

    return {"status": "success", "message": "Registered for WhatsApp photo updates."}

@router.post("/public/events/{slug}/erase-my-data")
async def erase_guest_data(
    slug: str,
    req: GuestErasureRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    DPDP Act Compliance: Right to Erasure.
    Locates guest records, deletes stored selfie images from R2,
    removes biometric embeddings, and revokes WhatsApp opt-in.
    """
    stmt = select(Event).where(Event.slug == slug)
    res = await db.execute(stmt)
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    # Find matching guests by event_id and phone_number
    guest_stmt = select(Guest).where(Guest.event_id == event.id, Guest.phone_number == req.phone_number)
    guest_res = await db.execute(guest_stmt)
    guests = guest_res.scalars().all()

    if not guests:
        return {
            "status": "not_found",
            "message": "No records or opt-in data found matching this phone number."
        }

    erased_count = 0
    for g in guests:
        if g.selfie_r2_key:
            r2_storage.delete_objects([g.selfie_r2_key])
        
        await db.delete(g)
        erased_count += 1

    await db.commit()

    return {
        "status": "success",
        "message": f"Successfully erased {erased_count} guest record(s), selfie assets, and WhatsApp notification registrations as per DPDP Act."
    }

