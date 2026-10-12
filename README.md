# EventLens (इवेंटलेंस)

**AI-Powered Event Photo Delivery for Photographers in India**

Guests scan a table QR code, take a selfie, and instantly receive every photo they appear in via a face-matched gallery — delivered directly over the web and WhatsApp. Photographers pay **per event**, not a monthly or yearly subscription.

---

## 🚀 Key Features

- **Per-Event Economics:** Transparent tiers starting at ₹799/event. Zero monthly lock-in or off-season subscription fees.
- **WhatsApp-Native Delivery:** Direct Meta WhatsApp Cloud API integration to send guests their personalized photo links.
- **Zero-Egress Direct-to-R2 Upload:** Photos upload straight from client browsers to Cloudflare R2 using S3 presigned URLs, bypassing application server bandwidth limits.
- **High-Performance Vector Search:** SCRFD face detection + ArcFace ONNX (512-dim L2-normalized embeddings) indexed with PostgreSQL `pgvector` HNSW (`<=>` cosine distance operator).
- **DPDP Act (India) Biometric Privacy:** 30-day high-res archival, 60-day full purge of biometric vectors, and an unconditional right to erasure ("Forget My Face").
- **Lean Single-VPS Deployment:** Built to run cost-effectively on a single Hetzner VPS + Cloudflare CDN.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router) + Tailwind CSS (Light Warm Theme) |
| **Backend API** | Python 3.12 + FastAPI (Async) |
| **Database** | PostgreSQL 16 + `pgvector` (HNSW cosine index) |
| **Object Storage** | Cloudflare R2 (S3-compatible, zero egress fees) |
| **AI Models** | SCRFD ONNX (Detection/Landmarks) + ArcFace IResNet50 ONNX (Embeddings) |
| **Payments** | Razorpay (Orders API + Webhooks) |
| **Messaging** | Meta WhatsApp Business Cloud API |

---

## 📂 Project Architecture

```text
EventLens/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # Auth, Events, Photos, Guests, Search, Payments, WhatsApp
│   │   ├── core/                # Config, Security (bcrypt/JWT), Database, R2 client
│   │   ├── models/              # SQLAlchemy 2.0 ORM models (Photographer, Event, Photo, FaceEmbedding)
│   │   ├── schemas/             # Pydantic v2 validation models
│   │   ├── services/            # Face recognition, QR generator, Razorpay, WhatsApp
│   │   ├── workers/             # Async background face extraction worker
│   │   ├── cron/                # Daily DPDP archival & cleanup runner
│   │   └── main.py              # FastAPI application entrypoint
│   ├── tests/                   # Pytest async suite
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                    # Next.js App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Marketing landing page
│   │   │   ├── login/           # Photographer sign-in
│   │   │   ├── signup/          # Photographer registration
│   │   │   ├── dashboard/       # Event management, storage gauges, QR downloads
│   │   │   ├── events/new/      # Event creation & tier selection
│   │   │   ├── events/[id]/     # Event media manager & direct uploader
│   │   │   ├── e/[slug]/        # Public guest photo gallery
│   │   │   ├── e/[slug]/selfie/ # WebRTC camera capture & AI search results
│   │   │   ├── e/[slug]/optin/  # WhatsApp phone registration
│   │   │   └── privacy/         # DPDP Act biometric privacy policy
│   │   ├── components/          # Navbar, gallery, camera UI
│   │   └── lib/                 # API client & formatting utilities
│   ├── tailwind.config.ts
│   └── package.json
│
├── docker-compose.yml           # PostgreSQL 16 + pgvector + FastAPI
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment with uv or python
uv venv .venv --python 3.12
# Activate virtual environment:
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# Linux/macOS: source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt

# Run automated tests
pytest tests/

# Launch development server (with auto-reload)
uvicorn app.main:app --reload --port 8000
```

The API docs are available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Run Next.js development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🧪 Automated Testing

To run the end-to-end backend test suite:
```bash
cd backend
pytest tests/ -v
```

---

## 🔒 DPDP Act Biometric Compliance

EventLens complies with India's Digital Personal Data Protection Act, 2023:
- **Affirmative Consent:** Clear opt-in check before camera activation.
- **Mathematical Vectors:** Faces are converted to non-reversible 512-dimensional numerical vectors.
- **Automated Purge:** 
  - Day 30: High-resolution originals are purged from R2.
  - Day 60: Biometric vectors and thumbnails are destroyed from PostgreSQL.
- **Right to Erasure:** Guests can request instant erasure of their face vector at any time.
