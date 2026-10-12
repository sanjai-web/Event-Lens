import hmac
import hashlib
import uuid
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class RazorpayService:
    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.is_configured = bool(
            self.key_id 
            and self.key_secret 
            and not self.key_id.startswith("rzp_test_your_key") 
            and "your_razorpay_" not in self.key_secret
        )

    def create_order(self, amount_paise: int, receipt_id: str, notes: dict = None) -> dict:
        """Creates a Razorpay order or returns simulated order if keys not configured or test placeholder."""
        if not self.is_configured:
            fake_order_id = f"order_dev_{uuid.uuid4().hex[:14]}"
            logger.info(f"[Dev Mock] Created simulated Razorpay order: {fake_order_id} for {amount_paise} paise")
            return {
                "id": fake_order_id,
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt_id,
                "status": "created",
                "key_id": "rzp_test_mock_key_id",
            }
        
        try:
            import razorpay
            client = razorpay.Client(auth=(self.key_id, self.key_secret))
            order_data = {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt_id,
                "notes": notes or {},
                "payment_capture": 1
            }
            order = client.order.create(data=order_data)
            order["key_id"] = self.key_id
            return order
        except Exception as e:
            logger.warning(f"Razorpay order creation failed: {e}. Falling back to simulated order.")
            fake_order_id = f"order_dev_{uuid.uuid4().hex[:14]}"
            return {
                "id": fake_order_id,
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt_id,
                "status": "created",
                "key_id": self.key_id,
            }

    def verify_payment_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        """Verifies HMAC-SHA256 signature for payment confirmation."""
        if not self.is_configured:
            # In local dev test mode, accept simulated signature
            return True

        msg = f"{order_id}|{payment_id}".encode("utf-8")
        generated_signature = hmac.new(
            self.key_secret.encode("utf-8"),
            msg,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(generated_signature, signature)

    def verify_webhook_signature(self, body: bytes, signature: str) -> bool:
        webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET or self.key_secret
        if not webhook_secret:
            return True
            
        generated_signature = hmac.new(
            webhook_secret.encode("utf-8"),
            body,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(generated_signature, signature)

    def initiate_refund(self, payment_id: str, amount_paise: int, notes: dict = None) -> dict:
        """Initiates a refund via Razorpay or simulated refund in dev mode."""
        if not self.is_configured:
            fake_refund_id = f"rfnd_dev_{uuid.uuid4().hex[:14]}"
            logger.info(f"[Dev Mock] Simulated Razorpay refund {fake_refund_id} for {amount_paise} paise on payment {payment_id}")
            return {
                "id": fake_refund_id,
                "payment_id": payment_id,
                "amount": amount_paise,
                "status": "processed"
            }
        try:
            import razorpay
            client = razorpay.Client(auth=(self.key_id, self.key_secret))
            refund_data = {
                "amount": amount_paise,
                "notes": notes or {}
            }
            return client.payment.refund(payment_id, refund_data)
        except Exception as e:
            logger.error(f"Razorpay refund error: {e}")
            raise e

razorpay_service = RazorpayService()

