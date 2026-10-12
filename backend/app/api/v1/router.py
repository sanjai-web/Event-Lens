from fastapi import APIRouter
from app.api.v1.endpoints import auth, events, photos, guests, search, payments, whatsapp

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(photos.router, prefix="/events", tags=["Photos"])
api_router.include_router(guests.router, tags=["Guest Public Gallery"])
api_router.include_router(search.router, tags=["Biometric Face Search"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(whatsapp.router, prefix="/whatsapp", tags=["WhatsApp"])
