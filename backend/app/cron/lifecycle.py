import asyncio
import logging
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import datetime, timedelta, timezone, date
from sqlalchemy import select, update, delete

from app.core.database import AsyncSessionLocal
from app.core.r2 import r2_storage
from app.models.event import Event, EventStatus
from app.models.photo import Photo
from app.models.face_embedding import FaceEmbedding
from app.models.guest import Guest

logger = logging.getLogger(__name__)

async def run_lifecycle_automation():
    """Runs daily lifecycle automation for events, DPDP compliance and R2 storage purging."""
    now = datetime.now(timezone.utc)
    today = date.today()
    logger.info(f"Starting EventLens lifecycle sweep at {now.isoformat()}...")

    async with AsyncSessionLocal() as db:
        # 1. LIVE -> ACTIVE: Events where event_date was more than 2 days ago
        live_stmt = select(Event).where(
            Event.status == EventStatus.LIVE,
            Event.event_date <= today - timedelta(days=2)
        )
        live_res = await db.execute(live_stmt)
        live_events = live_res.scalars().all()
        for ev in live_events:
            ev.status = EventStatus.ACTIVE
            logger.info(f"Transitioned Event '{ev.name}' ({ev.id}) from LIVE to ACTIVE.")
        await db.commit()

        # 2. ACTIVE -> ARCHIVED: Events older than 30 days (unless renewed)
        # Purge original full-res and web images from R2, retain thumbnails only
        active_stmt = select(Event).where(Event.status == EventStatus.ACTIVE)
        active_res = await db.execute(active_stmt)
        active_events = active_res.scalars().all()

        for ev in active_events:
            # If renewed into the future, do not archive
            if ev.retention_extended_until and ev.retention_extended_until > now:
                continue

            base_time = ev.retention_extended_until or ev.live_started_at or ev.created_at
            if base_time <= now - timedelta(days=30):
                ev.status = EventStatus.ARCHIVED
                ev.archived_at = now

                # Fetch photos to purge original & web variants
                photo_stmt = select(Photo).where(Photo.event_id == ev.id)
                photo_res = await db.execute(photo_stmt)
                photos = photo_res.scalars().all()

                keys_to_purge = []
                for p in photos:
                    if p.r2_key_original:
                        keys_to_purge.append(p.r2_key_original)
                        p.r2_key_original = ""
                    if p.r2_key_web:
                        keys_to_purge.append(p.r2_key_web)
                        p.r2_key_web = ""

                if keys_to_purge:
                    r2_storage.delete_objects(keys_to_purge)
                    logger.info(f"Archived Event '{ev.name}': Purged {len(keys_to_purge)} high-res assets from R2.")

        await db.commit()

        # 3. ARCHIVED -> DELETED: Events archived more than 30 days ago (60 days total, unless renewed)
        # Purge remaining thumbnails and delete face embeddings / guests
        archived_stmt = select(Event).where(Event.status == EventStatus.ARCHIVED)
        archived_res = await db.execute(archived_stmt)
        archived_events = archived_res.scalars().all()

        for ev in archived_events:
            if ev.retention_extended_until and ev.retention_extended_until > now:
                continue

            if ev.archived_at and ev.archived_at <= now - timedelta(days=30):
                ev.status = EventStatus.DELETED
                ev.deleted_at = now

                # Purge all thumbs
                photo_stmt = select(Photo).where(Photo.event_id == ev.id)
                photo_res = await db.execute(photo_stmt)
                photos = photo_res.scalars().all()
                thumb_keys = [p.r2_key_thumb for p in photos if p.r2_key_thumb]
                if thumb_keys:
                    r2_storage.delete_objects(thumb_keys)

                # Purge all biometric face embeddings
                await db.execute(delete(FaceEmbedding).where(FaceEmbedding.event_id == ev.id))
                # Purge guests
                await db.execute(delete(Guest).where(Guest.event_id == ev.id))

                logger.info(f"Deleted Event '{ev.name}' ({ev.id}): Purged all assets and biometric data (DPDP Act compliance).")

        await db.commit()

    logger.info("EventLens lifecycle sweep completed successfully.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_lifecycle_automation())
