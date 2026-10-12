import asyncio
import logging
import traceback
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import select, update
from datetime import datetime, timezone
import numpy as np

from app.core.database import AsyncSessionLocal
from app.models.job_queue import JobQueue
from app.models.photo import Photo
from app.models.event import Event
from app.models.guest import Guest
from app.models.face_embedding import FaceEmbedding
from app.services.face_service import face_service
from app.services.whatsapp_service import whatsapp_service
from app.core.config import settings

logger = logging.getLogger(__name__)

async def process_single_photo_job(job: JobQueue, db):
    payload = job.payload
    photo_id = payload.get("photo_id")
    event_id = payload.get("event_id")

    # Fetch photo
    stmt = select(Photo).where(Photo.id == photo_id)
    res = await db.execute(stmt)
    photo = res.scalar_one_or_none()
    if not photo:
        logger.warning(f"Photo {photo_id} not found for job {job.id}")
        return

    # In local/simulated environment: generate sample face embeddings
    # In production: download original bytes from R2 via r2_storage.get_bytes, run SCRFD & ArcFace
    import hashlib
    seed_str = f"{photo_id}_{photo.r2_key_original}"
    h = hashlib.sha256(seed_str.encode()).digest()
    
    # Generate 1 to 3 faces per photo
    face_count = 1 if h[0] % 2 == 0 else 2
    embeddings_created = []

    for i in range(face_count):
        # Generate 512-dim normalized vector
        rng = np.random.RandomState(int.from_bytes(h[i*4:(i+1)*4], "big"))
        raw_vec = rng.randn(512).astype(np.float32)
        norm_vec = raw_vec / np.linalg.norm(raw_vec)

        embedding_record = FaceEmbedding(
            photo_id=photo.id,
            event_id=event_id,
            model_version=settings.FACE_MODEL_VERSION,
            embedding=norm_vec.tolist(),
            bbox={"x": 100 * (i+1), "y": 80, "w": 180, "h": 180, "confidence": 0.96},
            landmarks={"left_eye": [140, 130], "right_eye": [220, 130], "nose": [180, 170]}
        )
        db.add(embedding_record)
        embeddings_created.append(norm_vec)

    photo.face_processed = True
    photo.face_count = face_count

    # Check registered guests who opted in to notify them if a match occurs
    guest_stmt = select(Guest).where(Guest.event_id == event_id, Guest.whatsapp_opt_in == True)
    guest_res = await db.execute(guest_stmt)
    guests = guest_res.scalars().all()

    for guest in guests:
        if guest.selfie_embedding:
            g_vec = np.array(guest.selfie_embedding, dtype=np.float32)
            matched = any(face_service.cosine_similarity(g_vec, f_vec) >= settings.FACE_SIMILARITY_THRESHOLD for f_vec in embeddings_created)
            if matched:
                event_stmt = select(Event).where(Event.id == event_id)
                event_res = await db.execute(event_stmt)
                ev = event_res.scalar_one_or_none()
                if ev and ev.whatsapp_delivery_enabled and guest.phone_number:
                    gallery_url = f"https://eventlens.in/e/{ev.slug}"
                    await whatsapp_service.send_photos_ready_notification(
                        phone_number=guest.phone_number,
                        event_name=ev.name,
                        gallery_url=gallery_url,
                        matched_count=1
                    )
                    guest.last_notified_at = datetime.now(timezone.utc)

    logger.info(f"Successfully processed photo {photo_id}: {face_count} faces indexed.")

async def run_worker_loop():
    logger.info("EventLens Face Worker started. Polling job queue...")
    while True:
        try:
            async with AsyncSessionLocal() as db:
                stmt = (
                    select(JobQueue)
                    .where(JobQueue.status == "queued")
                    .order_by(JobQueue.scheduled_at.asc())
                    .limit(5)
                )
                res = await db.execute(stmt)
                jobs = res.scalars().all()

                for job in jobs:
                    job.status = "processing"
                    job.attempts += 1
                    await db.commit()

                    try:
                        if job.job_type == "process_photo":
                            await process_single_photo_job(job, db)
                        job.status = "completed"
                    except Exception as e:
                        logger.error(f"Error executing job {job.id}: {traceback.format_exc()}")
                        job.status = "failed"
                        job.error_message = str(e)

                    await db.commit()

        except Exception as e:
            logger.error(f"Worker loop error: {e}")

        await asyncio.sleep(2.0)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_worker_loop())
