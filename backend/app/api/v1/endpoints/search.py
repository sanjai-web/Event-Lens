import time
import logging
import numpy as np
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import Optional, List

import json
from app.core.database import get_db, is_postgres
from app.core.config import settings
from app.core.limiter import limiter
from app.core.r2 import r2_storage
from app.models.event import Event, EventStatus
from app.models.photo import Photo
from app.models.face_embedding import FaceEmbedding
from app.schemas.guest import SelfieSearchResponse
from app.schemas.photo import PhotoPublicItem
from app.services.face_service import face_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/public/events/{slug}/selfie-search", response_model=SelfieSearchResponse)
@limiter.limit("10/minute")
async def selfie_search(
    request: Request,
    slug: str,
    file: Optional[UploadFile] = File(None),
    selfie_base64: Optional[str] = Form(None),
    consent: bool = Form(True),
    db: AsyncSession = Depends(get_db)
):
    start_time = time.time()

    # DPDP Act: Affirmative Biometric Consent Verification
    if not consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Biometric consent is required under DPDP Act to process facial recognition search."
        )

    # Log consent acceptance with audit trail
    client_ip = request.client.host if request.client else "unknown"
    logger.info(
        f"[DPDP Biometric Consent] Event: {slug} | Client IP: {client_ip} | Timestamp: {datetime.now(timezone.utc).isoformat()}"
    )

    # 1. Fetch Event
    stmt = select(Event).where(Event.slug == slug)
    res = await db.execute(stmt)
    event = res.scalar_one_or_none()
    if not event or event.status == EventStatus.DELETED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    if not event.face_search_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Face search is disabled for this event.")

    # 2. Extract image bytes
    if file:
        image_bytes = await file.read()
    elif selfie_base64:
        import base64
        clean_b64 = selfie_base64.split(",")[-1]
        image_bytes = base64.b64decode(clean_b64)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please upload a selfie photo.")

    # 3. Detect and extract face embedding from selfie
    success, query_embedding, msg = face_service.process_single_selfie(image_bytes)
    if not success or not query_embedding:
        return SelfieSearchResponse(
            matched_count=0,
            photos=[],
            scan_time_ms=round((time.time() - start_time) * 1000, 2),
            face_detected=False,
            message=msg or "No clear face detected. Please ensure your face is well-lit and centered."
        )

    matched_photos_map = {} # photo_id -> highest similarity

    # 4. Vector Cosine Distance Search (pgvector on PostgreSQL; NumPy on MySQL)
    if is_postgres():
        query_sql = text("""
            SELECT fe.photo_id, (1 - (fe.embedding <=> :query_vec)) AS similarity
            FROM face_embeddings fe
            WHERE fe.event_id = :event_id
              AND (fe.embedding <=> :query_vec) < :cosine_threshold
            ORDER BY similarity DESC
            LIMIT 100;
        """)
        vec_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
        max_dist = 1.0 - settings.FACE_SIMILARITY_THRESHOLD

        results = await db.execute(query_sql, {
            "query_vec": vec_str,
            "event_id": event.id,
            "cosine_threshold": max_dist
        })
        for photo_id, sim in results:
            if photo_id not in matched_photos_map or sim > matched_photos_map[photo_id]:
                matched_photos_map[photo_id] = float(sim)
    else:
        # MySQL / Non-pgvector: vectorized in-memory cosine matching via NumPy
        stmt = select(FaceEmbedding.photo_id, FaceEmbedding.embedding).where(
            FaceEmbedding.event_id == event.id
        )
        res = await db.execute(stmt)
        rows = res.all()
        if rows:
            embeddings_list = []
            valid_pids = []
            for pid, emb in rows:
                if emb is not None:
                    if isinstance(emb, str):
                        try:
                            emb = json.loads(emb)
                        except Exception:
                            continue
                    embeddings_list.append(emb)
                    valid_pids.append(pid)

            if embeddings_list:
                mat = np.array(embeddings_list, dtype=np.float32)
                norms = np.linalg.norm(mat, axis=1, keepdims=True)
                norms[norms == 0] = 1.0
                mat = mat / norms

                q_vec = np.array(query_embedding, dtype=np.float32)
                q_norm = np.linalg.norm(q_vec)
                if q_norm > 0:
                    q_vec = q_vec / q_norm

                similarities = np.dot(mat, q_vec)
                threshold = settings.FACE_SIMILARITY_THRESHOLD

                for pid, sim in zip(valid_pids, similarities):
                    sim_val = float(sim)
                    if sim_val >= threshold:
                        if pid not in matched_photos_map or sim_val > matched_photos_map[pid]:
                            matched_photos_map[pid] = sim_val

    if not matched_photos_map:
        return SelfieSearchResponse(
            matched_count=0,
            photos=[],
            scan_time_ms=round((time.time() - start_time) * 1000, 2),
            face_detected=True,
            message="We scanned all photos but didn't find matches yet. Check back soon as new photos are uploaded!"
        )

    # 5. Fetch photo details for matched IDs
    photo_ids = list(matched_photos_map.keys())
    stmt = select(Photo).where(Photo.id.in_(photo_ids))
    photos_res = await db.execute(stmt)
    photos = photos_res.scalars().all()

    # Sort photos by similarity descending
    photos_sorted = sorted(photos, key=lambda p: matched_photos_map.get(p.id, 0), reverse=True)

    items = [
        PhotoPublicItem(
            id=p.id,
            thumb_url=r2_storage.get_public_url(p.r2_key_thumb or p.r2_key_original),
            web_url=r2_storage.get_public_url(p.r2_key_web or p.r2_key_original),
            width=p.width,
            height=p.height,
            uploaded_at=p.uploaded_at,
            similarity=matched_photos_map.get(p.id)
        )
        for p in photos_sorted
    ]

    scan_ms = round((time.time() - start_time) * 1000, 2)

    return SelfieSearchResponse(
        matched_count=len(items),
        photos=items,
        scan_time_ms=scan_ms,
        face_detected=True,
        message=f"Found {len(items)} photos of you!"
    )
