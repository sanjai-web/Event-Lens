from PIL import Image, ImageOps
import io
from typing import Tuple

class ImageService:
    @staticmethod
    def get_image_dimensions(image_bytes: bytes) -> Tuple[int, int]:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img = ImageOps.exif_transpose(img)
            return img.width, img.height

    @staticmethod
    def generate_variants(image_bytes: bytes) -> Tuple[bytes, bytes, int, int]:
        """
        Takes raw image bytes, auto-rotates via EXIF, and generates:
        1. Web variant (max 2048px, WebP, quality 85)
        2. Thumb variant (max 500px, WebP, quality 75)
        Returns: (web_bytes, thumb_bytes, original_width, original_height)
        """
        with Image.open(io.BytesIO(image_bytes)) as img:
            img = ImageOps.exif_transpose(img)
            orig_w, orig_h = img.width, img.height
            
            # 1. Web variant
            web_img = img.copy()
            web_img.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
            web_buffer = io.BytesIO()
            web_img.save(web_buffer, format="WEBP", quality=85, method=4)
            web_bytes = web_buffer.getvalue()

            # 2. Thumbnail variant
            thumb_img = img.copy()
            thumb_img.thumbnail((500, 500), Image.Resampling.LANCZOS)
            thumb_buffer = io.BytesIO()
            thumb_img.save(thumb_buffer, format="WEBP", quality=75, method=4)
            thumb_bytes = thumb_buffer.getvalue()

            return web_bytes, thumb_bytes, orig_w, orig_h

image_service = ImageService()
