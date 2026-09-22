# SwasthyaSetu — Complete Feature Inventory & Hackathon Roadmap

> **Official Problem Code:** MUSA CodeX \| CX0302 \| Healthcare & Digital Health  
> **Mission:** *"Healthcare continuity that survives weak connectivity."*  
> **Core Continuity Equation:**  
> $$\text{REFERRAL} + \text{IDENTITY} + \text{DOCUMENT} + \text{FOLLOW-UP} = \textbf{CONTINUITY GAP}$$

This document serves as the master tracking registry for all built, in-progress, and planned features across all four system roles. Use this file to monitor status and pick the next feature to implement sequentially.

---

## Master Feature Status Legend

| Symbol | Status | Description |
| :---: | :--- | :--- |
| 🟢 | `BUILT` | Fully implemented, connected to database, tested end-to-end. |
| 🟡 | `NEXT_UP` | Core priority feature required to complete the hackathon demo story. |
| ⚪ | `PLANNED` | Roadmap feature for district-wide scaling and advanced operations. |

---

## 1. Frontline Primary Health Centre (`PHC_USER`)

*Primary Users: PHC Medical Officers, Community Health Officers (CHOs), ASHA/ANM Workers.*

| Status | Feature Name | Description | Key Technical Specs & Endpoints |
| :---: | :--- | :--- | :--- |
| 🟢 | **PHC Clinical Dashboard** | Cockpit displaying referral metrics, emergency counter, offline queue counter, and live network health status. | `GET /api/referrals`<br>`GET /api/health` |
| 🟢 | **3-Tier Digital Referral Modal** | Structured referral creation with Routine, Urgent, and Emergency tiers, clinical summary, and 1-click **"Load Ramesh Yadav STEMI Demo"**. | `POST /api/referrals`<br>`GET /api/facilities` |
| 🟢 | **Dexie.js Offline Persistence Engine** | Client-side IndexedDB persistence guaranteeing doctors can register patients and dispatch referrals with zero internet. | `localDb.referrals`<br>`localDb.syncQueue` |
| 🟢 | **Idempotent Background Sync Engine** | 15-second heartbeat monitor automatically flushing queued referrals to cloud PostgreSQL upon reconnect using deterministic `eventId`. | `POST /api/sync/events`<br>`GET /api/health` |
| 🟢 | **2G Cellular SMS Fallback** | Encodes critical emergency transfer metadata into a $<160$ char GSM string (`SETU*RF-XXXXXX*...`) with 1-click clipboard copy for zero-data zones. | `@swastyasetu/shared`<br>`formatFallbackSMS` |
| 🟢 | **Dispatched Referrals Log** | Real-time table merging local IndexedDB records and cloud database with live sync pills (`QUEUED` amber vs `SYNCED` emerald). | Client-side Dexie merge with `GET /api/referrals` |
| 🟢 | **Facility & Practitioner Credentials** | Displays logged-in doctor profile, active role, and linked government facility (Primary Health Centre Khed). | `AuthContext`<br>`GET /api/auth/me` |
| 🟡 | **Closed-Loop Post-Discharge Follow-Up Tracker** | **(P0 — Loop Closer)** Notifies PHC when a referred patient is discharged from District Hospital. Displays discharge summary, medicines, and records visit completion. | `GET /api/follow-ups/facility/:id`<br>`POST /api/follow-ups/:id/complete` |
| 🟡 | **Rapid Vitals & Early Warning Triage (EWS)** | **(P1 — Frontline Intake)** Rapid 1-screen intake for BP, Pulse, $\text{SpO}_2$, Temperature, and Random Blood Sugar with automated red alerts (Systolic $>160$, $\text{SpO}_2 < 92\%$). | `POST /api/vitals`<br>`GET /api/patients/:id/vitals` |
| ⚪ | **Pre-Referral Emergency Stabilization Checklist** | Protocol checklist for pre-referral drug administration (STEMI loading dose, Eclampsia $\text{MgSO}_4$) generating a timestamped pre-hospital handoff log. | `POST /api/referrals/:id/stabilization` |

---

## 2. District Hospital Clinician & Specialist (`CLINICIAN`)

*Primary Users: Emergency Medical Officers, Casualty Clinicians, Chief Specialists, Ward In-Charges.*

| Status | Feature Name | Description | Key Technical Specs & Endpoints |
| :---: | :--- | :--- | :--- |
| 🟢 | **Hospital Intake Cockpit** | Central real-time dashboard displaying incoming emergency transfers, unverified candidate count, and hospital volume stats. | `GET /api/referrals`<br>`GET /api/identity/evaluate/:id` |
| 🟢 | **Emergency Triage Stream** | Live incoming stream prioritizing cases by urgency tier (`EMERGENCY` rose pulse, `URGENT` amber, `ROUTINE` slate). | `GET /api/referrals?urgency=EMERGENCY` |
| 🟢 | **Fuzzy Patient Identity Reconciliation** | Weighted multi-attribute candidate matcher (Name 35%, Phone 25%, Village 15%, Age 10%) detecting duplicate or existing registry records. | RapidFuzz / Levenshtein Engine<br>`GET /api/identity/evaluate/:id` |
| 🟢 | **Side-by-Side Clinician Confirmation Modal** | **Hard Rule 2 Enforced:** 50/50 split comparison screen displaying field match pills. Requires explicit clinician sign-off; never silently merges. | `POST /api/identity/confirm`<br>`POST /api/identity/reject` |
| 🟡 | **AI Clinical Document & Prescription OCR Scanner** | **(P0 — Failure Point B)** Uploads handwritten discharge summaries or prescription slips. Digitizes diagnosis and medicines with visual field confidence pills ($\ge 90\%$ emerald, $<90\%$ amber). | Vision OCR Microservice<br>`POST /api/documents/extract` |
| 🟡 | **Split-Screen Interactive Document Verifier** | **Hard Rule 1 Enforced:** Document scan on left, editable extracted fields on right. Doctor can correct uncertain dosages before committing to patient record. | `POST /api/documents/confirm-fields` |
| 🟡 | **Master Care Continuity Timeline (EHR)** | **(P1 — The Demo Climax)** Vertical chronological track displaying the complete multi-facility journey: *PHC Referral $\to$ Sync $\to$ Hospital Arrival $\to$ Identity Verified $\to$ Discharge $\to$ Follow-Up*. | `GET /api/patients/:id/timeline`<br>`AuditEvent` stream |
| ⚪ | **Structured Discharge Summary Generator** | Standardized discharge handoff generator capturing discharge vitals, take-home medicines, and auto-scheduling a follow-up alert at the patient's village PHC. | `POST /api/discharge-summaries` |

---

## 3. District Referral & Transfer Coordinator (`REFERRAL_COORDINATOR`)

*Primary Users: District Transfer Officers, 108 Ambulance Dispatchers, Bed Managers.*

| Status | Feature Name | Description | Key Technical Specs & Endpoints |
| :---: | :--- | :--- | :--- |
| 🟡 | **Inter-Facility Transfer Kanban Board** | **(P1 — Operational Clarity)** Real-time transfer board tracking ambulances: `Dispatched` $\to$ `In-Transit` $\to$ `Arrived` $\to$ `Admitted`. Emergency cases pinned with sirens. | `GET /api/referrals/transfers`<br>`PUT /api/referrals/:id/status` |
| 🟡 | **Hospital Bed & Capability Readiness Radar** | **(P1 — Resource Allocation)** Live capacity monitor showing ICU/CCU beds, oxygen beds, and on-duty specialists (Cath lab active, C-section ready) across district facilities. | `GET /api/facilities/capacity` |
| ⚪ | **108 Ambulance Digital Transport Slip** | 1-click printable or SMS handoff summary for ambulance drivers containing pickup GPS coordinates, patient vitals, and en-route stabilization notes. | `GET /api/referrals/:id/transport-slip` |
| ⚪ | **Cross-Facility Handoff Journey Tracker** | Institutional timeline tracking transfer durations, transit delays, and casualty intake lag. | `GET /api/coordination/metrics` |

---

## 4. District Health Officer & Compliance Admin (`ADMIN`)

*Primary Users: District Health Officers (DHO), Civil Surgeons, System Compliance Auditors.*

| Status | Feature Name | Description | Key Technical Specs & Endpoints |
| :---: | :--- | :--- | :--- |
| 🟢 | **Administrative Governance Dashboard** | District-wide operations overview monitoring referral traffic, active health centres, and system compliance health. | `GET /api/facilities`<br>`GET /api/test/admin-only` |
| 🟢 | **Role-Based Access Control (RBAC)** | Strict cryptographic credentialing enforcing role isolation (`PHC_USER`, `CLINICIAN`, `COORDINATOR`, `ADMIN`) with HTTP 403 blocks on unauthorized endpoints. | `requireAuth`<br>`requireRole` middleware |
| 🟢 | **Resilient Connection Pool Gateway** | Hardened Supabase PgBouncer pooler (20 connections, 30s timeout, global singleton) eliminating transaction aborts. | `apps/api/src/db.ts` |
| 🟡 | **Immutable Clinical Audit Trail Explorer** | **(P1 — Hard Rule 4)** Searchable, tamper-evident ledger of every system event (`REFERRAL_CREATED`, `IDENTITY_CONFIRMED`, `SYNC_EVENT`) with `actorId`, `facilityId`, and timestamps. | `GET /api/audit/events` |
| ⚪ | **Sync Gateway Diagnostics & Outbreak Radar** | Network diagnostics monitoring packet loss, offline queue volumes across rural PHCs, and syndromic cluster detection (e.g. fever or Dengue spikes by village). | `GET /api/analytics/referral-trends` |

---

## The 10-Step Winning Hackathon Demo Story

Use this sequence during the final judging demo to showcase end-to-end system completion:

| Step | Persona | Action / System Event | Status |
| :---: | :---: | :--- | :---: |
| **1** | PHC Doctor | Opens `/phc` and clicks **"Load Ramesh Yadav Demo"** (Acute STEMI emergency referral). | 🟢 **BUILT** |
| **2** | System | Turn off Wi-Fi or toggle Demo Offline Mode $\to$ Referral saved in **Dexie.js IndexedDB** with `QUEUED` badge. | 🟢 **BUILT** |
| **3** | Frontline Worker | Frontline data connection down $\to$ Generates **2G SMS Fallback** string ($<160$ chars GSM) with 1-click copy. | 🟢 **BUILT** |
| **4** | System | Reconnect Wi-Fi $\to$ 15s Heartbeat auto-syncs queued referral to PostgreSQL idempotently with zero duplicates. | 🟢 **BUILT** |
| **5** | Hospital Clinician | Doctor logs into `/hospital` $\to$ Referral appears immediately in **Hospital Triage Queue** with red alert. | 🟢 **BUILT** |
| **6** | Hospital Clinician | **Fuzzy Identity Engine** flags 94% similarity with registry record `Ramesh Kumar` $\to$ Doctor reviews side-by-side and explicitly confirms identity (**Rule 2**). | 🟢 **BUILT** |
| **7** | Hospital Specialist | Uploads handwritten discharge summary $\to$ **AI Vision OCR** extracts diagnosis and medicines with confidence pills (**Rule 1**). | 🟡 **NEXT** |
| **8** | Hospital Specialist | Doctor uses **Split-Screen Reviewer** to inspect original scan and verify uncertain dosage ($61\%$ confidence). | 🟡 **NEXT** |
| **9** | Clinician / Patient | Opens **Master Care Continuity Timeline** displaying the full vertical track from village PHC to hospital discharge. | 🟡 **NEXT** |
| **10** | Frontline CHO | Patient returns home $\to$ Local PHC receives return alert $\to$ CHO completes follow-up visit $\to$ **LOOP CLOSED!** | 🟡 **NEXT** |

---

## Hard Clinical Safety Rules (Non-Negotiable Directives)

1. **Rule 1 (No Silent Guessing):** If an AI extraction or abbreviation confidence is $<90\%$, it must be rendered in amber with status `NEEDS_REVIEW`. Never save low-confidence guesses as clinical fact.
2. **Rule 2 (No Silent Merging):** Even a $99\%$ fuzzy match candidate requires explicit clinician confirmation (`IDENTITY_CONFIRMED`). Never merge patient records automatically.
3. **Rule 3 (No Clinical Decisions):** The system extracts, normalizes, and tracks clinical data; it never diagnoses or prescribes treatments.
4. **Rule 4 (Auditability):** Every clinical state change generates an append-only, immutable `AuditEvent` with `actorId`, `facilityId`, `eventType`, and `timestamp`.
5. **Rule 5 (Idempotent Sync):** All offline sync events must use client-generated `eventId`s to guarantee zero duplicate patients or referrals upon reconnection.
