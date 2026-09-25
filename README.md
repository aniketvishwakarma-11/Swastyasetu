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
[![Dexie](https://img.shields.io/badge/IndexedDB-Dexie.js-00A98F)](https://dexie.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**The right patient story, at the right point of care — even with zero internet connectivity.**

[Live Demo](#-preseeded-demo-credentials) • [Key Features](#-key-architectural-pillars) • [System Architecture](#-system-architecture) • [Getting Started](#-getting-started--local-development) • [Clinical Safety Rules](#-hard-clinical-safety-principles)

</div>

---

## 📖 Executive Summary & Mission

In tiered public healthcare networks (Sub-Centres → Primary Health Centres [PHCs] → Community Health Centres [CHCs] → Sub-District Hospitals → District Hospitals / Tertiary Medical Colleges), **the critical failure mode is not a lack of doctors or diagnostic equipment—it is the catastrophic loss of clinical continuity between care tiers.**

**SwasthyaSetu** (स्वास्थ्यसेतु - *Bridge of Health*) is an **offline-first, closed-loop healthcare referral, document intelligence, and post-discharge continuity platform**. It eliminates the transit blind spot between rural frontline clinics and district hospitals, ensures zero patient records are lost in transit, and guarantees that discharge plans translate into real-world recovery in rural villages.

---

## 🚨 The 4 Frontline Healthcare Failures We Solve

```mermaid
flowchart TD
    A["Failure 1: The Lost Referral"] -->|Paper slips lost in transit| E["Ambulance arrives unannounced; ICU & OT unprepared"]
    B["Failure 2: The Frontline Identity Gap"] -->|Spelling variances, no universal ID| F["Fragmented history, duplicate workups & lost allergies"]
    C["Failure 3: The Unreadable Discharge"] -->|Cursive summaries & hospital jargon| G["30-day readmissions & unmanaged chronic mortality"]
    D["Failure 4: Intermittent Connectivity"] -->|Cloud EHRs freeze during power cuts| H["Doctors abandon digital tools & revert to paper ledgers"]
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

SwasthyaSetu provides a unified clinical continuity platform built upon six foundational pillars:

### 1. 📴 Offline-First Local-to-Cloud Sync Engine
* **Instant Client Storage**: All clinical intakes, vitals, and referrals are written immediately to **IndexedDB via Dexie.js** in the browser. Zero network latency for busy clinicians.
* **Idempotent Background Queue**: When internet connectivity returns, an offline sync worker pushes queued mutations to the backend (`POST /api/sync/events`). Every event carries a client-generated UUID `eventId` (`EVT-01J...`) guaranteeing idempotency and preventing duplicate records.
* **Network Status Sentinel**: Real-time connection monitoring with offline indicators, queued count badges, and an emergency **compact 153-character SMS fallback generator** for cell-tower-only zones.

### 2. 🔄 Closed-Loop Digital Referral Network
* **Standardized Clinical Referral**: Replaces paper slips with structured digital referrals specifying urgency (`ROUTINE`, `URGENT`, `EMERGENCY`), primary clinical indication, provisional diagnosis, and immediate stabilized interventions.
* **Live District Bed Visibility**: Query real-time bed capacity (General, Oxygen, ICU, Ventilator) at receiving District Hospitals before dispatch.
* **Bidirectional Lifecycle**: Track every patient from referral to completed community follow-up:

```
[ DRAFT ] ➔ [ QUEUED ] ➔ [ SYNCED ] ➔ [ SENT ] ➔ [ RECEIVED ]
                                                    │
                                                    ▼
[ FOLLOW_UP_COMPLETED ] 🠔 [ FOLLOW_UP_DUE ] 🠔 [ CONSULTED ] 🠔 [ IDENTITY_CONFIRMED ]
```

### 3. 📄 AI Document Intelligence & Human-in-the-Loop OCR
* **Frontline Document Capture**: Clinicians capture photos of handwritten discharge summaries, paper prescriptions, and lab sheets directly via mobile camera or desktop upload.
* **Dual OCR Engine**: Microservices powered by Google Gemini 1.5 Flash and Hugging Face TrOCR extract handwritten clinical text.
* **Clinical Normalization**: Parses unstructured cursive into structured fields: Diagnosis, Medications, Dosages, Regimen Frequencies, Precautions, and Follow-Up Dates.
* **Human-in-the-Loop Verification**: Extractions below 90% confidence are flagged with `NEEDS_REVIEW` badges and open an interactive side-by-side image comparison drawer. *No AI guess is ever saved as fact without explicit clinician confirmation.*

### 4. 🔍 Fuzzy & Deterministic Identity Reconciliation
* **Multi-Vector Matching Algorithm**: Evaluates incoming patient records against hospital registries using weighted scoring vectors:
  * **Phone Number Match (Exact)**: 40 points
  * **Normalized Name String Distance (Levenshtein / RapidFuzz)**: 35 points
  * **Village / Gram Panchayat Match**: 15 points
  * **Age & Gender Proximity**: 10 points
* **Strict Anti-Merge Directive**: Even a 99% match generates a candidate for clinician signoff (`IDENTITY_CONFIRMED`). *Zero silent merges.*

### 5. 🩺 Rapid Vitals & Early Warning Score (EWS)
* **High-Speed Intake**: Records Systolic/Diastolic BP, Heart Rate, Respiratory Rate, SpO2, and Blood Glucose in seconds.
* **Dynamic EWS Scoring**: Calculates real-time 0–4 acuity scores with instant visual alerts.
* **Clinical Safety Safeguards**:
  * **Systolic BP ≥ 160 mmHg** → Hypertensive Urgency / Crisis alert.
  * **SpO₂ < 92%** → Hypoxemic Distress alert.
  * **Blood Glucose < 60 or > 250 mg/dL** → Glycemic emergency alert.
* **1-Click Emergency Escalation**: Automatically generates a pre-populated emergency referral slip.

### 6. 🤝 Post-Discharge Return & Community Follow-Up Tracker
* **Automated Return Scheduling**: When a District Hospital completes a consultation or discharge, a follow-up obligation is scheduled at the patient's local PHC (Day-7 / Day-14).
* **Medication Adherence Auditing**: Frontline clinicians verify adherence (*Full*, *Partial*, *Adverse Effects*, *Discontinued*).
* **ASHA Community Outreach Dispatch**: When patients miss follow-up appointments, doctors can 1-click dispatch local village **ASHA (Accredited Social Health Activist)** health workers for home visits and medication checks.

---

## 👥 User Roles & Preseeded Demo Credentials

SwasthyaSetu implements strict Role-Based Access Control (RBAC). The platform includes preseeded staff credentials for instant 1-click testing:

| Role | Portal Route | Primary Operational Scope | Demo Email | Password | Assigned Facility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`PHC_USER`** | `/phc` | Rapid Vitals, Create Referrals, Local Queue, Follow-Up Ledger | `phc_doctor@swastyasetu.gov.in` | `password123` | Primary Health Centre Khed |
| **`CLINICIAN`** | `/hospital` | Inbound Referrals, Document OCR Scanner, Discharge Summaries | `hospital_doctor@swastyasetu.gov.in` | `password123` | Aundh District Hospital |
| **`REFERRAL_COORDINATOR`** | `/triage` | District Bed Allocation, Inbound Ambulance Queue, Triage | `coordinator@swastyasetu.gov.in` | `password123` | Aundh District Hospital |
| **`ADMIN`** | `/admin` | Facility Directory, Immutable Audit Logs, RBAC Provisioning | `admin@swastyasetu.gov.in` | `password123` | District Health Network |

> [!TIP]
> **1-Click Quick Demo Login**: On the [`/login`](http://localhost:5173/login) screen, click any of the 4 pre-configured demo staff cards to log in instantly without typing.

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
    actor Coord as Referral Coordinator (Triage)
    actor Spec as Hospital Specialist

    PHC->>LocalDB: Record Vitals & Create Referral (Offline Ready)
    Note over PHC,LocalDB: Writes locally with instant UI feedback
    SyncWorker->>API: POST /api/sync/events (Idempotent eventId)
    API->>DB: Upsert Patient, Referral & AuditEvent
    API-->>SyncWorker: 200 OK (SYNCED)
    SyncWorker->>LocalDB: Update local status to SYNCED
    
    Coord->>API: Monitor Inbound Queue (/triage)
    Coord->>API: Allocate ICU/Oxygen Bed & Accept Referral
    
    Spec->>API: Review Case & Upload Handwritten Discharge Summary
    API->>API: OCR Processing & Field Normalization
    Spec->>API: Review & Sign-Off Extraction (Human-in-the-Loop)
    
    API->>DB: Schedule Day-7 PHC Follow-Up
    PHC->>API: Inspect Follow-Up Log (/phc) & Verify Medication Adherence
    Note over PHC: If overdue: 1-Click Dispatch Village ASHA Worker
```

---

## 💻 Tech Stack Matrix

```
                      SWASTYASETU TECHNOLOGY STACK
┌─────────────────────────────────────────────────────────────────────────┐
│ FRONTEND (apps/web)                                                     │
│ React 18 • TypeScript • Vite 5 • Tailwind CSS • Lucide • Dexie (PWA)   │
├─────────────────────────────────────────────────────────────────────────┤
│ API GATEWAY (apps/api)                                                  │
│ Node.js 20+ • Express • TypeScript • Prisma ORM • Zod • JWT • Multer    │
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
│   └── shared/                       # Shared TypeScript definitions
│       ├── src/
│       │   ├── types.ts              # Domain entities, enums, DTOs, sync models
│       │   ├── constants.ts          # Clinical ranges, mock facilities, seed data
│       │   └── index.ts              # Public package exports
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   ├── web/                          # Frontend Progressive Web App
│   │   ├── src/
│   │   │   ├── components/           # Navbar, ProtectedRoute, Modals, Badges
│   │   │   ├── context/              # AuthContext, Global state
│   │   │   ├── features/
│   │   │   │   ├── home/             # Public Landing Page & System Showcase
│   │   │   │   ├── auth/             # LoginView (1-click demo), SignupView
│   │   │   │   ├── phc/              # PHC Dashboard, Rapid Vitals, Referrals
│   │   │   │   ├── hospital/         # District Hospital Portal, Inbound Queue
│   │   │   │   ├── coordinator/      # Triage Dashboard, Bed Allocation (/triage)
│   │   │   │   └── admin/            # Facility Directory & Immutable Audit Ledger
│   │   │   ├── lib/
│   │   │   │   ├── db.ts             # Dexie.js IndexedDB schema & local tables
│   │   │   │   ├── api.ts            # Resilient API client with JWT injection
│   │   │   │   └── useNetworkSync.ts # Online/offline sentinel & sync scheduler
│   │   │   └── App.tsx               # Routing and full-width layout
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                          # Backend REST API Gateway
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/             # Auth routes, JWT issuing, demo logins
│       │   │   ├── referrals/        # Referral CRUD & state transitions
│       │   │   ├── sync/             # Idempotent sync gateway (eventId deduplication)
│       │   │   ├── identity/         # Deterministic & fuzzy patient matching
│       │   │   ├── documents/        # Multer image uploads & OCR extraction
│       │   │   ├── vitals/           # Vitals intake & EWS computation
│       │   │   ├── followups/        # Post-discharge returns & ASHA dispatch
│       │   │   └── facilities/       # Facility registry & live bed counts
│       │   ├── seed.ts               # Database seed runner (facilities, demo users)
│       │   └── server.ts             # Express server setup & middleware
│       ├── prisma/
│       │   └── schema.prisma         # Prisma schema for PostgreSQL
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
Ensure your database connection string is configured in `.env` (or use the provided defaults for local testing):
```ini
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/swastyasetu?schema=public"
JWT_SECRET="super-secret-jwt-token-change-in-production-min32chars"
DEMO_MODE=true
```

### 3. Generate Prisma Client & Seed Database
```bash
# Generate the Prisma Client
npm run prisma:generate

# Push schema and seed initial facilities, demo users, and candidate patients
npm run db:seed
```

### 4. Start Development Servers
You can run the frontend and backend concurrently or in separate terminals:

```bash
# Terminal 1: Start Backend API (Port 5000)
npm run dev:api

# Terminal 2: Start Frontend Web App (Port 5173)
npm run dev:web
```

Open your browser and navigate to:
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

The SwasthyaSetu codebase is pre-configured for seamless cloud deployments:

| Service | Target Platform | Build Command | Output / Directory | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web App** | **Vercel** | `npm run build:web` | `dist` | Automatic SPA rewrite rules configured in `vercel.json` |
| **Backend REST API** | **Render** | `npm run build:api` | `apps/api/dist` | Node.js Web Service with automatic Prisma migrations |
| **Database** | **Supabase** | Managed PostgreSQL | Port 5432 / 6543 | Includes PgBouncer connection pooling for high throughput |

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
| `PATCH` | `/api/referrals/:id/status` | Advance referral lifecycle status | Yes |
| `POST` | `/api/identity/match` | Compute multi-vector fuzzy patient identity match | Yes |
| `POST` | `/api/vitals` | Record rapid patient vitals & compute EWS | Yes |
| `POST` | `/api/documents/upload` | Upload handwritten summary & trigger OCR extraction | Yes |
| `GET` | `/api/followups` | Retrieve pending post-discharge follow-up obligations | Yes |
| `POST` | `/api/followups/:id/asha-dispatch` | Dispatch village ASHA worker for home visit | Yes |

---

## 👥 Contributors & Team

Crafted with dedication by **Team TECHX**:
* Frontline healthcare workflow design & clinical safety architecture
* Offline-first sync & mobile resilience engineering
* Human-in-the-loop clinical document intelligence

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
