from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
import re
import uuid

from app.core.database import get_db
from app.core.config import settings
from app.models.photographer import Photographer
from app.models.event import Event, EventStatus
from app.models.photo import Photo
from app.models.guest import Guest
from app.schemas.event import EventCreate, EventUpdate, EventListItem, EventDetail, CreateEventResponse
from app.api.v1.deps import get_current_photographer
from app.services.qr_service import qr_service
from app.services.razorpay_service import razorpay_service

router = APIRouter()

def slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return f"{s}-{uuid.uuid4().hex[:6]}"

@router.post("", response_model=CreateEventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    req: EventCreate,
    current_user: Photographer = Depends(get_current_photographer),
    db: AsyncSession = Depends(get_db)
):
    tier_info = settings.TIER_PRICING.get(req.plan_tier, settings.TIER_PRICING["standard_25gb"])
    slug = slugify(req.name)
    public_url = f"https://eventlens.in/e/{slug}" # Or local URL
    qr_data_url = qr_service.generate_event_qr_base64(public_url, req.name)

    # In development or if Razorpay keys not set, auto-activate as LIVE
    initial_status = EventStatus.LIVE if (settings.ENVIRONMENT == "development" or not settings.RAZORPAY_KEY_ID) else EventStatus.CREATED

    event = Event(
        photographer_id=current_user.id,
        slug=slug,
        name=req.name,
        event_date=req.event_date,
        status=initial_status,
        plan_tier=req.plan_tier,
        storage_limit_mb=tier_info["storage_mb"],
        storage_used_mb=0,
        qr_code_url=qr_data_url,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    # Generate Razorpay Order
    rzp_order = razorpay_service.create_order(
        amount_paise=tier_info["price_paise"],
        receipt_id=f"rcpt_{event.id[:8]}",
        notes={"event_id": event.id, "photographer_id": current_user.id, "tier": req.plan_tier}
    )

    event_item = EventListItem(
        id=event.id,
        slug=event.slug,
        name=event.name,
        event_date=event.event_date,
        status=event.status,
        plan_tier=event.plan_tier,
        storage_limit_mb=event.storage_limit_mb,
        storage_used_mb=event.storage_used_mb,
        photo_count=0,
        guest_count=0,
        cover_photo_url=event.cover_photo_url,
        qr_code_url=event.qr_code_url,
        created_at=event.created_at,
    )

    return CreateEventResponse(
        event=event_item,
        razorpay_order_id=rzp_order.get("id"),
        amount_paise=tier_info["price_paise"],
        currency="INR",
        key_id=rzp_order.get("key_id", settings.RAZORPAY_KEY_ID or "rzp_test_mock")
    )

@router.get("", response_model=List[EventListItem])
async def list_my_events(
    current_user: Photographer = Depends(get_current_photographer),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(
            Event,
            func.count(Photo.id.distinct()).label("photo_count"),
            func.count(Guest.id.distinct()).label("guest_count")
        )
        .outerjoin(Photo, Photo.event_id == Event.id)
        .outerjoin(Guest, Guest.event_id == Event.id)
        .where(Event.photographer_id == current_user.id)
        .group_by(Event.id)
        .order_by(Event.created_at.desc())
    )
    res = await db.execute(stmt)
    rows = res.all()

    items = []
    for event, photo_count, guest_count in rows:
        items.append(EventListItem(
            id=event.id,
            slug=event.slug,
            name=event.name,
            event_date=event.event_date,
            status=event.status,
            plan_tier=event.plan_tier,
            storage_limit_mb=event.storage_limit_mb,
            storage_used_mb=event.storage_used_mb,
            photo_count=photo_count,
            guest_count=guest_count,
            cover_photo_url=event.cover_photo_url,
            qr_code_url=event.qr_code_url,
            created_at=event.created_at,
        ))
    return items

@router.get("/{event_id}", response_model=EventDetail)
async def get_event_detail(
    event_id: str,
    current_user: Photographer = Depends(get_current_photographer),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Event).where(Event.id == event_id, Event.photographer_id == current_user.id)
    res = await db.execute(stmt)
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    # Photo and guest counts
    photo_count = await db.scalar(select(func.count(Photo.id)).where(Photo.event_id == event.id)) or 0
    guest_count = await db.scalar(select(func.count(Guest.id)).where(Guest.event_id == event.id)) or 0

    public_gallery_url = f"/e/{event.slug}"
    selfie_search_url = f"/e/{event.slug}/selfie"

    return EventDetail(
        id=event.id,
        photographer_id=event.photographer_id,
        slug=event.slug,
        name=event.name,
        event_date=event.event_date,
        status=event.status,
        plan_tier=event.plan_tier,
        storage_limit_mb=event.storage_limit_mb,
        storage_used_mb=event.storage_used_mb,
        photo_count=photo_count,
        guest_count=guest_count,
        cover_photo_url=event.cover_photo_url,
        qr_code_url=event.qr_code_url,
        face_search_enabled=event.face_search_enabled,
        whatsapp_delivery_enabled=event.whatsapp_delivery_enabled,
        public_gallery_url=public_gallery_url,
        selfie_search_url=selfie_search_url,
        live_started_at=event.live_started_at,
        archived_at=event.archived_at,
        deleted_at=event.deleted_at,
        created_at=event.created_at,
    )

@router.patch("/{event_id}", response_model=EventDetail)
async def update_event(
    event_id: str,
    req: EventUpdate,
    current_user: Photographer = Depends(get_current_photographer),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Event).where(Event.id == event_id, Event.photographer_id == current_user.id)
    res = await db.execute(stmt)
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    if req.name is not None:
        event.name = req.name
    if req.event_date is not None:
        event.event_date = req.event_date
    if req.status is not None:
        event.status = req.status
    if req.face_search_enabled is not None:
        event.face_search_enabled = req.face_search_enabled
    if req.whatsapp_delivery_enabled is not None:
        event.whatsapp_delivery_enabled = req.whatsapp_delivery_enabled

    await db.commit()
    await db.refresh(event)

    return await get_event_detail(event.id, current_user, db)

@router.get("/{event_id}/qr/download")
async def download_event_qr(
    event_id: str,
    current_user: Photographer = Depends(get_current_photographer),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Event).where(Event.id == event_id, Event.photographer_id == current_user.id)
    res = await db.execute(stmt)
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    url = f"https://eventlens.in/e/{event.slug}"
    qr_png = qr_service.generate_qr_bytes(url)
    return Response(
        content=qr_png,
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="{event.slug}-qr.png"'}
    )

@router.post("/{event_id}/renew")
async def renew_event_retention(
    event_id: str,
    days: int = 30,
    current_user: Photographer = Depends(get_current_photographer),
    db: AsyncSession = Depends(get_db)
):
    """
    Extends/resets the retention timer for an event by the specified days (default: 30 days).
    Prevents automatic archival or deletion.
    """
    stmt = select(Event).where(Event.id == event_id, Event.photographer_id == current_user.id)
    res = await db.execute(stmt)
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    base_time = event.retention_extended_until if (event.retention_extended_until and event.retention_extended_until > now) else now
    event.retention_extended_until = base_time + timedelta(days=days)

    if event.status == EventStatus.ARCHIVED:
        event.status = EventStatus.ACTIVE
        event.archived_at = None

    await db.commit()
    await db.refresh(event)

    return {
        "status": "success",
        "message": f"Event retention extended by {days} days.",
        "retention_extended_until": event.retention_extended_until.isoformat(),
        "event_status": event.status.value
    }

