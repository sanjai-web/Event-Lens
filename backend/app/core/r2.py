import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from app.core.config import settings
import logging
import os
from typing import Optional, List

logger = logging.getLogger(__name__)

class R2StorageService:
    def __init__(self):
        self.endpoint_url = settings.R2_ENDPOINT_URL
        self.access_key = settings.R2_ACCESS_KEY_ID
        self.secret_key = settings.R2_SECRET_ACCESS_KEY
        self.bucket_name = settings.R2_BUCKET_NAME
        self.public_url = settings.R2_PUBLIC_URL.rstrip('/')
        
        # Local storage directory fallback (inside backend/uploads)
        self.local_dir = os.path.abspath(
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
        )
        os.makedirs(self.local_dir, exist_ok=True)
        
        self.is_configured = bool(
            self.endpoint_url 
            and self.access_key 
            and self.secret_key 
            and "<your_" not in self.endpoint_url 
            and "your_r2_" not in self.access_key
        )
        
        if self.is_configured:
            try:
                self.s3_client = boto3.client(
                    "s3",
                    endpoint_url=self.endpoint_url,
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                    config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
                )
            except Exception as e:
                logger.warning(f"Could not initialize S3 client with configured endpoint ({e}). Local folder storage mode enabled.")
                self.s3_client = None
                self.is_configured = False
        else:
            self.s3_client = None
            logger.info(f"R2 credentials not set. Saving all uploaded photos locally in: {self.local_dir}")

    def _get_local_path(self, key: str) -> str:
        safe_key = key.lstrip("/").replace("/", os.sep)
        return os.path.join(self.local_dir, safe_key)

    def generate_presigned_put_url(self, key: str, content_type: str = "image/jpeg", expires_in: int = 900) -> str:
        """Generate a presigned PUT URL for direct client-to-R2 upload (15 min default expiry)."""
        if not self.is_configured:
            # Return development local upload URL
            return f"http://localhost:8000/api/v1/dev-upload?key={key}"
            
        try:
            url = self.s3_client.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": key,
                    "ContentType": content_type,
                },
                ExpiresIn=expires_in,
            )
            return url
        except ClientError as e:
            logger.error(f"Error generating presigned upload URL for {key}: {e}")
            raise e

    def get_public_url(self, key: str) -> str:
        """Returns the public CDN / direct URL for an R2 key or local media URL."""
        if not key:
            return ""
        if key.startswith("http://") or key.startswith("https://"):
            return key
        if self.is_configured and self.public_url:
            return f"{self.public_url}/{key}"
        # Local folder serving via FastAPI StaticFiles
        # If the requested variant (thumb or web) does not exist on disk yet,
        # fall back to the original uploaded photo so images are never broken!
        if not self.is_configured:
            dest = self._get_local_path(key)
            if not os.path.exists(dest):
                if "/thumbs/" in key or "/web/" in key:
                    orig_base = key.replace("/thumbs/", "/originals/").replace("/web/", "/originals/")
                    orig_prefix = os.path.splitext(orig_base)[0]
                    for ext in [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG"]:
                        test_k = orig_prefix + ext
                        if os.path.exists(self._get_local_path(test_k)):
                            return f"http://localhost:8000/media/{test_k}"
        return f"http://localhost:8000/media/{key}"

    def upload_bytes(self, key: str, data: bytes, content_type: str = "image/webp") -> bool:
        """Upload raw bytes to R2 or write directly to local folder."""
        if not self.is_configured:
            try:
                dest = self._get_local_path(key)
                os.makedirs(os.path.dirname(dest), exist_ok=True)
                with open(dest, "wb") as f:
                    f.write(data)
                logger.info(f"[Local Storage] Saved file to disk: {dest} ({len(data)} bytes)")
                return True
            except Exception as e:
                logger.error(f"Error writing file to local disk {key}: {e}")
                return False
            
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=data,
                ContentType=content_type,
                CacheControl="public, max-age=31536000, immutable",
            )
            return True
        except ClientError as e:
            logger.error(f"Error uploading bytes to R2 key {key}: {e}")
            return False

    def get_bytes(self, key: str) -> Optional[bytes]:
        """Reads raw bytes for a key from local storage or R2."""
        if not self.is_configured:
            dest = self._get_local_path(key)
            if os.path.exists(dest):
                try:
                    with open(dest, "rb") as f:
                        return f.read()
                except Exception as e:
                    logger.error(f"Error reading local file {dest}: {e}")
            return None
        try:
            resp = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            return resp["Body"].read()
        except Exception as e:
            logger.error(f"Error fetching R2 object {key}: {e}")
            return None

    def delete_objects(self, keys: List[str]) -> bool:
        """Delete multiple objects from R2 or local disk."""
        if not keys:
            return True
        if not self.is_configured:
            for k in keys:
                p = self._get_local_path(k)
                if os.path.exists(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass
            return True
            
        try:
            delete_payload = {"Objects": [{"Key": k} for k in keys]}
            self.s3_client.delete_objects(Bucket=self.bucket_name, Delete=delete_payload)
            return True
        except ClientError as e:
            logger.error(f"Error deleting objects from R2: {e}")
            return False

    def head_object(self, key: str) -> bool:
        """Verifies if an object actually exists in R2 or local folder."""
        if not self.is_configured:
            dest = self._get_local_path(key)
            return os.path.exists(dest)
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            if error_code in ["404", "NoSuchKey", "NotFound"]:
                return False
            logger.warning(f"Error checking head_object for {key}: {e}")
            return False

    def test_connection(self) -> bool:
        """Tests connectivity to R2 bucket or local directory."""
        if not self.is_configured:
            return os.path.exists(self.local_dir)
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            return True
        except Exception as e:
            logger.error(f"R2 health check failed: {e}")
            return False

r2_storage = R2StorageService()

