import asyncio
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.core.limiter import limiter
from app.core.r2 import r2_storage
from app.api.v1.router import api_router
from app.workers.face_worker import run_worker_loop

# Allow up to 25MB for multipart form fields (e.g. large base64 selfies)
import starlette.formparsers
starlette.formparsers.MultiPartParser.max_part_size = 25 * 1024 * 1024

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("eventlens")

worker_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database schema & start background worker
    logger.info("Initializing EventLens Database...")
    await init_db()
    
    # Start background worker loop
    logger.info("Starting background face processing worker...")
    global worker_task
    worker_task = asyncio.create_task(run_worker_loop())
    
    yield
    
    # Shutdown: Cancel background tasks
    if worker_task:
        worker_task.cancel()
    logger.info("EventLens backend shutdown gracefully.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-powered event photo delivery platform for photographers & guests.",
    lifespan=lifespan,
)

# Attach slowapi rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|.*\.vercel\.app)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
async def health_check():
    db_status = "unknown"
    r2_status = "unknown"
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
        logger.error(f"Health check DB error: {e}")

    try:
        if r2_storage.test_connection():
            r2_status = "connected" if r2_storage.is_configured else "local_fallback"
        else:
            r2_status = "unreachable"
    except Exception as e:
        r2_status = f"error: {str(e)}"

    is_healthy = db_status == "connected" and r2_status in ["connected", "local_fallback"]
    payload = {
        "status": "healthy" if is_healthy else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": {
            "database": db_status,
            "storage": r2_status
        }
    }
    if not is_healthy:
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=payload)
    return payload

from fastapi.staticfiles import StaticFiles
app.mount("/media", StaticFiles(directory=r2_storage.local_dir), name="media")

@app.put("/api/v1/dev-upload", tags=["Development"])
async def dev_simulated_upload(request: Request, key: str):
    """Saves direct PUT photo uploads to the local backend/uploads directory."""
    body = await request.body()
    success = r2_storage.upload_bytes(key, body)
    if not success:
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    logger.info(f"[Local Upload] Successfully saved {len(body)} bytes for key: {key}")
    return Response(status_code=status.HTTP_200_OK)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
