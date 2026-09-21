# SwasthyaSetu — Clinical & Architectural Audit Report
**Branch:** `origin/nikhil` vs `origin/main`  
**Commit Inspected:** `9802cb282ac32ccedf2178841139176a795dc77d`  
**Commit Message:** `feat(referrals,identity): implement PHC offline digital referrals and District Hospital triage with fuzzy identity reconciliation`  
**Scope of Changes:** 13 files, +2,716 insertions, -128 deletions  
**Audit Standard:** Real-World Healthcare IT Standards (ABDM / FHIR R4, ISO 27799 / HIPAA, WCAG 2.1 AA, Clinical Safety Directives)

---

## 1. Executive Summary

Developer Nikhil implemented the foundational core clinical referral pipeline connecting rural Primary Health Centres (PHCs) to Secondary District Hospitals. The changeset addresses three core pillars:
1. **PHC Digital Referral Generation with Offline Queueing** (browser IndexedDB via Dexie.js + 2G SMS fallback).
2. **Idempotent Background Synchronization** (`eventId`-keyed upserts and batch sync).
3. **Multi-Field Fuzzy Patient Identity Reconciliation** (weighted Levenshtein/token-sort matching + clinician-driven confirmation interface).

### Overall Assessment
- **Clinical Safety Grade:** **9.2 / 10** — Strict adherence to *Hard Rule 2 (No Silent Merging)*. Even a 94% composite match requires explicit clinician review before patient records are linked.
- **Offline Resilience Grade:** **8.8 / 10** — Dual-mode operation (direct cloud submission when online, automatic fallback to Dexie.js when offline, heartbeat polling every 15s, and 160-character cellular SMS fallback).
- **Auditability Grade:** **9.5 / 10** — Every referral creation, sync event, and identity confirmation generates an append-only `AuditEvent` with actor context and facility IDs.
- **Healthcare Interoperability (ABDM/FHIR) Grade:** **6.5 / 10** — Internal proprietary JSON models are used rather than native FHIR R4 `ServiceRequest` and `Patient` resources.

---

## 2. Comprehensive Inventory of Modified & Created Files

| File Path | Type | Changes | Clinical Role / Purpose |
|:---|:---:|:---:|:---|
| `apps/api/src/modules/identity/identityMatcher.ts` | **NEW** | +210 lines | Multi-field weighted fuzzy matching engine (Name 35%, Phone 25%, Village 15%, Age 10%, Gender 5%, Context 10%). |
| `apps/api/src/modules/identity/identity.routes.ts` | **NEW** | +301 lines | Identity reconciliation endpoints: `GET /evaluate/:referralId`, `POST /confirm`, `POST /reject`. Logs immutable `AuditEvent`. |
| `apps/api/src/modules/referrals/referrals.routes.ts` | **NEW** | +259 lines | Referral CRUD with collision-resistant `RF-XXXX` generation, Prisma transactions, and role-based filtering. |
| `apps/api/src/modules/sync/sync.routes.ts` | **NEW** | +224 lines | Batch idempotent sync handler (`POST /events`) verifying `eventId` against replay/duplicate attacks; status tracking (`GET /status`). |
| `apps/api/src/server.ts` | **MODIFIED** | +16, -3 lines | Environment loading order fix (`.env` before Prisma init) and router mounting for `/referrals`, `/sync`, `/identity`. |
| `apps/api/package.json` | **MODIFIED** | +3, -3 lines | Added `dotenv/config` flags to `dev` and `db:seed` scripts for deterministic environment resolution. |
| `apps/web/src/lib/db.ts` | **MODIFIED** | +36, -8 lines | IndexedDB schema configuration using Dexie.js (`localDb`) for local referrals, patients, and sync queue. |
| `apps/web/src/lib/useNetworkSync.ts` | **NEW** | +116 lines | Network connectivity hook with online/offline listeners, 15-second server heartbeat check, and queue auto-flush. |
| `apps/web/src/features/phc/ReferralModal.tsx` | **NEW** | +476 lines | Full clinical referral modal with urgency triage (`ROUTINE`, `URGENT`, `EMERGENCY`), demo loader, and offline queueing. |
| `apps/web/src/features/phc/PHCDashboard.tsx` | **MODIFIED** | +380, -43 lines | Frontline referral management dashboard with live status cards, force-sync action, merged table, and 2G SMS generator modal. |
| `apps/web/src/features/hospital/IdentityReconciliationModal.tsx` | **NEW** | +350 lines | Side-by-side comparison interface (Incoming vs Candidate) with field-level similarity badges and confirm/reject actions. |
| `apps/web/src/features/hospital/HospitalDashboard.tsx` | **MODIFIED** | +370, -44 lines | District Hospital triage queue showing incoming referrals, similarity score badges, and quick-launch identity verification. |
| `package-lock.json` | **MODIFIED** | +13 lines | Lockfile updates for dependency synchronization. |

---

## 3. Deep-Dive Feature Analysis & Clinical Verification

### Feature 1: Primary Care Digital Referral Creation (`ReferralModal.tsx` & `referrals.routes.ts`)
- **Workflow:** Allows a PHC Medical Officer or Community Health Officer (CHO) to document a patient's demographics, clinical reason, vitals, pre-referral stabilization medications, urgency level, and select the destination District Hospital.
- **Triage Urgency Selection:**
  - `ROUTINE`: Slate badge, standard clinic queue.
  - `URGENT (24-48h)`: Amber badge (`bg-amber-50 text-amber-800 border-amber-300`).
  - `EMERGENCY (Immediate)`: Rose badge with shield alert icon (`bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-300`).
- **Clinical Safety Highlights:**
  - Includes a 1-click **"Load Ramesh Yadav Demo"** scenario (47M, Acute STEMI chest pain, ECG ST elevations, pre-referral Aspirin/Clopidogrel) enabling immediate verification and clinician training.
  - Transactional integrity: When online, a single Prisma transaction atomically persists the Patient (if not existing), the Referral with unique human-readable identifier (e.g. `RF-8204`), and an immutable `AuditEvent`.

### Feature 2: Offline-First Queue & Sync Engine (`useNetworkSync.ts`, `db.ts`, `sync.routes.ts`)
- **Workflow:** When the PHC loses internet connectivity, referral dispatch does NOT block or error out:
  1. The referral is saved directly to the browser's IndexedDB table (`localDb.referrals`) with `syncStatus: 'QUEUED'`.
  2. A sync event is placed into `localDb.syncQueue` with a client-generated UUID (`eventId: 'EVT-...'`).
  3. The `useNetworkSync` hook monitors `navigator.onLine` and runs a 15-second heartbeat ping against `/api/health`.
  4. Once connectivity is restored, the queue auto-flushes in batch to `POST /api/sync/events`.
- **Idempotency & Replay Defense:**
  - `sync.routes.ts` checks `await prisma.syncEvent.findUnique({ where: { eventId } })`. If an event was already processed, it returns `duplicate: true` and status `SYNCED`, preventing duplicate patient or referral creation across flaky 2G retries.

### Feature 3: Multi-Field Fuzzy Identity Matching Engine (`identityMatcher.ts`)
- **Mathematical Formulation:** Matches incoming patients against district registry records using a weighted multi-attribute model:
  $$\text{Composite Score} = (0.35 \times S_{\text{name}}) + (0.25 \times S_{\text{phone}}) + (0.15 \times S_{\text{village}}) + (0.10 \times S_{\text{age}}) + (0.05 \times S_{\text{gender}}) + (0.10 \times S_{\text{context}})$$
- **Algorithms Used:**
  - Token-Sort Levenshtein distance for Name and Village (handles transposed first/last names like "Ramesh Yadav" vs "Yadav Ramesh").
  - Last-10-digits normalization and digit-overlap matching for Indian mobile numbers.
  - Tolerant age window ($|Age_1 - Age_2| \le 2$ gives 0.90; $\le 5$ gives 0.60; $>5$ gives 0.10) to account for estimated ages common in rural registries.
- **Candidate Match Cutoff:** Candidates scoring $\ge 0.50$ are surfaced, with $\ge 0.75$ flagged as primary candidates.

### Feature 4: Side-by-Side Identity Reconciliation Interface (`IdentityReconciliationModal.tsx`)
- **Workflow:** When an incoming referral arrives at the District Hospital with a potential match, the clinician is presented with a 50/50 split comparison:
  - **Left Column:** Incoming Referral Patient from PHC (unverified demographics + acute clinical complaint).
  - **Right Column:** Candidate Hospital Registry Record with historical master ID.
  - **Field-by-Field Badges:** `Match (100%)` (emerald), `Partial (78%)` (amber), or `Mismatch` (rose).
  - **Clinician Audit Note:** Free-text mandatory verification notes stored in the permanent audit log.
  - **Clinician Actions:**
    1. *Confirm Identity Match:* Links referral to existing patient record (`ReferralStatus.IDENTITY_CONFIRMED`) and updates `IdentityMatch` status.
    2. *Register as New Patient:* Rejects merge, marking the incoming patient as an independent new individual (`ReferralStatus.RECEIVED`).
- **Hard Safety Compliance:** Strictly enforces **Rule 2 (No Silent Merging)**. System never links records autonomously.

### Feature 5: 2G Cellular SMS Fallback Dispatch (`PHCDashboard.tsx`)
- **Workflow:** For extreme zero-connectivity conditions (e.g. disaster zones, deep rural ghats), clinicians can click **"SMS Payload"** on any referral to generate a GSM 160-character formatted dispatch string using `formatFallbackSMS`:
  ```
  SETU*RF-8204*RAMESH YADAV*47M*PHC-KHED*AUNDH-DH*EMERGENCY*STEMI
  ```
- **Clinical Value:** Enables frontline workers to transmit critical triage notifications over basic 2G voice/SMS networks when cellular packet data is unavailable.

---

## 4. Feature Scoring Against Real-World Healthcare Standards

Each feature is evaluated against six clinical and technical healthcare benchmarks on a 1–10 scale:

### Detailed Scorecard Matrix

| Evaluated Feature | Clinical Safety (No Silent Guess/Merge) | Data Integrity & Idempotency | Offline Resilience & Latency | Auditability & Compliance | Usability & UI/UX Standards | Health Interoperability (ABDM/FHIR) | Composite Score |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1. Digital Referral Creator (`ReferralModal`)** | 9.5 / 10 | 9.0 / 10 | 9.5 / 10 | 9.5 / 10 | 9.5 / 10 | 6.5 / 10 | **8.9 / 10** |
| **2. Offline Sync Engine (`useNetworkSync` + `sync.routes`)** | 9.0 / 10 | 9.5 / 10 | 9.2 / 10 | 9.5 / 10 | 9.0 / 10 | 6.0 / 10 | **8.7 / 10** |
| **3. Fuzzy Identity Matcher (`identityMatcher.ts`)** | 9.0 / 10 | 9.0 / 10 | 9.0 / 10 | 9.0 / 10 | N/A | 7.0 / 10 | **8.6 / 10** |
| **4. Identity Reconciliation Modal (`IdentityReconciliationModal`)** | **10.0 / 10** | 9.5 / 10 | 8.5 / 10 | **10.0 / 10** | 9.8 / 10 | 6.5 / 10 | **9.1 / 10** |
| **5. District Hospital Triage Queue (`HospitalDashboard`)** | 9.2 / 10 | 9.0 / 10 | 8.5 / 10 | 9.5 / 10 | 9.2 / 10 | 6.5 / 10 | **8.7 / 10** |
| **6. Frontline 2G SMS Fallback Engine** | 9.0 / 10 | 8.5 / 10 | **10.0 / 10** | 8.0 / 10 | 9.0 / 10 | 5.5 / 10 | **8.3 / 10** |
| **Overall Platform Average** | **9.3 / 10** | **9.1 / 10** | **9.1 / 10** | **9.3 / 10** | **9.3 / 10** | **6.3 / 10** | **8.7 / 10** |

---

## 5. In-Depth Evaluation Against Healthcare System Criteria

### A. Clinical Safety & Decision Support: **9.3 / 10**
- **Strengths:** 
  - Zero "silent merging". The system never writes `patientId` canonical links automatically, eliminating catastrophic misidentification errors (e.g. administering penicillin to a patient with an allergy record belonging to an identically named villager).
  - Clear emergency triage visual hierarchy (`EMERGENCY` red pulse and badge alerts clinicians within 1 second of loading).
- **Minor Gap:** Clinical complaints currently rely on unconstrained text strings rather than standard coded terminologies (ICD-10 or SNOMED CT).

### B. Data Integrity & Idempotency: **9.1 / 10**
- **Strengths:**
  - Client-side event IDs (`EVT-...`) prevent replay duplicates during intermittent 2G connection reconnects.
  - Transactions wrap both record writes and audit events (`prisma.$transaction`), ensuring no orphaned records if a server fault occurs mid-sync.
- **Minor Gap:** When offline referrals are synced, if the destination hospital or source facility ID is invalid, errors are saved to `SyncEvent.lastError`, but the frontend doesn't yet display a dedicated "Resolve Conflict" modal.

### C. Offline Resilience & Low-Resource Operations: **9.1 / 10**
- **Strengths:**
  - Dexie.js IndexedDB schema stores full referral payloads locally.
  - Heartbeat check (15-second interval) automatically detects back-online transitions and flushes the queue.
  - 160-character cellular SMS fallback provides true zero-bandwidth redundancy.
- **Minor Gap:** Binary attachments (ECG photos, paper referral slips) are not yet base64-cached in Dexie when offline.

### D. Auditability & Regulatory Compliance (HIPAA / ABDM / ISO 27799): **9.3 / 10**
- **Strengths:**
  - All critical state mutations (`REFERRAL_CREATED`, `REFERRAL_SYNCED_FROM_OFFLINE`, `IDENTITY_CONFIRMED`, `IDENTITY_REJECTED_REGISTERED_NEW`) write an immutable row to `AuditEvent`.
  - Captures `actorId`, `actorRole`, `facilityId`, `entityType`, and JSON metadata including clinician verification notes.
- **Minor Gap:** Audit log is stored in PostgreSQL tables; future compliance with DISHA / ABDM will require cryptographic tamper-evident signing (hash chaining).

### E. Usability & UI/UX Clinical Theme Adherence: **9.3 / 10**
- **Strengths:**
  - 100% adherence to `UI_UX_DESIGN_SYSTEM.md` and the `healthcare-ui-theme` skill.
  - Palette strictly uses Clinical Teal (`bg-teal-600`), Slate neutrals (`bg-slate-50`, `border-slate-200`), and semantic tokens (Emerald for synced, Amber for pending review, Rose for emergency).
  - Zero vibe-coding, zero dark-mode gaming gradients, high contrast text for sunlit rural clinics.

### F. Healthcare Interoperability (ABDM / FHIR R4): **6.3 / 10**
- **Current State:** APIs use custom JSON models (`referralNumber`, `patient`, `clinicalSummary`, `urgency`).
- **Required Healthcare Enhancement:** Map SwasthyaSetu data models to standard HL7 FHIR R4 resources:
  - `Referral` $\rightarrow$ `FHIR R4 ServiceRequest` (`category: referral`, `priority: stat | urgent | routine`).
  - `Patient` $\rightarrow$ `FHIR R4 Patient` with ABDM `ABHA` (Ayushman Bharat Health Account) identifier extension.
  - `IdentityMatch` $\rightarrow$ `FHIR R4 Patient.link` (`type: seealso | replaces`).

---

## 6. Technical Gaps & Code Recommendations Before Merge

Before merging `origin/nikhil` into `main`, address three specific code adjustments:

### 1. Unified Dexie DB Export
In `main`, Dexie was exported as `db`, while in `nikhil` it was exported as `localDb`.
```typescript
// apps/web/src/lib/db.ts
export const localDb = new SwasthyaSetuDatabase();
export const db = localDb; // Ensure backward compatibility across codebase
```

### 2. Preserve Google OAuth Authentication
`main` contains the resolved Google OAuth login flow (`b12aa75`). `origin/nikhil` branched off prior to the Google Auth fix. A clean rebase or merge must keep the Google Client ID / callback configuration in `apps/api/src/modules/auth/auth.routes.ts` and `apps/web/src/context/AuthContext.tsx`.

### 3. RapidFuzz Service Coordination
`identityMatcher.ts` currently implements pure TypeScript Levenshtein string matching in the Node.js API. This is resilient because it does not depend on the Python microservice being alive. For high-volume multi-thousand record searches, configure the Node.js route to query `services/ai/app.py` (RapidFuzz) as primary, with `identityMatcher.ts` serving as the zero-dependency fallback.

---

## 7. Recommended Merge Command Execution

To safely merge Nikhil's changes into `main` without losing Google Auth or causing database drift:

```bash
# 1. Ensure working directory is clean on main
git checkout main
git pull origin main

# 2. Merge Nikhil's branch
git merge origin/nikhil -m "merge: integrate Nikhil's PHC referrals, offline sync, and identity reconciliation"

# 3. Generate and run Prisma migrations
cd apps/api
npx prisma generate
npx prisma migrate dev --name merge_referrals_and_identity

# 4. Verify TypeScript builds
cd ../..
npm run build
```
