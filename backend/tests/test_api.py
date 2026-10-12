import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

import uuid

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "EventLens"

@pytest.mark.asyncio
async def test_auth_and_event_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        unique_email = f"arjun_{uuid.uuid4().hex[:8]}@example.com"
        # 1. Signup
        signup_payload = {
            "name": "Arjun Sharma",
            "email": unique_email,
            "password": "Password123!",
            "phone": "+919876543210",
            "business_name": "Arjun Sharma Weddings"
        }
        res = await client.post("/api/v1/auth/signup", json=signup_payload)
        assert res.status_code == 201
        tokens = res.json()
        assert "access_token" in tokens
        access_token = tokens["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # 2. Get Profile
        res_me = await client.get("/api/v1/auth/me", headers=headers)
        assert res_me.status_code == 200
        assert res_me.json()["email"] == unique_email

        # 3. Create Event
        event_payload = {
            "name": "Kavita & Rohan Royal Wedding",
            "event_date": "2026-10-15",
            "plan_tier": "standard_25gb"
        }
        res_event = await client.post("/api/v1/events", json=event_payload, headers=headers)
        assert res_event.status_code == 201
        event_data = res_event.json()
        event_id = event_data["event"]["id"]
        slug = event_data["event"]["slug"]
        assert event_data["event"]["name"] == "Kavita & Rohan Royal Wedding"
        assert event_data["event"]["storage_limit_mb"] == 25600
        assert event_data["event"]["qr_code_url"].startswith("data:image/png;base64,")

        # 4. Attempt upload while unpaid -> Must fail with 402
        presign_payload = {
            "files": [
                {"filename": "wedding_001.jpg", "size_bytes": 10500000, "content_type": "image/jpeg"},
                {"filename": "wedding_002.jpg", "size_bytes": 12000000, "content_type": "image/jpeg"}
            ]
        }
        unpaid_presign = await client.post(f"/api/v1/events/{event_id}/photos/presign", json=presign_payload, headers=headers)
        assert unpaid_presign.status_code == 402

        # 5. Complete Payment Flow (create order & verify)
        order_res = await client.post("/api/v1/payments/create-order", json={"event_id": event_id, "plan_tier": "standard_25gb"}, headers=headers)
        assert order_res.status_code == 200
        order_id = order_res.json()["order_id"]

        verify_res = await client.post("/api/v1/payments/verify", json={
            "event_id": event_id,
            "razorpay_order_id": order_id,
            "razorpay_payment_id": f"pay_{uuid.uuid4().hex[:10]}",
            "razorpay_signature": "mock_signature"
        }, headers=headers)
        assert verify_res.status_code == 200

        # 6. Request Presigned Upload URLs (now LIVE -> Must succeed with 200)
        res_presign = await client.post(f"/api/v1/events/{event_id}/photos/presign", json=presign_payload, headers=headers)
        assert res_presign.status_code == 200
        presign_data = res_presign.json()
        assert len(presign_data["items"]) == 2
        photo1_id = presign_data["items"][0]["photo_id"]
        photo2_id = presign_data["items"][1]["photo_id"]

        # 5. Confirm Uploaded Photos
        confirm_payload = {
            "uploaded": [
                {
                    "photo_id": photo1_id,
                    "r2_key_original": presign_data["items"][0]["r2_key_original"],
                    "original_filename": "wedding_001.jpg",
                    "file_size_bytes": 10500000,
                    "width": 4000,
                    "height": 3000
                },
                {
                    "photo_id": photo2_id,
                    "r2_key_original": presign_data["items"][1]["r2_key_original"],
                    "original_filename": "wedding_002.jpg",
                    "file_size_bytes": 12000000,
                    "width": 4000,
                    "height": 3000
                }
            ]
        }
        res_confirm = await client.post(f"/api/v1/events/{event_id}/photos/confirm", json=confirm_payload, headers=headers)
        assert res_confirm.status_code == 200
        assert res_confirm.json()["photos_confirmed"] == 2

        # 6. Public Guest Gallery
        res_gallery = await client.get(f"/api/v1/public/events/{slug}/gallery")
        assert res_gallery.status_code == 200
        gallery_data = res_gallery.json()
        assert gallery_data["total_count"] == 2
        assert len(gallery_data["photos"]) == 2

        # 7. Guest Registration for WhatsApp
        guest_payload = {
            "phone_number": "+919876543210",
            "whatsapp_opt_in": True
        }
        res_guest = await client.post(f"/api/v1/public/events/{slug}/guests", json=guest_payload)
        assert res_guest.status_code == 200

        # 8. Biometric Selfie Search
        # Generate dummy 150x150 JPEG bytes
        from PIL import Image
        import io
        img = Image.new("RGB", (150, 150), color=(200, 150, 100))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        selfie_bytes = buf.getvalue()

        files = {"file": ("selfie.jpg", selfie_bytes, "image/jpeg")}
        res_search = await client.post(f"/api/v1/public/events/{slug}/selfie-search", files=files)
        assert res_search.status_code == 200
        search_data = res_search.json()
        assert search_data["face_detected"] is True
        assert "scan_time_ms" in search_data
