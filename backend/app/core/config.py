from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Optional, List, Union
import json
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "EventLens"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development" # "development", "staging", "production"
    DEBUG: bool = True
    
    # Security / Auth
    SECRET_KEY: str = "eventlens-super-secret-key-change-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:3003",
        "http://127.0.0.1:3003",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://eventlens.in",
        "https://www.eventlens.in",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str):
            if v.startswith("["):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v
    
    # Database: Supports PostgreSQL (pgvector) or MySQL 8.0+ (aiomysql)
    DATABASE_URL: str = "mysql+aiomysql://root:1234@localhost:3306/eventlens"
    
    # Cloudflare R2 / S3 Storage
    R2_ENDPOINT_URL: Optional[str] = ""
    R2_ACCESS_KEY_ID: Optional[str] = ""
    R2_SECRET_ACCESS_KEY: Optional[str] = ""
    R2_BUCKET_NAME: str = "eventlens-media"
    R2_PUBLIC_URL: str = "https://media.eventlens.in"
    
    # AI / Face Embedding Settings
    FACE_MODEL_VERSION: str = "arcface_r50_v1"
    FACE_SIMILARITY_THRESHOLD: float = 0.60 # Cosine similarity >= 0.60 (or distance <= 0.40)
    FACE_DETECTION_CONFIDENCE: float = 0.65
    
    # Razorpay Payments (Sample Test Mode Keys)
    RAZORPAY_KEY_ID: Optional[str] = "rzp_test_TXuZaB5bBrGHnI"
    RAZORPAY_KEY_SECRET: Optional[str] = "o7pOCHUChsYSh9Xxd9CM7srf"
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = "sample_razorpay_webhook_secret_123"
    
    # WhatsApp Business Cloud API
    WHATSAPP_API_TOKEN: Optional[str] = ""
    WHATSAPP_PHONE_NUMBER_ID: Optional[str] = ""
    WHATSAPP_VERIFY_TOKEN: Optional[str] = "eventlens_verify_token"
    
    # Storage Pricing Tiers (MB limits & price in INR paise)
    TIER_PRICING: dict = {
        "starter_10gb": {"storage_mb": 10240, "price_paise": 79900, "label": "Starter (10 GB)"},
        "standard_25gb": {"storage_mb": 25600, "price_paise": 149900, "label": "Standard (25 GB)"},
        "grand_60gb": {"storage_mb": 61440, "price_paise": 249900, "label": "Grand (60 GB)"},
        "enterprise_150gb": {"storage_mb": 153600, "price_paise": 499900, "label": "Enterprise (150 GB)"},
    }

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
