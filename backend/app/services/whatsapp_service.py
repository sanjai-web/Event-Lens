import asyncio
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class WhatsAppService:
    def __init__(self):
        self.api_token = settings.WHATSAPP_API_TOKEN
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        self.is_configured = bool(
            self.api_token 
            and self.phone_number_id 
            and "your_whatsapp_" not in self.phone_number_id 
            and "your_meta_" not in self.api_token
        )
        self.base_url = f"https://graph.facebook.com/v19.0/{self.phone_number_id}/messages"

    async def send_photos_ready_notification(
        self,
        phone_number: str,
        event_name: str,
        gallery_url: str,
        matched_count: int = 0
    ) -> bool:
        """
        Dispatches pre-approved Meta WhatsApp template message:
        Template: event_photos_ready
        Parameters: {{1}} Event Name, {{2}} Photos Count, {{3}} Gallery Link
        Includes exponential backoff retry for 429 rate limits and temporary 5xx errors.
        """
        # Clean phone number (strip +, spaces)
        clean_phone = phone_number.replace("+", "").replace(" ", "").replace("-", "")

        if not self.is_configured:
            logger.info(
                f"[Dev Mock WhatsApp] Sent to +{clean_phone} for event '{event_name}': "
                f"Your {matched_count} photos are ready! View at: {gallery_url}"
            )
            return True

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "messaging_product": "whatsapp",
            "to": clean_phone,
            "type": "template",
            "template": {
                "name": "event_photos_ready",
                "language": {"code": "en"},
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": event_name},
                            {"type": "text", "text": str(matched_count)},
                            {"type": "text", "text": gallery_url}
                        ]
                    }
                ]
            }
        }

        max_retries = 3
        backoff_sec = 1.0

        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(self.base_url, headers=headers, json=payload)
                    if response.status_code in [200, 201]:
                        logger.info(f"WhatsApp notification sent successfully to {clean_phone} (attempt {attempt})")
                        return True
                    elif response.status_code in [429, 500, 502, 503, 504]:
                        logger.warning(
                            f"WhatsApp API rate-limit/server error {response.status_code} on attempt {attempt}. Retrying in {backoff_sec}s..."
                        )
                        await asyncio.sleep(backoff_sec)
                        backoff_sec *= 2.0
                    else:
                        logger.error(f"WhatsApp API non-retryable error {response.status_code}: {response.text}")
                        return False
            except Exception as e:
                logger.warning(f"Network error sending WhatsApp to {clean_phone} on attempt {attempt}: {e}")
                if attempt < max_retries:
                    await asyncio.sleep(backoff_sec)
                    backoff_sec *= 2.0
                else:
                    logger.error(f"Failed to send WhatsApp message after {max_retries} attempts.")
                    return False

        return False

whatsapp_service = WhatsAppService()

