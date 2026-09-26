<div align="center">

# 🩺 SwasthyaSetu (स्वास्थ्यसेतु)
### *Offline-First Closed-Loop Healthcare Referral & Clinical Continuity Platform*

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.14-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![IndexedDB](https://img.shields.io/badge/IndexedDB-Dexie.js-00A98F)](https://dexie.org/)
[![Web Push](https://img.shields.io/badge/Web_Push-VAPID-FF6B6B)](https://www.w3.org/TR/push-api/)
[![PWA](https://img.shields.io/badge/PWA-Service_Worker_v1.1-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**The right patient story, at the right point of care — even with zero internet connectivity.**

[Live Demo](#-user-roles--preseeded-demo-credentials) • [Key Architectural Pillars](#-key-architectural-pillars) • [System Architecture](#-system-architecture--data-flow) • [Core API Endpoints](#-core-api-endpoints) • [Clinical Safety Rules](#-hard-clinical-safety-principles) • [Getting Started](#-getting-started--local-development)

</div>

---

## 📖 Executive Summary & Mission

In tiered public healthcare networks (Sub-Centres → Primary Health Centres [PHCs] → Community Health Centres [CHCs] → Sub-District Hospitals → District Hospitals / Tertiary Medical Colleges), **the critical failure mode is not a lack of doctors or diagnostic equipment—it is the catastrophic loss of clinical continuity between care tiers.**

**SwasthyaSetu** (स्वास्थ्यसेतु - *Bridge of Health*) is an **offline-first, closed-loop healthcare referral, document intelligence, and post-discharge continuity platform**. It eliminates the transit blind spot between rural frontline clinics and district hospitals, ensures zero patient records are lost in transit, delivers real-time emergency triage notifications to hospital teams, and guarantees that discharge plans translate into real-world recovery in rural villages.

---

## 🚨 The 4 Frontline Healthcare Failures We Solve

```mermaid
flowchart TD
    A["Failure 1: The Lost Referral"] -->|Paper slips lost in transit| E["Ambulance arrives unannounced - ICU and OT unprepared"]
    B["Failure 2: The Frontline Identity Gap"] -->|Spelling variances, no universal ID| F["Fragmented history, duplicate workups and lost allergies"]
    C["Failure 3: The Unreadable Discharge"] -->|Cursive summaries and hospital jargon| G["30-day readmissions and unmanaged chronic mortality"]
    D["Failure 4: Intermittent Connectivity"] -->|Cloud EHRs freeze during power cuts| H["Doctors abandon digital tools and revert to paper ledgers"]
```

### 1. The Lost Referral & Transit Blind Spot
* **The Reality**: A rural PHC doctor identifies an acute myocardial infarction (STEMI) or severe pre-eclampsia. They scribble a paper slip and send the patient in an ambulance to a District Hospital 45 km away.
* **The Consequence**: The District Hospital has zero advance notice, cannot reserve ICU beds or prepare thrombolysis, and if the patient visits an alternative clinic, the referring doctor never receives clinical closure.

### 2. The Frontline Identity Gap
* **The Reality**: Rural patients rarely carry unified digital health identifiers at point of care. Names are transliterated phonetically (*"Laxmi Patil"* vs. *"Laxmibai Patil"*), ages are estimated, and phone numbers frequently belong to neighbors or relatives.
* **The Consequence**: Every hospital visit generates an isolated record. Clinicians at district hospitals cannot view prior drug allergies, baseline vitals, or chronic treatments logged at the village PHC.

### 3. The Unreadable Discharge Summary & Broken Follow-Up Loop
* **The Reality**: After days in tertiary care, a patient is discharged with a handwritten discharge summary packed with acronyms (*DAPT, Tab Ecosprin, Tab Clopilet, SOS Nitroglycerin*). The patient returns to their village.
* **The Consequence**: The local PHC doctor cannot decipher the cursive handwriting. The patient discontinues critical medications. Preventable complications and emergency readmissions occur within 30 days.

### 4. The Intermittent Connectivity Reality
* **The Reality**: Primary Health Centres frequently experience power cuts and severed fiber or cellular connections lasting hours or days.
* **The Consequence**: SaaS EHRs freeze or crash, locking clinicians out of intake screens and forcing them back to physical paper registers.

---

## ⚡ Key Architectural Pillars

SwasthyaSetu provides a unified clinical continuity platform built upon eight foundational pillars:

### 1. 📴 Dual-Tier Hybrid Offline Continuity Engine
* **Instant Client Storage**: All clinical intakes, rapid vitals, and referrals are written immediately to **IndexedDB via Dexie.js** in the browser. Zero network latency for busy clinicians.
* **Idempotent Background Queue**: When internet connectivity returns, an offline sync worker pushes queued mutations to the backend (`POST /api/sync/events`). Every event carries an immutable client-generated UUID `eventId` (`EVT-01J...`) guaranteeing idempotency and preventing duplicate records.
* **Navbar Offline Switcher & Status Sentinel**: Interactive navbar toggle allows clinicians and testers to simulate field network loss. The global [`OfflineStatusBar`](apps/web/src/components/OfflineStatusBar.tsx) displays queued counts and triggers automatic background replay upon reconnection.
* **2G SMS Fallback Generator**: When cellular data fails entirely, the system auto-compresses referrals into 160-character GSM-7 text payloads (e.g. `SWASTHYA|REF-1024|PAT:Ramesh,48M|EMERGENCY|STEMI|TO:DH Aundh`) transmissible via basic feature phone SMS.

### 2. 🚨 Real-Time PWA Emergency Push & Lock-Screen Notifications
* **VAPID Web Push Protocol**: Integrates standard Web Push API via `web-push`. Dispatches instant OS-level push notifications to hospital clinicians and triage coordinators when an **`EMERGENCY`** referral is created—even if the clinician's device is locked or the browser is minimized.
* **Interactive Lock-Screen Actions**: Service Worker (`sw.js`) renders action buttons directly on the notification banner:
  * `📋 View Vitals`: Deep-links directly to the emergency referral triage record.
  * `✅ Acknowledge`: Acknowledges the transfer in the background without needing to unlock the phone.
* **Urgent Medical Vibration**: Emits an unmissable tactile vibration cadence: `[200, 100, 200, 100, 400]`.
* **Zero-Asset Web Audio API Chime**: In-app foreground alert banner features a synthesized medical-grade dual chime (`D5 587Hz -> A5 880Hz`) with volume/mute controls, requiring zero external MP3 assets and eliminating 404/latency issues.

### 3. 🤝 Two-Way "Closed-Loop" Bedside Acknowledgment
* **Closing the Transit Gap**: Solves the severe psychological and clinical anxiety of rural doctors who never know if a tertiary hospital is prepared for an incoming trauma transfer.
* **One-Tap Hospital Prep**: Hospital emergency staff tap **"Acknowledge & Prepare Bed"** on the triage banner or lock screen.
* **Instant PHC Visual Feedback**: The referring PHC doctor's dashboard immediately transitions the referral card to a green **`BED READY`** status badge with clinician attribution and timestamp.

### 4. 💊 National Health Mission (NHM) Pre-Referral Stabilization
* **Clinical Loading Dose Checklist**: Standardized protocols for critical emergencies before ambulance departure (e.g. Acute Coronary Syndrome: Tab Aspirin 300mg + Tab Clopidogrel 300mg + Tab Atorvastatin 80mg; Eclampsia: IV/IM Magnesium Sulphate loading dose; Shock: IV Normal Saline bolus).
* **Digital Stabilization Record**: Logged and transmitted digitally with the referral, preventing dangerous medication double-dosing when the patient arrives at the hospital door.

### 5. 🚑 108 Ambulance Digital Transport Slip
* **Standardized EMS Handoff**: Generates a digital ambulance handover slip under the Government of Maharashtra Public Health Department / 108 EMRI Service guidelines.
* **En-Route Care Documentation**: Details patient oxygen flow rate (LPM), transit vitals checklist, IV infusion status, and emergency contact numbers for the ambulance paramedic.

### 6. 📄 AI Document Intelligence & Human-in-the-Loop OCR
* **Frontline Document Capture**: Clinicians capture photos of handwritten discharge summaries, paper prescriptions, and lab sheets directly via mobile camera or desktop upload.
* **Dual OCR Engine**: Microservices powered by Google Gemini 1.5 Flash and Hugging Face TrOCR extract handwritten clinical cursive.
* **Clinical Normalization**: Parses unstructured cursive into structured fields: Diagnosis, Medications, Dosages, Regimen Frequencies, Precautions, and Follow-Up Dates.
* **Human-in-the-Loop Verification**: Extractions below 90% confidence are flagged with `NEEDS_REVIEW` badges and open an interactive side-by-side image comparison drawer. *No AI guess is ever saved as fact without explicit clinician confirmation.*

### 7. 🔍 Fuzzy & Deterministic Identity Reconciliation
* **Multi-Vector Matching Algorithm**: Evaluates incoming patient records against hospital master registries using weighted scoring vectors:
  * **Phone Number Match (Exact)**: 40 points
  * **Normalized Name String Distance (Levenshtein / RapidFuzz)**: 35 points
  * **Village / Gram Panchayat Match**: 15 points
  * **Age & Gender Proximity**: 10 points
* **Strict Anti-Merge Directive**: Even a 99% match generates a candidate for clinician signoff (`IDENTITY_CONFIRMED`). *Zero silent merges.*

### 8. 🩺 Rapid Vitals & Early Warning Score (EWS)
* **High-Speed Intake**: Records Systolic/Diastolic BP, Heart Rate, Respiratory Rate, SpO2, and Blood Glucose in seconds.
* **Dynamic EWS Scoring**: Calculates real-time 0–4 acuity scores with instant visual alerts:
  * **Systolic BP ≥ 160 mmHg** → Hypertensive Crisis alert.
  * **SpO₂ < 92%** → Hypoxemic Distress alert.
  * **Blood Glucose < 60 or > 250 mg/dL** → Glycemic Emergency alert.
* **1-Click Emergency Escalation**: Automatically generates a pre-populated emergency referral slip.

---

## 🔄 End-to-End Clinical Lifecycle State Machine

```
[ DRAFT ] ➔ [ QUEUED (IndexedDB) ] ➔ [ SYNCED ] ➔ [ SENT (Dispatched) ]
                                                        │
                                                        ▼
[ BED READY (Hospital Acknowledged) ] 🠔 [ EMERGENCY PUSH ALERT (Lock Screen) ]
      │
      ▼
[ RECEIVED (Triage Desk) ] ➔ [ IDENTITY_CONFIRMED (Reconciled) ] ➔ [ CONSULTED ]
                                                                        │
                                                                        ▼
[ FOLLOW_UP_COMPLETED ] 🠔 [ ASHA WORKER DISPATCHED ] 🠔 [ FOLLOW_UP_DUE (Day-7/14) ]
```

---

## 👥 User Roles & Preseeded Demo Credentials

SwasthyaSetu implements strict Role-Based Access Control (RBAC). The platform includes preseeded staff credentials for instant 1-click testing:

| Role | Portal Route | Primary Operational Scope | Demo Email | Password | Assigned Facility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`PHC_USER`** | `/phc` | Rapid Vitals, Create Referrals, Local Queue, Pre-Referral Stabilization, Follow-Up Ledger | `phc_doctor@swastyasetu.gov.in` | `Doctor@123` | Primary Health Centre Khed |
| **`CLINICIAN`** | `/hospital` | Inbound Emergency Queue, Web Push Alerts, Document OCR Scanner, Discharge Summaries | `hospital_doctor@swastyasetu.gov.in` | `Doctor@123` | Aundh District Hospital |
| **`REFERRAL_COORDINATOR`** | `/triage` | District Bed Allocation, Inbound Ambulance Queue, 108 Handoff | `coordinator@swastyasetu.gov.in` | `Doctor@123` | Aundh District Hospital |
| **`ADMIN`** | `/admin` | Facility Directory, Immutable Audit Logs, RBAC Provisioning | `admin@swastyasetu.gov.in` | `Doctor@123` | District Health Network |

> [!TIP]
> **1-Click Quick Demo Login**: On the [`/login`](http://localhost:5173/login) screen, click any of the 4 pre-configured demo staff cards to log in instantly without typing. When signing out, clinicians remain directly on `/login` for seamless role switching.

---

## 🏗️ System Architecture & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor PHC as PHC Medical Officer
    participant LocalDB as Local IndexedDB (Dexie)
    participant SyncWorker as Sync Worker
    participant API as Express API Gateway
    participant DB as PostgreSQL (Supabase)
    actor Hosp as Hospital Emergency Clinician
    participant SW as Service Worker (PWA)

    PHC->>LocalDB: Record Vitals and Pre-Referral Stabilization
    PHC->>LocalDB: Create EMERGENCY Referral (Offline Capable)
    Note over PHC,LocalDB: Stored instantly in Dexie.js (REF-LOC-XXXXXX)
    
    SyncWorker->>API: POST /api/referrals (or POST /api/sync/events)
    API->>DB: Commit Referral, Patient and AuditEvent
    
    rect rgb(254, 242, 242)
    Note over API,Hosp: Emergency Alert Engine (VAPID Web Push)
    API->>SW: High-Priority Web Push Alert
    SW->>Hosp: Lock-Screen Notification with Urgent Vibration
    API->>Hosp: In-App Dashboard Banner and Clinical Audio Chime
    Hosp->>API: POST /api/referrals/:id/acknowledge
    end

    API->>DB: Update status to RECEIVED and log AuditEvent
    API-->>PHC: Real-time update to BED READY
    
    Hosp->>API: Upload Handwritten Discharge Summary
    API->>DB: Schedule Day-7 PHC Follow-Up
    PHC->>API: Inspect Follow-Up Log and Dispatch ASHA Worker
```

---

## 💻 Tech Stack Matrix

```
                      SWASTYASETU TECHNOLOGY STACK
┌─────────────────────────────────────────────────────────────────────────┐
│ FRONTEND (apps/web)                                                     │
│ React 18 • TypeScript • Vite 5 • Tailwind CSS • Dexie (IndexedDB)       │
│ Service Worker v1.1 • Web Push API • Web Audio API Synthesizer • PWA    │
├─────────────────────────────────────────────────────────────────────────┤
│ API GATEWAY (apps/api)                                                  │
│ Node.js 20+ • Express • TypeScript • Prisma ORM • web-push (VAPID)     │
│ Zod • JWT • Multer • BcryptJS                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ SHARED CORE (packages/shared)                                           │
│ Canonical Domain Types • DTO Schemas • Clinical Severity Constants     │
├─────────────────────────────────────────────────────────────────────────┤
│ DATABASE & STORAGE                                                      │
│ PostgreSQL 16 on Supabase • PgBouncer Pooler • Local IndexedDB          │
├─────────────────────────────────────────────────────────────────────────┤
│ AI & MICROSERVICES (services/ai)                                        │
│ Python 3.10+ • FastAPI • Google Gemini 1.5 Flash • Hugging Face TrOCR   │
├─────────────────────────────────────────────────────────────────────────┤
│ INFRASTRUCTURE & DEPLOYMENT                                             │
│ Vercel (Frontend SPA) • Render (REST API) • Docker Compose (On-Prem)    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
SWASTYASETU/
├── packages/
│   └── shared/                       # Shared TypeScript definitions & contracts
│       ├── src/
│       │   ├── types.ts              # Domain entities, enums, DTOs, sync models
│       │   ├── constants.ts          # Clinical ranges, mock facilities, seed data
│       │   └── index.ts              # Public package exports
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   ├── web/                          # Frontend Progressive Web App (PWA)
│   │   ├── public/
│   │   │   ├── sw.js                 # Service Worker (Offline cache & Push notifications)
│   │   │   ├── manifest.webmanifest  # PWA Manifest (Icons, standalone mode)
│   │   │   └── icons/                # High-res clinical application icons
│   │   ├── src/
│   │   │   ├── components/           # EmergencyAlertBanner, OfflineStatusBar, PWAInstallBanner, Navbar
│   │   │   ├── context/              # AuthContext (JWT management & session handling)
│   │   │   ├── features/
│   │   │   │   ├── home/             # Public Landing Page & Fixed PublicHeader
│   │   │   │   ├── auth/             # LoginView (1-click demo cards), SignupView
│   │   │   │   ├── phc/              # PHC Dashboard, Rapid Vitals, Pre-Referral Stabilization
│   │   │   │   ├── hospital/         # District Hospital Portal, Triage Queue, Discharge Summary
│   │   │   │   ├── coordinator/      # Triage Dashboard, Bed Allocation, 108 Transport Slip
│   │   │   │   └── admin/            # Facility Directory & Immutable Audit Ledger
│   │   │   ├── hooks/
│   │   │   │   ├── usePWA.ts         # Multi-platform PWA install state detection
│   │   │   │   ├── usePushNotifications.ts # Web Push subscription & permission manager
│   │   │   │   └── usePageMeta.ts    # Dynamic clinical route titles
│   │   │   ├── lib/
│   │   │   │   ├── audioAlert.ts     # Web Audio API clinical two-tone chime synthesizer
│   │   │   │   ├── db.ts             # Dexie.js IndexedDB schema & local tables
│   │   │   │   ├── api.ts            # Resilient API client with JWT injection
│   │   │   │   └── useNetworkSync.ts # Online/offline sentinel & automatic background sync
│   │   │   └── App.tsx               # Application shell, layout, and route guards
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                          # Backend REST API Gateway
│       ├── src/
│       │   ├── config/
│       │   │   └── vapid.ts          # Web Push VAPID credentials & configuration
│       │   ├── modules/
│       │   │   ├── auth/             # Auth routes, JWT issuing, demo logins
│       │   │   ├── notifications/    # Push subscriptions & emergency alert dispatcher
│       │   │   ├── referrals/        # Referral CRUD, stabilization, & 2-way acknowledge
│       │   │   ├── sync/             # Idempotent sync gateway (eventId deduplication)
│       │   │   ├── identity/         # Deterministic & fuzzy patient matching
│       │   │   ├── documents/        # Multer image uploads & OCR extraction
│       │   │   ├── vitals/           # Vitals intake & EWS computation
│       │   │   ├── followups/        # Post-discharge returns & ASHA dispatch
│       │   │   └── facilities/       # Facility registry & live bed counts
│       │   ├── seed.ts               # Database seed runner (facilities, demo users)
│       │   └── server.ts             # Express server setup & modular routers
│       ├── prisma/
│       │   └── schema.prisma         # Prisma schema with PushSubscription model
│       └── package.json
│
├── services/
│   └── ai/                           # Python AI Microservice (TrOCR / Gemini)
│       ├── app/main.py               # FastAPI endpoints for document extraction
│       └── requirements.txt
│
├── .env.example                      # Environment variables template
├── docker-compose.prod.yml           # Self-hosted production Docker setup
├── Dockerfile                        # Multi-stage production container build
├── vercel.json                       # Vercel deployment configuration
└── package.json                      # Monorepo npm workspaces configuration
```

---

## 📡 Core API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue 7-day JWT token | No |
| `POST` | `/api/auth/signup` | Register new healthcare staff account | No |
| `GET` | `/api/facilities` | List district hospitals and PHCs with bed capacity | Yes |
| `POST` | `/api/sync/events` | Idempotent bulk sync endpoint for offline mutations | Yes |
| `GET` | `/api/referrals` | List referrals filtered by facility or status | Yes |
| `POST` | `/api/referrals` | Create a new structured digital referral | Yes |
| `POST` | `/api/referrals/:id/acknowledge` | Hospital clinician acknowledges emergency transfer (**`BED READY`**) | Yes |
| `POST` | `/api/referrals/:id/stabilization` | Record pre-referral loading doses & emergency medications | Yes |
| `GET` | `/api/referrals/:id/stabilization` | Retrieve recorded pre-referral stabilization protocol | Yes |
| `GET` | `/api/referrals/:id/transport-slip` | Generate 108 Ambulance official digital transport slip | Yes |
| `PATCH` | `/api/referrals/:id/status` | Advance referral lifecycle status | Yes |
| `GET` | `/api/notifications/vapid-public-key` | Retrieve VAPID public key for browser push subscription | No |
| `POST` | `/api/notifications/subscribe` | Register or refresh device Web Push subscription | Yes |
| `POST` | `/api/notifications/unsubscribe` | Deactivate device push subscription | Yes |
| `POST` | `/api/notifications/test` | Dispatch test emergency push alert with sound & vibration | Yes |
| `POST` | `/api/identity/match` | Compute multi-vector fuzzy patient identity match | Yes |
| `POST` | `/api/vitals` | Record rapid patient vitals & compute EWS | Yes |
| `POST` | `/api/documents/upload` | Upload handwritten summary & trigger OCR extraction | Yes |
| `GET` | `/api/followups` | Retrieve pending post-discharge follow-up obligations | Yes |
| `POST` | `/api/followups/:id/asha-dispatch` | Dispatch village ASHA worker for home visit | Yes |

---

## 🛡️ Hard Clinical Safety Principles

All developers and AI agents contributing to this repository must adhere to the following hard safety rules:

1. **Rule 1 (No Silent Guessing)**: If an AI extraction or abbreviation is uncertain, mark it `NEEDS_REVIEW` with its numeric confidence score. Never save a low-confidence guess as clinical fact.
2. **Rule 2 (No Silent Merging)**: Even a 99% fuzzy match requires explicit clinician review and confirmation (`IDENTITY_CONFIRMED`). Never merge patient records automatically.
3. **Rule 3 (No Autonomous Clinical Decisions)**: AI extracts and normalizes document text; it never diagnoses conditions or prescribes treatments. Clinical responsibility remains strictly with the licensed clinician.
4. **Rule 4 (Immutable Audit Trail)**: Every state change generates an immutable `AuditEvent` (`actorId`, `actorRole`, `eventType`, `entityId`, `timestamp`).
5. **Rule 5 (Idempotent Sync)**: All offline sync mutations must use client-generated `eventId` values to prevent duplicate records on intermittent connections.
6. **Rule 6 (Zero "Vibe-Coding")**: No neon glows, gaming dark-mode gradients, or playful chatbot decorations. The interface strictly adheres to the `#0D9488` Clinical Teal theme designed for high-stress medical environments.

---

## 🚀 Getting Started & Local Development

### Prerequisites
* **Node.js**: v20.x or higher
* **npm**: v10.x or higher
* **PostgreSQL**: Local instance OR hosted Supabase database

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/aniketvishwakarma-11/Swastyasetu.git
cd Swastyasetu

# Install all monorepo dependencies across workspaces
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Ensure your database connection string and VAPID keys are configured in `.env`:
```ini
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/swastyasetu?schema=public"
JWT_SECRET="super-secret-jwt-token-change-in-production-min32chars"
DEMO_MODE=true

# Web Push VAPID Configuration
VAPID_PUBLIC_KEY="BGyhjG344bBIH6jSWTRg1eRWW52pu4ioFvfp4-2AzdJj2UJEhmFAt9-FrziWXgjvDaHUWxVmB-ehXtZ6cetTaJU"
VAPID_PRIVATE_KEY="drBw7RhGMnGB7JE_A4v0kx09ZQK2QQsN_bAW5czsC8o"
VAPID_SUBJECT="mailto:alerts@swastyasetu.gov.in"
VITE_VAPID_PUBLIC_KEY="BGyhjG344bBIH6jSWTRg1eRWW52pu4ioFvfp4-2AzdJj2UJEhmFAt9-FrziWXgjvDaHUWxVmB-ehXtZ6cetTaJU"
```

### 3. Generate Prisma Client & Push Schema
```bash
# Push schema changes (including PushSubscription) to PostgreSQL
npm run prisma:generate --workspace=apps/api
npm run prisma:migrate --workspace=apps/api # or npx prisma db push --schema=apps/api/prisma/schema.prisma

# Seed demo facilities, clinicians, and initial cases
npm run db:seed
```

### 4. Start Development Servers
Run the frontend and backend in separate terminals:

```bash
# Terminal 1: Start Backend API (Port 5000)
npm run dev:api

# Terminal 2: Start Frontend Web App (Port 5173)
npm run dev:web
```

Open your browser:
* **Frontend Application**: `http://localhost:5173`
* **Backend API Health**: `http://localhost:5000/api/health`

---

## 🐳 Docker Deployment (Self-Hosted / On-Premise)

To run the complete production stack (Application + PostgreSQL) using Docker Compose:

```bash
# Build and run the containers in detached mode
docker compose -f docker-compose.prod.yml up -d --build

# View container logs
docker compose -f docker-compose.prod.yml logs -f

# Shut down the stack
docker compose -f docker-compose.prod.yml down
```

The production container serves the built Vite frontend and the Express API together on `http://localhost:5000`.

---

## ☁️ Cloud Deployment Architecture

The SwasthyaSetu codebase is pre-configured for automated cloud deployments:

| Service | Target Platform | Build Command | Output / Directory | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web App** | **Vercel** | `npm run build:web` | `dist` | Automatic SPA rewrite rules configured in `vercel.json` |
| **Backend REST API** | **Render** | `npm run build:api` | `apps/api/dist` | Node.js Web Service with automatic Prisma client generation before `tsc` |
| **Database** | **Supabase** | Managed PostgreSQL | Port 5432 / 6543 | Includes PgBouncer connection pooling for high throughput |

---

## 👥 Contributors & Team

Crafted with dedication by **Team TECHX**:
* Frontline healthcare workflow design & clinical safety architecture
* Offline-first sync, Web Push resilience & PWA mobile engineering
* Human-in-the-loop clinical document intelligence

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
