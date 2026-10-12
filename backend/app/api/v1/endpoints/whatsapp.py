from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from app.core.config import settings
from app.services.whatsapp_service import whatsapp_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/webhook")
async def verify_whatsapp_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """Handles Meta webhook verification challenge during setup."""
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_VERIFY_TOKEN:
        logger.info("WhatsApp webhook verified successfully by Meta challenge.")
        return int(hub_challenge)
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification token mismatch.")

@router.post("/webhook")
async def receive_whatsapp_message(request: Request):
    """Receives inbound messages/status updates from Meta WhatsApp Cloud API."""
    data = await request.json()
    logger.info(f"Received WhatsApp webhook event: {data}")
    # Phase 2: Inbound selfie processing hooks here
    return {"status": "received"}

@router.post("/test-send")
async def test_send_notification(
    phone_number: str,
    event_name: str = "Priya & Rahul Wedding",
    gallery_url: str = "https://eventlens.in/e/priya-rahul-wedding"
):
    success = await whatsapp_service.send_photos_ready_notification(
        phone_number=phone_number,
        event_name=event_name,
        gallery_url=gallery_url,
        matched_count=12
    )
    return {"success": success, "phone_number": phone_number}
