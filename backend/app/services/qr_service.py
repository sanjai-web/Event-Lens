import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import RadialGradiantColorMask, SolidFillColorMask
import io
import base64
from PIL import Image, ImageDraw, ImageFont

class QRService:
    @staticmethod
    def generate_event_qr_base64(url: str, event_name: str = "") -> str:
        """Generates a high-quality stylized QR code returned as a Base64 data URL."""
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=12,
            border=3,
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Generate QR image with modern rounded dots
        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=RoundedModuleDrawer(),
            color_mask=SolidFillColorMask(front_color=(26, 26, 26), back_color=(250, 250, 248)),
        ).convert("RGBA")

        # Convert to Base64 data URL
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{img_str}"

    @staticmethod
    def generate_qr_bytes(url: str) -> bytes:
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=16,
            border=2,
        )
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#1A1A1A", back_color="#FAFAF8").convert("RGB")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        return buffered.getvalue()

qr_service = QRService()
