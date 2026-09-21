# Technical Architecture & Stack Plan: SwasthyaSetu (MediVault)

An offline-first healthcare continuity layer connecting Primary Health Centres (PHC), District Hospitals, and follow-up providers across low-connectivity environments.

---

## 1. System Architecture Overview

```mermaid
graph TD
    subgraph Client Layer [Frontend Applications - Vite + React + PWA]
        PHC["PHC Web / PWA\n(Referral Form, Local Queue)"]
        HOSP["District Hospital Web\n(Triage, Identity Review, Doc OCR)"]
        CLINIC["Receiving Clinic\n(Timeline, Follow-up)"]
        
        subgraph Offline Engine [Client Offline Subsystem]
            DEXIE[("IndexedDB (Dexie.js)\nLocal Referrals & Sync Queue")]
            NET_MON["Connectivity Detector\n(navigator.onLine + Heartbeat)"]
            SYNC_MGR["Sync Manager\n(FIFO, Exponential Backoff)"]
            SMS_FALLBACK["SMS Fallback Formatter\n(Compact Metadata Payload)"]
        end
        
        PHC --> DEXIE
        DEXIE --> SYNC_MGR
        NET_MON --> SYNC_MGR
        NET_MON -. Offline .-> SMS_FALLBACK
    end

    subgraph API Layer [Backend Gateway - Node.js / Express + TypeScript]
        ROUTER["REST API Router"]
        AUTH_RBAC["Auth & RBAC Middleware\n(JWT: PHC_USER, CLINICIAN, ADMIN)"]
        IDEMP["Idempotency & Sync Engine\n(Deduplication by event_id)"]
        AUDIT_SVC["Audit Logging Service\n(Append-Only Events)"]
        
        ROUTER --> AUTH_RBAC
        AUTH_RBAC --> IDEMP
        IDEMP --> AUDIT_SVC
    end

    subgraph Data Layer [Relational Storage - PostgreSQL + Prisma ORM]
        PG[(PostgreSQL Database)]
        PRISMA["Prisma ORM\n(Schema & Type Safety)"]
        FILES[("Local / MinIO Storage\n(Prescriptions & Discharge Summaries)")]
    end

    subgraph AI Intelligence Layer [Python FastAPI Service / Modular Endpoints]
        IDENTITY_MATCH["Fuzzy Identity Reconciliation\n(RapidFuzz Multi-Field Weighted Scorer)"]
        PREPROC["Image Preprocessing\n(OpenCV / Pillow)"]
        OCR_ENGINE["Document OCR\n(Gemini Vision / TrOCR / Tesseract)"]
        NER_NORM["Clinical Extractor & Normalizer\n(Medical Regex + Schema Extraction)"]
        CONFIDENCE["Confidence Scorer\n(Field-Level >=90% Verified vs Needs Review)"]
        
        PREPROC --> OCR_ENGINE
        OCR_ENGINE --> NER_NORM
        NER_NORM --> CONFIDENCE
    end

    SYNC_MGR -- "POST /api/sync/events" --> ROUTER
    HOSP --> ROUTER
    CLINIC --> ROUTER
    ROUTER --> PRISMA
    PRISMA --> PG
    ROUTER --> FILES
    ROUTER -- "Internal HTTP / RPC" --> AI Intelligence Layer
```

---

## 2. Feature-by-Feature Technical Stack Breakdown

| Feature / Subsystem | Recommended Technology | Technical Rationale & Role |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 + Vite + TypeScript** | Extremely fast build, zero SSR complexity, full PWA compatibility, offline caching via Service Worker (`vite-plugin-pwa`), type safety shared with backend. |
| **Styling & UI Components** | **Tailwind CSS + Lucide Icons + Radix UI primitives** | Clean, medical-grade, dense information hierarchy; accessible modals for side-by-side identity and document verification. |
| **Offline Persistence** | **Dexie.js (IndexedDB wrapper)** | Type-safe, transactional browser database. Stores queued referrals, local event IDs, and cached facilities even when page is refreshed or browser is closed. |
| **Connectivity & Sync Manager** | **Custom Web Worker / Heartbeat Service** | Combines `navigator.onLine` with active heartbeat ping (`GET /api/health`). Coordinates optimistic UI updates (`QUEUED` $\rightarrow$ `SYNCING` $\rightarrow$ `SYNCED`). |
| **Backend API Gateway** | **Node.js + Express (TypeScript)** | Seamless monorepo integration with frontend types. Fast asynchronous I/O for high-throughput sync event ingestion and idempotent handling. |
| **Database & ORM** | **PostgreSQL + Prisma ORM** | Relational consistency for healthcare data (patients, referrals, matches, documents, audit logs). Prisma delivers automated migrations and strictly typed client queries. |
| **Authentication & RBAC** | **JWT (JSON Web Tokens) + bcrypt** | Role-Based Access Control enforcing permissions across `PHC_USER`, `CLINICIAN`, `REFERRAL_COORDINATOR`, and `ADMIN`. |
| **Identity Reconciliation Service** | **Python (FastAPI + RapidFuzz)** | Token sort ratio, partial ratio, and Levenshtein distance for multi-field fuzzy matching (Name: 35%, Phone: 25%, Village: 15%, Age: 10%, Gender: 5%, Context: 10%). |
| **Document OCR & Intelligence** | **Python (OpenCV + Google Gemini / TrOCR / Tesseract)** | Preprocesses noisy images (deskew, threshold), extracts raw text, structures clinical entities (diagnosis, meds, dosage, frequency) via strict JSON schema. |
| **Clinical Normalization & Confidence** | **Python Rule Engine + Zod/Pydantic** | Normalizes abbreviations (`BD` $\rightarrow$ "twice daily", `OD` $\rightarrow$ "once daily"). Computes field confidence scores and assigns review status (`needs_review` vs `verified`). |
| **SMS Fallback Subsystem** | **Compact Payload Generator + Simulated Gateway** | Compresses referral into minimum metadata ($\le 160$ chars). Features demo simulation mode with explicit UI labels plus an extensible adapter for Twilio/Fast2SMS. |
| **Audit Trail & Timeline** | **PostgreSQL Append-Only Audit Table** | Every state change produces an immutable `AuditEvent` (`REFERRAL_CREATED`, `IDENTITY_CONFIRMED`, `FIELD_REVIEWED`, etc.). Rendered as an interactive visual care journey. |
| **Demo Mode & Resilience** | **Seeded Demo Fixtures & Offline Toggle** | Built-in simulated network toggle, pre-seeded "Ramesh Yadav" journey, synthetic discharge documents, and deterministic AI fallbacks ensuring 100% demo reliability. |

---

## 3. Project Directory Structure (Monorepo)

```text
swastyasetu/
├── apps/
│   ├── web/                          # Frontend React + Vite + PWA
│   │   ├── public/                   # Manifest, icons, demo sample docs
│   │   ├── src/
│   │   │   ├── components/           # Reusable UI (Badges, Modals, Navbar)
│   │   │   ├── features/
│   │   │   │   ├── phc/              # PHC Referral Form & Local Queue UI
│   │   │   │   ├── hospital/         # Hospital Triage & Incoming Referrals
│   │   │   │   ├── identity/         # Side-by-side Identity Comparison
│   │   │   │   ├── documents/        # Split-screen OCR Document Review
│   │   │   │   ├── timeline/         # Patient Continuity Timeline
│   │   │   │   └── sms/              # SMS Fallback Preview & Simulation
│   │   │   ├── lib/
│   │   │   │   ├── db.ts             # Dexie.js IndexedDB schema
│   │   │   │   ├── syncEngine.ts     # Sync Queue Manager & Retry Loop
│   │   │   │   ├── network.ts        # Online/Offline State & Heartbeat
│   │   │   │   └── api.ts            # Axios/Fetch client
│   │   │   └── routes/               # App views (PHC, Hospital, Admin)
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── api/                          # Main Backend Node.js / Express
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/             # JWT auth & RBAC middleware
│       │   │   ├── referrals/        # Referral CRUD & state machine
│       │   │   ├── patients/         # Patient management
│       │   │   ├── identity/         # Identity proxy & confirmation
│       │   │   ├── documents/        # Document upload & field reviews
│       │   │   ├── followups/        # Follow-up care tracking
│       │   │   ├── sync/             # Idempotent sync event receiver
│       │   │   └── audit/            # Audit query endpoints
│       │   ├── db/                   # Prisma Client instance
│       │   ├── server.ts
│       │   └── seed.ts               # Demo seed script (Ramesh Yadav, facilities)
│       ├── prisma/
│       │   └── schema.prisma         # Relational schema
│       └── package.json
│
├── services/
│   └── ai/                           # AI & ML Microservice (Python FastAPI)
│       ├── app/
│       │   ├── identity/             # RapidFuzz identity matcher
│       │   ├── ocr/                  # Document OCR (Gemini / Tesseract / TrOCR)
│       │   ├── extraction/           # Clinical entity extractor & normalizer
│       │   ├── confidence/           # Field-level confidence calculator
│       │   └── main.py               # FastAPI application entrypoint
│       └── requirements.txt
│
├── packages/
│   └── shared/                       # Shared types & constants
│       ├── src/
│       │   ├── types.ts              # Patient, Referral, SyncEvent, etc.
│       │   └── constants.ts          # Urgency, Status enums, default weights
│       └── package.json
│
├── docker-compose.yml                # PostgreSQL, MinIO (optional), local setup
├── .env.example
└── README.md
```

---

## 4. Key Architectural Patterns & Safety Safeguards

### A. Idempotent Offline Synchronization
- Every action generated offline receives a UUID v7 or ULID: `event_id` (e.g. `EVT-01J...`).
- When syncing, `POST /api/sync/events` performs an atomic transaction:
  ```sql
  INSERT INTO "SyncEvent" (event_id, entity_type, operation, status) 
  VALUES ($1, $2, $3, 'SYNCED')
  ON CONFLICT (event_id) DO NOTHING;
  ```
- If the event was already received, the server returns the existing record with HTTP `200 OK`, preventing duplicate patient or referral records.

### B. Fuzzy Identity Reconciliation (No Silent Merging)
- The AI service calculates weighted similarity:
  $$\text{Score} = w_1 \cdot \text{Name} + w_2 \cdot \text{Phone} + w_3 \cdot \text{Village} + w_4 \cdot \text{Age} + w_5 \cdot \text{Gender} + w_6 \cdot \text{Context}$$
- **Hard Rule**: Even with a 99% match, status is set to `PENDING_REVIEW`.
- Clinician must click **[Confirm Match]** or **[Create New Patient]** in the side-by-side UI, which creates an immutable `IDENTITY_CONFIRMED` audit record.

### C. Uncertainty-Aware Clinical OCR Pipeline
- Extracted fields receive a confidence score $\in [0, 1]$.
- Fields with confidence $<0.90$ or unrecognized medical abbreviations are tagged `NEEDS_REVIEW`.
- The UI presents the original image alongside the extracted field with bounding box coordinates, allowing the doctor to verify or edit values directly.

### D. Full Audit Logging
- Every single lifecycle event (`REFERRAL_CREATED`, `QUEUED_OFFLINE`, `SYNCED`, `IDENTITY_CONFIRMED`, `DOCUMENT_PROCESSED`, `FIELD_VERIFIED`, `FOLLOWUP_SCHEDULED`) writes an immutable record to the `AuditEvent` table.

---

## 5. Verification Plan

### Automated Tests:
- **Unit Tests**:
  - Offline sync event serialization and idempotency deduplication.
  - RapidFuzz multi-field weighted scoring edge cases (name transposition, close ages).
  - Clinical abbreviation normalizer (`BD` $\rightarrow$ "twice daily").
  - Role-Based Access Control permission enforcement.
- **End-to-End Test Workflow**:
  - Create referral $\rightarrow$ simulate offline mode $\rightarrow$ verify persistence in IndexedDB $\rightarrow$ trigger sync $\rightarrow$ verify single referral in PostgreSQL $\rightarrow$ run identity match $\rightarrow$ clinician confirmation $\rightarrow$ upload synthetic prescription $\rightarrow$ verify confidence badges $\rightarrow$ view continuity timeline.

### Manual / Demo Verification:
- Run complete "Ramesh Yadav" journey across PHC, simulated network drops, SMS fallback preview, hospital reception, document verification, and follow-up closure.
