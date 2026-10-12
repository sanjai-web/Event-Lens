from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.config import settings
from app.models.photographer import Photographer
from app.models.event import Event, EventStatus
from app.models.payment import Payment
from app.models.photo import Photo
from app.schemas.payment import CreateOrderRequest, CreateOrderResponse, VerifyPaymentRequest, PaymentStatusResponse
from app.api.v1.deps import get_current_photographer
from app.services.razorpay_service import razorpay_service

router = APIRouter()

@router.post("/create-order", response_model=CreateOrderResponse)
async def create_payment_order(
    req: CreateOrderRequest,
    current_user: Photographer = Depends(get_current_photographer),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Event).where(Event.id == req.event_id, Event.photographer_id == current_user.id)
    res = await db.execute(stmt)
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    tier_info = settings.TIER_PRICING.get(req.plan_tier, settings.TIER_PRICING["standard_25gb"])
    amount_paise = tier_info["price_paise"]

    rzp_order = razorpay_service.create_order(
        amount_paise=amount_paise,
        receipt_id=f"order_{event.id[:8]}",
        notes={"event_id": event.id, "photographer_id": current_user.id, "tier": req.plan_tier}
    )

    payment = Payment(
        event_id=event.id,
        photographer_id=current_user.id,
        razorpay_order_id=rzp_order["id"],
        amount_paise=amount_paise,
        currency="INR",
        tier_selected=req.plan_tier,
        status="pending"
    )
    db.add(payment)
    await db.commit()

    return CreateOrderResponse(
        order_id=rzp_order["id"],
        amount_paise=amount_paise,
        currency="INR",
        key_id=rzp_order.get("key_id", settings.RAZORPAY_KEY_ID or "rzp_test_mock")
    )

@router.post("/verify")
async def verify_payment(
    req: VerifyPaymentRequest,
    current_user: Photographer = Depends(get_current_photographer),
    db: AsyncSession = Depends(get_db)
):
    is_valid = razorpay_service.verify_payment_signature(
        order_id=req.razorpay_order_id,
        payment_id=req.razorpay_payment_id,
        signature=req.razorpay_signature
    )
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment signature.")

    stmt = select(Payment).where(Payment.razorpay_order_id == req.razorpay_order_id)
    res = await db.execute(stmt)
    payment = res.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found.")

    payment.razorpay_payment_id = req.razorpay_payment_id
    payment.razorpay_signature = req.razorpay_signature
    payment.status = "paid"
    payment.verified_at = datetime.now(timezone.utc)

    # Activate event to LIVE & set storage limit
    event_stmt = select(Event).where(Event.id == payment.event_id)
    event_res = await db.execute(event_stmt)
    event = event_res.scalar_one_or_none()
    if event:
        tier_info = settings.TIER_PRICING.get(payment.tier_selected, settings.TIER_PRICING["standard_25gb"])
        event.status = EventStatus.LIVE
        event.live_started_at = datetime.now(timezone.utc)
        event.storage_limit_mb = tier_info["storage_mb"]
        event.plan_tier = payment.tier_selected

    await db.commit()
    return {"status": "success", "message": "Payment verified. Event is now LIVE!"}

@router.post("/webhook")
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not razorpay_service.verify_webhook_signature(body, signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature.")

    payload = await request.json()
    event_type = payload.get("event")

    if event_type == "order.paid":
        order_entity = payload.get("payload", {}).get("order", {}).get("entity", {})
        order_id = order_entity.get("id")

        if order_id:
            stmt = select(Payment).where(Payment.razorpay_order_id == order_id)
            res = await db.execute(stmt)
            payment = res.scalar_one_or_none()
            if payment and payment.status != "paid":
                payment.status = "paid"
                payment.verified_at = datetime.now(timezone.utc)

                event_stmt = select(Event).where(Event.id == payment.event_id)
                event_res = await db.execute(event_stmt)
                event = event_res.scalar_one_or_none()
                if event:
                    tier_info = settings.TIER_PRICING.get(payment.tier_selected, settings.TIER_PRICING["standard_25gb"])
                    event.status = EventStatus.LIVE
                    event.storage_limit_mb = tier_info["storage_mb"]

                await db.commit()

    elif event_type in ["refund.processed", "payment.refunded"]:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        payment_id = payment_entity.get("id")
        if payment_id:
            stmt = select(Payment).where(Payment.razorpay_payment_id == payment_id)
            res = await db.execute(stmt)
            payment = res.scalar_one_or_none()
            if payment and payment.status != "refunded":
                payment.status = "refunded"
                event_stmt = select(Event).where(Event.id == payment.event_id)
                ev = (await db.execute(event_stmt)).scalar_one_or_none()
                if ev:
                    ev.status = EventStatus.CREATED
                await db.commit()

    return {"status": "ok"}

@router.post("/{payment_id}/refund")
async def request_refund(
    payment_id: str,
    current_user: Photographer = Depends(get_current_photographer),
    db: AsyncSession = Depends(get_db)
):
    """
    Refund Path:
    Matches published refund policy: 100% refund eligible if requested within 48 hours
    and 0 photos have been confirmed/uploaded to the event.
    """
    stmt = select(Payment).where(Payment.id == payment_id, Payment.photographer_id == current_user.id)
    res = await db.execute(stmt)
    payment = res.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found.")

    if payment.status != "paid":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot refund payment with status '{payment.status}'.")

    # Check photo count
    photo_count = await db.scalar(select(func.count(Photo.id)).where(Photo.event_id == payment.event_id)) or 0
    if photo_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refund not eligible: Photos have already been uploaded and processed for this event."
        )

    # Check 48h refund window
    now = datetime.now(timezone.utc)
    payment_time = payment.verified_at or payment.created_at
    if payment_time and (now - payment_time) > timedelta(hours=48):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refund window expired (must be requested within 48 hours of purchase)."
        )

    # Initiate refund via Razorpay service
    refund_res = razorpay_service.initiate_refund(
        payment_id=payment.razorpay_payment_id or f"pay_mock_{payment.id[:8]}",
        amount_paise=payment.amount_paise,
        notes={"reason": "Photographer requested refund prior to uploads", "event_id": payment.event_id}
    )

    payment.status = "refunded"
    event_stmt = select(Event).where(Event.id == payment.event_id)
    ev = (await db.execute(event_stmt)).scalar_one_or_none()
    if ev:
        ev.status = EventStatus.CREATED

    await db.commit()

    return {
        "status": "success",
        "message": "Refund processed successfully.",
        "refund_id": refund_res.get("id"),
        "amount_paise": payment.amount_paise
    }

