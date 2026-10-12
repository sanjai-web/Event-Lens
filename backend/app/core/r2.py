import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from app.core.config import settings
import logging
from typing import Optional, List

logger = logging.getLogger(__name__)

class R2StorageService:
    def __init__(self):
        self.endpoint_url = settings.R2_ENDPOINT_URL
        self.access_key = settings.R2_ACCESS_KEY_ID
        self.secret_key = settings.R2_SECRET_ACCESS_KEY
        self.bucket_name = settings.R2_BUCKET_NAME
        self.public_url = settings.R2_PUBLIC_URL.rstrip('/')
        
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
                logger.warning(f"Could not initialize S3 client with configured endpoint ({e}). Local fallback mode enabled.")
                self.s3_client = None
                self.is_configured = False
        else:
            self.s3_client = None
            logger.warning("R2 storage credentials not configured or placeholder detected. Local fallback mode enabled.")

    def generate_presigned_put_url(self, key: str, content_type: str = "image/jpeg", expires_in: int = 900) -> str:
        """Generate a presigned PUT URL for direct client-to-R2 upload (15 min default expiry)."""
        if not self.is_configured:
            # Return a development simulated upload URL
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
        """Returns the public CDN / direct URL for an R2 key."""
        if not key:
            return ""
        if key.startswith("http://") or key.startswith("https://"):
            return key
        if self.public_url:
            return f"{self.public_url}/{key}"
        return f"/media/{key}"

    def upload_bytes(self, key: str, data: bytes, content_type: str = "image/webp") -> bool:
        """Upload raw bytes (e.g. generated web/thumb variants) to R2."""
        if not self.is_configured:
            logger.info(f"[Dev Mock] Simulated R2 upload: {key} ({len(data)} bytes)")
            return True
            
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

    def delete_objects(self, keys: List[str]) -> bool:
        """Delete multiple objects from R2 (e.g. for lifecycle cleanup)."""
        if not keys:
            return True
        if not self.is_configured:
            logger.info(f"[Dev Mock] Simulated R2 deletion: {len(keys)} keys")
            return True
            
        try:
            delete_payload = {"Objects": [{"Key": k} for k in keys]}
            self.s3_client.delete_objects(Bucket=self.bucket_name, Delete=delete_payload)
            return True
        except ClientError as e:
            logger.error(f"Error deleting objects from R2: {e}")
            return False

    def head_object(self, key: str) -> bool:
        """Verifies if an object actually exists in R2 storage."""
        if not self.is_configured:
            # In local dev simulation, accept key
            return True
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
        """Tests connectivity to R2 bucket for health check."""
        if not self.is_configured:
            return True
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            return True
        except Exception as e:
            logger.error(f"R2 health check failed: {e}")
            return False

r2_storage = R2StorageService()

