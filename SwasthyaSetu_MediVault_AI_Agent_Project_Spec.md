---
date: 2026-09-21
subtitle: MUSA CodeX \| Team TECHX \| CX0302 \| Healthcare / Digital
  Health
title: SwasthyaSetu / MediVault --- AI Agent Project Specification
---

# 1. DOCUMENT PURPOSE

This document is the **single project-context and implementation
specification** for AI coding agents and multiple developers working on
the SwasthyaSetu / MediVault hackathon project.

An AI agent reading this file should be able to understand:

-   what the product is;
-   the exact problem being solved;
-   who uses it;
-   the end-to-end workflow;
-   the MVP scope;
-   the architecture;
-   the data model;
-   the frontend/backend/AI responsibilities;
-   offline and synchronization behavior;
-   identity reconciliation;
-   document OCR and confidence handling;
-   human verification and safety rules;
-   APIs and module boundaries;
-   development workstreams;
-   integration contracts;
-   demo requirements;
-   testing and acceptance criteria;
-   what **must not** be built during the hackathon.

## Source of truth

The primary source for the product concept is the official MUSA CodeX
presentation/template and project material supplied by the team.

The official material defines SwasthyaSetu as:

> **"Healthcare continuity that survives weak connectivity."**

The system is an **offline-first continuity layer connecting referral,
identity, discharge information and follow-up**.

Project:

-   **Name:** SwasthyaSetu
-   **Working/product name:** MediVault may be used in implementation
    where existing code already uses that name.
-   **Hackathon:** MUSA CodeX
-   **Problem code:** CX0302
-   **Domain:** Healthcare / Digital Health
-   **Team:** TECHX
-   **Team members:** Aniket Vishwakarma, Nikhil Thange, Vedant Yadav,
    Asawari Chinchole

------------------------------------------------------------------------

# 2. EXECUTIVE SUMMARY

SwasthyaSetu addresses a continuity-of-care failure that occurs when a
patient moves between healthcare facilities.

The core journey is:

``` text
PHC
  ↓
Create Digital Referral
  ↓
Local Validation
  ↓
Local Storage / Offline Queue
  ↓
Connectivity Check
  ├── Internet available → Sync Engine → REST API
  └── Internet unavailable → SMS Fallback
                              ↓
                    District Hospital
                              ↓
                     Referral Received
                              ↓
                       Identity Match
                              ↓
                    Clinician Confirmation
                              ↓
                         Consultation
                              ↓
                      Discharge Document
                              ↓
                    Image Preprocessing
                              ↓
                            OCR
                              ↓
                     Entity Extraction
                              ↓
                         Normalize
                              ↓
                   Field-Level Confidence
                              ↓
                      Clinician Review
                              ↓
                  Structured Care Record
                              ↓
                       Next Provider
                              ↓
                       Follow-up Due
                              ↓
                        LOOP CLOSED
```

The key engineering idea is **not simply "AI for healthcare."**

The differentiating system behavior is the combination of:

1.  **Offline-first referral handling**
2.  **SMS fallback for critical referral metadata**
3.  **Fuzzy patient identity reconciliation**
4.  **Uncertainty-aware clinical document processing**
5.  **Human verification at ambiguous points**
6.  **Auditable event-based continuity tracking**
7.  **Closed-loop follow-up**

The product should treat failure modes as first-class design inputs.

------------------------------------------------------------------------

# 3. PROBLEM STATEMENT

## 3.1 Failure Point A --- The Referral That Never Arrives

Paper referrals can:

-   be lost;
-   be damaged;
-   become separated from the patient;
-   fail to reach the receiving hospital before the patient;
-   provide no reliable referral-status visibility;
-   contain patient information recorded differently at different
    facilities.

Conventional digital workflows may also depend on continuous network
connectivity.

The result is a broken information handoff.

## 3.2 Failure Point B --- The Discharge Summary Nobody Can Read

Clinical documents can be difficult to interpret because of:

-   handwriting;
-   poor scans;
-   hospital-specific abbreviations;
-   ambiguous medicine names;
-   ambiguous dosage/frequency;
-   missing previous clinical context.

The receiving clinician may therefore lack usable structured
information.

## 3.3 Core Problem

The project frames the problem as:

``` text
REFERRAL
   +
IDENTITY
   +
DOCUMENT
   +
FOLLOW-UP
   =
CONTINUITY GAP
```

SwasthyaSetu provides the missing continuity layer.

------------------------------------------------------------------------

# 4. TARGET USERS

## Primary users

### PHC doctors / health workers

Use the system to:

-   create referrals;
-   store referrals locally;
-   continue working during connectivity loss;
-   synchronize queued referrals;
-   track referral status.

### District hospital clinicians

Use the system to:

-   receive referrals;
-   identify/reconcile incoming patients;
-   verify identity matches;
-   view referral context;
-   review structured clinical documents;
-   confirm uncertain AI-extracted fields.

### Receiving doctors / private clinics

Use the system to:

-   consume the structured care context;
-   understand previous clinical events;
-   continue treatment;
-   access the patient's continuity timeline.

### Patients and caregivers

They are beneficiaries of the continuity workflow and may participate in
referral/follow-up workflows.

## Secondary users

-   Referral coordinators
-   Hospital administrators
-   Healthcare program administrators

------------------------------------------------------------------------

# 5. PRODUCT PRINCIPLES

These are hard product principles.

## 5.1 No silent guessing

If the system is uncertain, expose the uncertainty.

Bad:

``` text
AI guessed a medicine → system silently saves it as fact
```

Good:

``` text
AI extracted medicine
Confidence: 61%
Status: Needs clinician verification
Original document: available
```

## 5.2 No silent merging

An identity algorithm must never silently merge two patient records.

Bad:

``` text
94% match → automatically merge
```

Good:

``` text
94% candidate match
→ show matching fields
→ clinician confirms
→ create explicit identity-link event
```

## 5.3 No unverified clinical inference

The AI can extract/structure information from a document.

It must not independently make clinical decisions.

Clinical decisions remain with clinicians.

## 5.4 Minimum necessary data

SMS fallback should contain only the minimum metadata required to
support the handoff.

Do not put complete medical records into SMS.

## 5.5 Auditability

Important transitions must be traceable with:

-   event ID;
-   timestamp;
-   actor;
-   facility;
-   event type;
-   source;
-   sync status.

## 5.6 Offline is a design requirement

Offline behavior is not an error state.

The application should deliberately support:

``` text
ONLINE
OFFLINE
SYNCING
SYNCED
SYNC_FAILED
```

------------------------------------------------------------------------

# 6. MVP SCOPE

The MVP must deliver one polished end-to-end vertical slice.

## Mandatory MVP

### A. PHC referral creation

-   Patient information form
-   Referral information
-   Urgency
-   Receiving facility
-   Clinical summary
-   Local validation
-   Referral ID generation

### B. Offline-first persistence

-   Detect network availability
-   Save referral locally
-   Add referral to sync queue
-   Show pending state
-   Retry when connection returns

### C. Sync engine

-   Upload queued referrals
-   Idempotent synchronization
-   Retry failed events
-   Update local sync state
-   Avoid duplicate referral creation

### D. SMS fallback

For demo/MVP:

-   Generate minimum referral metadata payload
-   Show SMS fallback state
-   Support a real SMS provider only if credentials/integration are
    available
-   Otherwise clearly label the behavior as **Demo/Simulation Mode**

### E. Hospital dashboard

-   Incoming referrals
-   Referral status
-   Patient summary
-   Referral details
-   Identity matching screen

### F. Fuzzy identity reconciliation

Compare candidate records using fields such as:

-   name;
-   age;
-   gender;
-   village/location;
-   phone;
-   referral context.

Return:

-   candidate;
-   similarity score;
-   field-level match evidence;
-   status.

Never silently merge.

### G. Human identity confirmation

Clinician sees:

``` text
Incoming patient
vs
Candidate patient
```

with matching/non-matching fields.

Actions:

-   Confirm match
-   Reject
-   Search another patient
-   Create/link as new patient where appropriate

### H. Clinical document intelligence

Pipeline:

``` text
Document Image
   ↓
Preprocessing
   ↓
OCR
   ↓
Entity Extraction
   ↓
Normalization
   ↓
Field Confidence
   ↓
Clinician Review
   ↓
Structured Care Record
```

### I. Field-level confidence

Every extracted clinical field should have a confidence or review state.

Example:

``` json
{
  "field": "dosage",
  "value": "500 mg",
  "confidence": 0.61,
  "status": "needs_review"
}
```

### J. Clinician review

Clinician can:

-   accept;
-   edit;
-   reject;
-   mark uncertain.

The original document remains accessible.

### K. Continuity timeline

Display:

``` text
Referral created
      ↓
Queued offline
      ↓
Synced
      ↓
Hospital received
      ↓
Identity verified
      ↓
Consultation
      ↓
Discharge document processed
      ↓
Clinical fields verified
      ↓
Next provider
      ↓
Follow-up due
      ↓
Follow-up completed
```

### L. Audit trail

Show important events with timestamps and IDs.

------------------------------------------------------------------------

# 7. OUT OF SCOPE FOR THE HACKATHON MVP

Do not allow agents/developers to expand scope casually.

The following should not be built unless explicitly approved:

-   Full EMR replacement
-   Full hospital management system
-   Pharmacy marketplace
-   Insurance claims system
-   Ambulance dispatch
-   Large-scale analytics platform
-   Blockchain for medical documents
-   Complex RAG platform
-   Multi-agent clinical system
-   Vector database unless required by an actual implemented feature
-   Full patient mobile application
-   Large-scale multilingual support
-   Production-grade ABDM integration
-   Production-grade FHIR interoperability
-   Real clinical decision support
-   Automated diagnosis
-   Automated prescription generation
-   Automatic patient merging
-   Unsupported medical claims
-   Fabricated impact statistics

The hackathon objective is a **credible, working vertical slice**, not a
huge incomplete platform.

------------------------------------------------------------------------

# 8. DEMO STORY

Use one patient journey throughout the demo.

Illustrative patient:

``` text
Patient: Ramesh Yadav
Age: 47
Gender: Male
Village: Khed
Referral: PHC → District Hospital
Urgency: High
```

The exact demo patient can be changed.

## Demo sequence

### Step 1 --- PHC

Doctor opens PHC dashboard.

Creates referral.

System generates:

``` text
Referral ID: RF-1024
```

### Step 2 --- Internet failure

Turn off network / enable demo offline mode.

System shows:

``` text
OFFLINE MODE
Referral saved locally.
Sync status: QUEUED
```

### Step 3 --- SMS fallback

Show:

``` text
Data connection unavailable.
Critical referral metadata prepared for SMS fallback.
```

If no SMS provider is configured:

``` text
DEMO SMS — NOT ACTUALLY SENT
```

### Step 4 --- Connectivity restored

System reconnects.

Sync manager processes:

``` text
QUEUED → SYNCING → SYNCED
```

### Step 5 --- District hospital

Hospital dashboard receives referral.

### Step 6 --- Identity reconciliation

Incoming patient is compared with existing records.

Example:

``` text
Candidate: Ramesh Kumar
Match score: 94%
```

The score is illustrative and must be calculated by the actual
implementation in production code.

Show evidence:

``` text
Name       : strong match
Age        : match
Gender     : match
Village    : strong match
Phone      : partial match
```

Clinician explicitly confirms.

### Step 7 --- Document processing

Upload a discharge/prescription image.

Show:

``` text
OCR
 ↓
Clinical extraction
 ↓
Normalization
 ↓
Confidence
```

Example UI:

  Field       Extracted value       Confidence Status
  ----------- ------------------- ------------ --------------
  Diagnosis   Example diagnosis            94% Verified
  Medicine    Example medicine             91% Verified
  Dosage      Example dosage               61% Needs review
  Frequency   Example frequency            78% Needs review

These values are demo placeholders only.

### Step 8 --- Clinician review

Doctor opens the original image and verifies uncertain fields.

### Step 9 --- Timeline

Show the complete patient continuity timeline.

### Step 10 --- Follow-up

Create a follow-up event.

End the demo with the concept:

> The patient's information followed the patient --- even when the
> internet didn't.

------------------------------------------------------------------------

# 9. SYSTEM ARCHITECTURE

## High-level architecture

``` text
                         SWASTHYASETU
                              |
              +---------------+---------------+
              |                               |
         PHC PWA                         Hospital Web
              |                               |
              +---------------+---------------+
                              |
                         REST API
                              |
              +---------------+---------------+
              |                               |
         PostgreSQL                      AI Service
              |                               |
     +--------+--------+             +-------+-------+
     |        |        |             |       |       |
 Patients Referrals Audit          OCR   NLP/NER Confidence
```

## Offline layer

``` text
Browser / PWA
     |
 IndexedDB
     |
 Local Queue
     |
 Sync Manager
     |
 REST API
```

## Communication fallback

``` text
PHC Client
   |
Connectivity Check
   |
   +---- Online ----> REST API
   |
   +---- Offline ---> SMS Formatter ---> SMS Gateway
```

## Clinical document pipeline

``` text
Image
  ↓
Preprocessing
  ↓
OCR
  ↓
Text
  ↓
Entity Extraction
  ↓
Normalization
  ↓
Confidence
  ↓
Clinician Review
  ↓
Structured Record
```

------------------------------------------------------------------------

# 10. RECOMMENDED TECHNOLOGY STACK

The official project material proposes the following architecture.
Implementation may evolve during prototyping as long as module contracts
remain stable.

  Layer             Technology                         Purpose
  ----------------- ---------------------------------- ----------------------------
  Frontend          React / PWA                        Offline-capable UI
  Backend           Node.js + Express and/or FastAPI   API + business logic
  Database          PostgreSQL                         Structured healthcare data
  Offline storage   IndexedDB / SQLite                 Local persistence + queue
  Identity          RapidFuzz + weighted scoring       Record reconciliation
  OCR               OCR engine / API                   Document extraction
  NLP               Python structured extraction       Clinical field extraction
  Communication     SMS API                            Low-connectivity fallback
  Auth              JWT + RBAC                         Access control

Existing project infrastructure may also contain:

-   Next.js / React;
-   TypeScript;
-   Python/FastAPI;
-   PostgreSQL;
-   Supabase;
-   MinIO for local S3-compatible storage;
-   Hugging Face TrOCR;
-   Gemini;
-   NVIDIA NIM / Llama vision models.

Agents must inspect the existing repository before replacing any working
component.

------------------------------------------------------------------------

# 11. REPOSITORY RULES FOR MULTIPLE DEVELOPERS

Before changing code, every developer/AI agent must:

1.  Inspect the existing repository.
2.  Identify current frontend/backend/AI services.
3.  Reuse existing working infrastructure.
4.  Avoid rewriting modules unnecessarily.
5.  Preserve existing environment variable names unless migration is
    intentional.
6.  Document new environment variables.
7.  Keep commits focused.
8.  Avoid modifying another developer's module without coordination.
9.  Do not introduce large dependencies without justification.
10. Never commit secrets.

## Suggested monorepo structure

If the existing repository does not already impose a structure:

``` text
medivault/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── features/
│   │   │   │   ├── referrals/
│   │   │   │   ├── patients/
│   │   │   │   ├── identity/
│   │   │   │   ├── documents/
│   │   │   │   ├── timeline/
│   │   │   │   ├── followups/
│   │   │   │   └── audit/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   ├── hooks/
│   │   │   └── routes/
│   │   └── public/
│   │
│   └── api/
│       └── src/
│           ├── modules/
│           │   ├── auth/
│           │   ├── patients/
│           │   ├── referrals/
│           │   ├── identity/
│           │   ├── documents/
│           │   ├── followups/
│           │   ├── audit/
│           │   └── sync/
│           ├── middleware/
│           ├── db/
│           └── utils/
│
├── services/
│   └── ai/
│       ├── ocr/
│       ├── extraction/
│       ├── normalization/
│       ├── confidence/
│       └── identity/
│
├── packages/
│   ├── types/
│   ├── validation/
│   └── shared/
│
├── docs/
│
├── scripts/
│
├── .env.example
└── README.md
```

If the repository already has a structure, **do not restructure solely
to match this example**.

------------------------------------------------------------------------

# 12. DOMAIN MODEL

## 12.1 Patient

``` text
Patient
- id
- local_id
- name
- age / date_of_birth
- gender
- phone
- village
- address/location
- created_at
- updated_at
```

## 12.2 Referral

``` text
Referral
- id
- referral_number
- patient_id
- source_facility_id
- destination_facility_id
- urgency
- reason
- clinical_summary
- status
- created_by
- created_at
- updated_at
```

## 12.3 Sync Event

``` text
SyncEvent
- id
- event_id
- entity_type
- entity_id
- operation
- payload
- status
- retry_count
- created_at
- synced_at
- last_error
```

Possible statuses:

``` text
PENDING
SYNCING
SYNCED
FAILED
CONFLICT
```

## 12.4 Identity Match

``` text
IdentityMatch
- id
- referral_id
- incoming_patient_id
- candidate_patient_id
- score
- field_scores
- status
- reviewed_by
- reviewed_at
```

Statuses:

``` text
PENDING_REVIEW
CONFIRMED
REJECTED
```

## 12.5 Clinical Document

``` text
ClinicalDocument
- id
- patient_id
- referral_id
- document_type
- original_file_url
- OCR_text
- processing_status
- created_at
```

## 12.6 Extracted Clinical Field

``` text
ClinicalField
- id
- document_id
- field_name
- extracted_value
- normalized_value
- confidence
- review_status
- reviewed_value
- reviewed_by
- reviewed_at
```

Possible statuses:

``` text
AUTO_ACCEPTED
NEEDS_REVIEW
VERIFIED
REJECTED
```

## 12.7 Follow-up

``` text
FollowUp
- id
- patient_id
- care_episode_id
- due_at
- purpose
- assigned_provider
- status
- completed_at
- notes
```

## 12.8 Audit Event

``` text
AuditEvent
- id
- event_id
- actor_id
- actor_role
- facility_id
- event_type
- entity_type
- entity_id
- metadata
- timestamp
```

------------------------------------------------------------------------

# 13. REFERRAL STATE MACHINE

Use explicit states.

``` text
DRAFT
  ↓
VALIDATED
  ↓
QUEUED
  ↓
SYNCING
  ↓
SENT
  ↓
RECEIVED
  ↓
IDENTITY_PENDING
  ↓
IDENTITY_CONFIRMED
  ↓
CONSULTED
  ↓
DISCHARGE_PROCESSING
  ↓
DOCUMENT_REVIEW
  ↓
CARE_RECORD_UPDATED
  ↓
FOLLOW_UP_DUE
  ↓
FOLLOW_UP_COMPLETED
```

Failure states:

``` text
SYNC_FAILED
IDENTITY_REVIEW_REQUIRED
DOCUMENT_REVIEW_REQUIRED
CONFLICT
```

Do not collapse all failures into a generic error.

------------------------------------------------------------------------

# 14. OFFLINE-FIRST DESIGN

## Requirements

The PHC application must remain usable when the network is unavailable.

### On referral submission

``` text
1. Validate locally.
2. Generate client-side referral/event ID.
3. Persist referral locally.
4. Persist sync event locally.
5. Mark referral QUEUED.
6. Show user that data is safely stored locally.
```

### When network returns

``` text
1. Detect connectivity.
2. Read pending queue.
3. Process events in deterministic order.
4. Send event to server.
5. Server performs idempotency check.
6. Mark event SYNCED.
7. Update local referral status.
8. Continue with next event.
```

## Idempotency

Every sync event must have a unique event ID.

Example:

``` text
event_id = EVT-01J...
```

Server must reject/replay safely when the same event is received twice.

Never create duplicate referrals because a sync request was retried.

------------------------------------------------------------------------

# 15. SMS FALLBACK

SMS is a **fallback communication path**, not a replacement for full
clinical data synchronization.

## Minimum payload

Example conceptual payload:

``` text
SWASTHYASETU
REF: RF-1024
PATIENT: RAMESH YADAV
AGE: 47
SEX: M
FROM: PHC-KHED
TO: DIST-HOSP
URGENCY: HIGH
STATUS: REFERRAL_CREATED
```

Do not include:

-   full clinical notes;
-   complete discharge summaries;
-   unnecessary identifiers;
-   large documents;
-   sensitive medical details that are not required for the fallback.

## Demo implementation

If an actual SMS provider is not configured:

``` text
SMS_PROVIDER_MODE=demo
```

The UI should explicitly display:

``` text
DEMO SMS — NOT ACTUALLY SENT
```

Do not claim that an SMS was sent if the system only simulated it.

------------------------------------------------------------------------

# 16. FUZZY IDENTITY RECONCILIATION

The goal is to find likely existing patient records when the incoming
record has variations.

Possible input fields:

``` text
name
age
gender
village
phone
local ID
referral context
```

## Weighted scoring concept

Example:

``` text
Name        35%
Phone       25%
Village     15%
Age         10%
Gender       5%
Context     10%
```

These weights are **implementation defaults**, not clinically validated
values. They may be tuned during the prototype.

Total:

``` text
score =
  name_score * W_NAME
+ phone_score * W_PHONE
+ village_score * W_VILLAGE
+ age_score * W_AGE
+ gender_score * W_GENDER
+ context_score * W_CONTEXT
```

## Important safety behavior

Never do:

``` text
score > threshold → automatic merge
```

Instead:

``` text
score high
   ↓
show candidate
   ↓
show field evidence
   ↓
clinician confirmation
   ↓
explicit identity-link event
```

## UI

Display:

``` text
Incoming Patient             Candidate

Ramesh Yadav                 Ramesh Kumar
47                            47
Male                          Male
Khed                          Khed
98xxxxxx12                    98xxxxxx19

Overall similarity: 94%

[Confirm Match] [Reject] [Search Another]
```

The UI must make it clear that similarity is not proof of identity.

------------------------------------------------------------------------

# 17. DOCUMENT INTELLIGENCE

## Pipeline

``` text
UPLOAD
  ↓
VALIDATE FILE
  ↓
IMAGE PREPROCESSING
  ↓
OCR
  ↓
RAW TEXT
  ↓
ENTITY EXTRACTION
  ↓
NORMALIZATION
  ↓
FIELD CONFIDENCE
  ↓
HUMAN REVIEW
  ↓
STRUCTURED CARE RECORD
```

## OCR

The project material permits an OCR engine/API.

Existing project infrastructure may include a medical-prescription OCR
model based on TrOCR.

Agents should inspect existing OCR implementation before introducing a
new model.

## Entity extraction

Potential fields:

``` text
patient name
diagnosis
symptoms
medication
dosage
frequency
duration
investigation
test result
doctor
facility
follow-up date
clinical instructions
```

The exact field set should remain modular.

## Normalization

Examples:

``` text
"BD" → "twice daily"
"OD" → "once daily"
```

However, abbreviations must be handled conservatively.

If normalization is ambiguous:

``` text
status = NEEDS_REVIEW
```

Do not invent a clinical interpretation.

------------------------------------------------------------------------

# 18. CONFIDENCE ENGINE

Confidence must be visible at the field level.

Example:

``` json
{
  "field": "medicine",
  "raw_text": "Paracitamol",
  "normalized_value": "Paracetamol",
  "confidence": 0.91,
  "status": "needs_review"
}
```

Suggested conceptual thresholds:

``` text
>= 0.90  → high confidence
0.70-0.89 → review depending on field
< 0.70  → needs review
```

These are engineering defaults only and must not be represented as
clinically validated thresholds.

## Critical rule

A confidence score is not clinical certainty.

The UI should use language such as:

``` text
AI extraction confidence
```

not:

``` text
Medical certainty
```

------------------------------------------------------------------------

# 19. HUMAN-IN-THE-LOOP REVIEW

## Identity

Required when identity is ambiguous.

## Clinical documents

Required when:

-   OCR is uncertain;
-   field confidence is low;
-   abbreviation is ambiguous;
-   dosage/frequency is uncertain;
-   extracted text conflicts with document context.

## Review UI

Example:

``` text
AI EXTRACTED

Medicine:
Paracetamol

Dosage:
500 mg

Frequency:
BID

Confidence:
61% dosage
78% frequency

Original document:
[IMAGE]

Doctor decision:
[Accept] [Edit] [Reject]
```

Every manual change should create an audit event.

------------------------------------------------------------------------

# 20. AUDITABILITY

Every meaningful state transition should generate an event.

Examples:

``` text
REFERRAL_CREATED
REFERRAL_QUEUED
REFERRAL_SYNC_STARTED
REFERRAL_SYNCED
REFERRAL_RECEIVED
IDENTITY_MATCH_SUGGESTED
IDENTITY_CONFIRMED
IDENTITY_REJECTED
DOCUMENT_UPLOADED
OCR_COMPLETED
CLINICAL_FIELDS_EXTRACTED
FIELD_REVIEWED
CARE_RECORD_UPDATED
FOLLOWUP_CREATED
FOLLOWUP_COMPLETED
```

Event structure:

``` json
{
  "eventId": "EVT-1024",
  "eventType": "IDENTITY_CONFIRMED",
  "entityType": "REFERRAL",
  "entityId": "RF-1024",
  "actorId": "DOC-01",
  "actorRole": "CLINICIAN",
  "timestamp": "ISO-8601",
  "metadata": {}
}
```

------------------------------------------------------------------------

# 21. API CONTRACT

These endpoints are the minimal conceptual API surface.

## Referrals

``` http
POST /api/referrals
GET /api/referrals
GET /api/referrals/:id
PATCH /api/referrals/:id/status
```

## Patients

``` http
POST /api/patients
GET /api/patients/:id
GET /api/patients/search
```

## Identity

``` http
POST /api/identity/match
POST /api/identity/:matchId/confirm
POST /api/identity/:matchId/reject
```

## Documents

``` http
POST /api/documents
GET /api/documents/:id
POST /api/documents/:id/process
GET /api/documents/:id/fields
PATCH /api/documents/:id/fields/:fieldId
```

## Timeline

``` http
GET /api/patients/:patientId/timeline
```

## Follow-up

``` http
POST /api/followups
GET /api/followups
PATCH /api/followups/:id
```

## Sync

``` http
POST /api/sync/events
GET /api/sync/status
```

## Audit

``` http
GET /api/audit/:entityType/:entityId
```

Exact route naming can be adapted to the existing backend.

------------------------------------------------------------------------

# 22. API RESPONSE CONVENTION

Prefer consistent responses.

Success:

``` json
{
  "success": true,
  "data": {},
  "message": "Referral created"
}
```

Error:

``` json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Destination facility is required",
    "details": {}
  }
}
```

Do not expose internal stack traces to clients.

------------------------------------------------------------------------

# 23. FRONTEND APPLICATION AREAS

## PHC Dashboard

Must show:

-   connectivity state;
-   pending sync count;
-   referral creation;
-   recent referrals;
-   referral status.

## Referral Form

Sections:

``` text
Patient
Referral
Clinical Summary
Destination
Urgency
Attachments
```

## Offline Indicator

Always visible.

Example:

``` text
● ONLINE
```

or

``` text
● OFFLINE
3 referrals pending sync
```

## Hospital Dashboard

Show:

-   incoming referrals;
-   urgency;
-   patient;
-   source facility;
-   received/sync state;
-   identity review status.

## Identity Review

Show side-by-side comparison.

## Document Review

Show:

-   original image;
-   OCR text;
-   extracted fields;
-   confidence;
-   review controls.

## Patient Timeline

Use a chronological event/timeline UI.

------------------------------------------------------------------------

# 24. AUTHENTICATION AND RBAC

The official architecture proposes JWT + RBAC.

Minimum roles:

``` text
PHC_USER
CLINICIAN
REFERRAL_COORDINATOR
ADMIN
```

Permissions should be explicit.

Example:

  Action                            PHC   Clinician   Coordinator   Admin
  ------------------------ ------------ ----------- ------------- -------
  Create referral                   Yes         Yes           Yes     Yes
  View PHC referrals                Yes         Yes           Yes     Yes
  Confirm identity           No/limited         Yes           Yes     Yes
  Verify clinical fields             No         Yes    No/limited     Yes
  Manage users                       No          No            No     Yes
  View audit                    Limited    Relevant      Relevant     Yes

The exact permission matrix can be adjusted during implementation.

------------------------------------------------------------------------

# 25. SECURITY REQUIREMENTS

For the hackathon prototype:

-   Never hardcode secrets.
-   Use `.env`.
-   Provide `.env.example`.
-   Validate input.
-   Validate uploaded file type and size.
-   Protect authenticated endpoints.
-   Enforce role checks.
-   Do not log sensitive medical content unnecessarily.
-   Use minimum necessary SMS payload.
-   Do not expose private storage URLs unnecessarily.
-   Record audit events for sensitive actions.
-   Avoid storing credentials in the repository.

For production, additional security/privacy/legal review would be
required.

------------------------------------------------------------------------

# 26. FILE STORAGE

If object storage is required:

``` text
documents/
  {patientId}/
    {documentId}/
      original.ext
```

The database stores metadata and references.

The original document must remain available for clinician review.

If existing project infrastructure uses MinIO/S3-compatible storage,
reuse it.

------------------------------------------------------------------------

# 27. AI SERVICE CONTRACT

The AI layer should be isolated from the main application.

Conceptual service:

``` http
POST /ai/ocr
POST /ai/extract
POST /ai/normalize
POST /ai/identity-score
```

Example extraction response:

``` json
{
  "documentId": "DOC-1024",
  "fields": [
    {
      "name": "diagnosis",
      "rawValue": "....",
      "normalizedValue": "....",
      "confidence": 0.94,
      "status": "high_confidence"
    },
    {
      "name": "dosage",
      "rawValue": "....",
      "normalizedValue": null,
      "confidence": 0.61,
      "status": "needs_review"
    }
  ]
}
```

The backend should not blindly trust an AI response.

Validate the schema.

------------------------------------------------------------------------

# 28. AI PROMPTING RULES

When an LLM is used for extraction:

1.  Ask for structured JSON.
2.  Define the exact allowed schema.
3.  Instruct the model not to invent missing values.
4.  Return `null` when a field cannot be determined.
5.  Return uncertainty explicitly.
6.  Preserve raw text where useful.
7.  Separate extraction from normalization.
8.  Do not ask the model to diagnose the patient.
9.  Do not ask the model to make treatment decisions.

Example conceptual instruction:

``` text
Extract only information explicitly present in the supplied clinical document.

Do not infer missing clinical facts.
Do not diagnose.
Do not recommend treatment.

For every field return:
- raw_value
- normalized_value if safely supported
- confidence
- review_required

If uncertain, return null or mark review_required=true.
```

------------------------------------------------------------------------

# 29. FRONTEND/BACKEND CONTRACTS

The frontend and backend teams must agree on shared types.

Recommended shared types:

``` text
Patient
Referral
ReferralStatus
SyncEvent
IdentityMatch
ClinicalDocument
ClinicalField
FollowUp
AuditEvent
User
Facility
```

If TypeScript is used, place shared interfaces in a shared package where
practical.

Do not duplicate slightly different versions of the same object across
applications.

------------------------------------------------------------------------

# 30. DEVELOPMENT WORKSTREAMS

The project can be developed in parallel.

## Developer 1 --- Frontend / PHC

Own:

-   PHC dashboard
-   referral form
-   offline UI
-   referral list
-   sync status
-   hospital dashboard shell

Deliverable:

``` text
Working UI using mocked API data first,
then integrate real API.
```

## Developer 2 --- Backend / Database

Own:

-   PostgreSQL schema
-   migrations
-   REST API
-   authentication
-   RBAC
-   referral service
-   patient service
-   audit events
-   sync/idempotency

Deliverable:

``` text
Stable REST API + database
```

## Developer 3 --- AI / Intelligence

Own:

-   OCR integration
-   image preprocessing
-   extraction
-   normalization
-   confidence
-   identity matching
-   structured AI response

Deliverable:

``` text
Stable AI service/API contracts
```

## Developer 4 --- Offline / Integration / Demo

Own:

-   IndexedDB/SQLite queue
-   connectivity detection
-   sync manager
-   SMS fallback/demo
-   integration
-   seed data
-   timeline
-   demo flow
-   end-to-end testing

Deliverable:

``` text
Reliable end-to-end vertical slice
```

------------------------------------------------------------------------

# 31. WORKSTREAM OWNERSHIP RULE

Each developer owns modules, but integration contracts belong to the
whole team.

Before changing another developer's module:

``` text
1. Check its public interface.
2. Preserve compatibility if possible.
3. Coordinate breaking changes.
4. Update shared types.
5. Add/update tests.
```

Agents must not make broad refactors just because another architecture
appears cleaner.

------------------------------------------------------------------------

# 32. GIT WORKFLOW

Recommended branches:

``` text
main
dev/frontend
dev/backend
dev/ai
dev/offline-integration
```

Feature branches:

``` text
feat/referral-form
feat/offline-queue
feat/referral-api
feat/identity-matching
feat/document-ai
feat/timeline
```

Commits should be focused:

``` text
feat: add offline referral queue
feat: add identity match endpoint
feat: add document confidence review
fix: prevent duplicate sync events
```

------------------------------------------------------------------------

# 33. SHARED ENVIRONMENT VARIABLES

Example:

``` env
DATABASE_URL=
JWT_SECRET=
API_URL=

AI_SERVICE_URL=

OCR_PROVIDER=
OCR_API_KEY=

LLM_PROVIDER=
LLM_API_KEY=

SMS_PROVIDER=
SMS_API_KEY=
SMS_FROM_NUMBER=

STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
```

Never commit real values.

------------------------------------------------------------------------

# 34. SEED DATA

The demo should not depend on manually entering everything.

Create seed data for:

### Facilities

``` text
PHC Khed
District Hospital
Next Provider Clinic
```

### Patients

Include:

-   one clear match;
-   one ambiguous match;
-   one no-match candidate.

### Referrals

Include examples in different states:

``` text
QUEUED
SYNCED
RECEIVED
IDENTITY_PENDING
IDENTITY_CONFIRMED
FOLLOW_UP_DUE
```

### Documents

Include at least:

-   one high-confidence example;
-   one ambiguous/low-confidence example.

------------------------------------------------------------------------

# 35. TEST DATA SHOULD BE SYNTHETIC

Use fictional patients and documents for the hackathon demo.

Do not commit real patient medical records.

------------------------------------------------------------------------

# 36. TESTING STRATEGY

## Unit tests

Test:

-   referral validation;
-   identity scoring;
-   normalization;
-   confidence threshold logic;
-   sync event serialization;
-   idempotency;
-   permission checks.

## Integration tests

Test:

``` text
Create referral
→ store
→ sync
→ receive
→ identity match
→ confirm
→ document process
→ review
→ timeline
```

## Offline test

Important:

``` text
1. Start application online.
2. Create referral.
3. Disable network.
4. Create referral.
5. Refresh page.
6. Verify referral still exists locally.
7. Re-enable network.
8. Verify it syncs.
9. Verify only one server record exists.
```

## Duplicate sync test

Send the same event twice.

Expected:

``` text
One logical referral.
No duplicate record.
```

## Identity safety test

Two similar patients must not be automatically merged.

## OCR safety test

Low-confidence field must enter review state.

------------------------------------------------------------------------

# 37. ACCEPTANCE CRITERIA

The MVP is considered functionally complete when the following scenario
works:

> A PHC user creates a referral while online. The system can then
> operate while offline, persist the referral locally, queue it, and
> synchronize it after connectivity returns without duplication. If data
> connectivity is unavailable, critical referral metadata can be
> represented through the SMS fallback path. The receiving hospital can
> view the referral, receive candidate patient identity matches,
> explicitly confirm an identity, process a clinical document through
> OCR and structured extraction, see field-level confidence, review
> uncertain fields against the original document, and view the entire
> journey in an auditable continuity timeline with a follow-up event.

------------------------------------------------------------------------

# 38. END-TO-END DEFINITION OF DONE

A feature is not done merely because the UI exists.

For every feature:

``` text
UI
+
API
+
DATABASE
+
VALIDATION
+
ERROR STATE
+
AUDIT EVENT
+
TEST
=
DONE
```

For offline features:

``` text
ONLINE PATH
+
OFFLINE PATH
+
RECOVERY PATH
=
DONE
```

For AI features:

``` text
AI OUTPUT
+
SCHEMA VALIDATION
+
CONFIDENCE
+
UNCERTAINTY
+
HUMAN REVIEW
=
DONE
```

------------------------------------------------------------------------

# 39. ERROR STATES

Every major screen needs explicit error states.

Examples:

``` text
Network unavailable
Sync failed
Document upload failed
OCR failed
AI service unavailable
Identity match unavailable
Storage unavailable
Unauthorized
Session expired
Invalid referral
Duplicate event
Conflict detected
```

Do not show only:

``` text
Something went wrong.
```

Use actionable messages.

Example:

``` text
Referral saved locally.
Internet connection is unavailable.
It will sync automatically when connectivity returns.
```

------------------------------------------------------------------------

# 40. OBSERVABILITY

For development/demo:

Log:

-   request IDs;
-   event IDs;
-   sync IDs;
-   processing IDs;
-   errors;
-   retry count.

Example:

``` text
[SYNC] EVT-1024 → SYNCING
[SYNC] EVT-1024 → SYNCED
```

Avoid logging sensitive medical data.

------------------------------------------------------------------------

# 41. DEMO MODE

A dedicated demo mode can make the hackathon presentation reliable.

Possible environment variable:

``` env
DEMO_MODE=true
```

Demo mode can provide:

-   simulated connectivity toggle;
-   seeded patients;
-   seeded referrals;
-   simulated SMS;
-   deterministic identity candidates;
-   deterministic document processing if external AI fails.

The UI must clearly distinguish simulated behavior from real
integrations.

Example:

``` text
DEMO MODE
SMS SIMULATION
```

This is preferable to pretending an external service was actually used.

------------------------------------------------------------------------

# 42. RESILIENCE / FALLBACK STRATEGY

External AI or SMS services can fail during the demo.

Therefore:

``` text
External AI available
      ↓
Use AI

External AI unavailable
      ↓
Use deterministic demo fixture / fallback
      ↓
Still demonstrate workflow
```

The fallback must not fabricate clinical claims.

For document demos, use known synthetic documents and predetermined
extraction fixtures where necessary.

------------------------------------------------------------------------

# 43. UX DESIGN DIRECTION

The UI should feel like a healthcare operations system, not a generic AI
chatbot.

Priorities:

-   clean;
-   professional;
-   information-dense but readable;
-   obvious status indicators;
-   strong hierarchy;
-   minimal animation;
-   clear alerts;
-   accessible forms;
-   visible uncertainty;
-   clinician-oriented review screens.

Important visual states:

``` text
ONLINE
OFFLINE
SYNCING
SYNCED
NEEDS REVIEW
VERIFIED
REJECTED
FOLLOW-UP DUE
```

Use consistent status badges.

------------------------------------------------------------------------

# 44. IMPORTANT UI COMPONENTS

Recommended reusable components:

``` text
ConnectivityIndicator
SyncQueueBadge
ReferralStatusBadge
UrgencyBadge
PatientSummaryCard
IdentityComparisonCard
MatchScore
ConfidenceBadge
ClinicalFieldReview
DocumentViewer
Timeline
AuditEvent
FollowUpCard
OfflineBanner
ErrorState
EmptyState
```

------------------------------------------------------------------------

# 45. PRODUCT DIFFERENTIATION

Do not present the project as:

``` text
AI + OCR + Blockchain + Dashboard
```

The product story is:

``` text
Healthcare handoffs fail at the edges.

SwasthyaSetu protects the handoff when:
- connectivity fails;
- identity is inconsistent;
- documents are difficult to read;
- AI is uncertain;
- follow-up gets lost.
```

The engineering novelty is the **continuity-focused integration of
established technologies and workflows**, not a claim that OCR, fuzzy
matching, or offline storage were invented by the team.

------------------------------------------------------------------------

# 46. RESEARCH / STANDARDS DIRECTION

The official project material references:

-   WHO --- Continuity and coordination of care
-   HL7 --- FHIR overview
-   ABDM / National Health Authority --- interoperability direction
-   Fellegi & Sunter --- record linkage
-   Kreimeyer et al. --- clinical NLP

The project is designed with a standards-compatible future direction.

Do not claim official integration with ABDM/FHIR unless an actual
integration has been implemented and verified.

------------------------------------------------------------------------

# 47. FUTURE SCOPE

These are future directions, not MVP requirements:

-   multilingual discharge-document understanding;
-   stronger hospital abbreviation dictionaries;
-   better handwriting recognition;
-   multilingual SMS/local-language workflows;
-   privacy-preserving identity matching;
-   referral bottleneck analytics;
-   ambulance/referral-capacity integration;
-   standards-based integration with state/national infrastructure.

------------------------------------------------------------------------

# 48. RISKS AND MITIGATIONS

  Risk                             Mitigation
  -------------------------------- -------------------------------------------
  Incorrect OCR                    Field-level confidence + clinician review
  False identity match             Weighted scoring + explicit confirmation
  SMS privacy                      Minimum necessary metadata
  Duplicate sync                   Event IDs + idempotent server processing
  Network loss                     Local queue
  AI service failure               Graceful error + demo fallback
  Ambiguous medical abbreviation   Review required
  Data conflict                    Explicit conflict state
  Unauthorized access              JWT + RBAC
  Demo instability                 Seed data + demo mode

------------------------------------------------------------------------

# 49. EXPECTED IMPACT --- HOW TO TALK ABOUT IT

The official material identifies expected directions such as:

-   reduced information loss during referrals;
-   better referral visibility;
-   safer document interpretation;
-   better continuity;
-   lower risk of repeated investigations from missing records.

Do **not** invent percentages.

Use:

``` text
Expected impact — to be validated through pilot evaluation.
```

Do not claim:

``` text
40% fewer readmissions
```

unless backed by actual evidence.

------------------------------------------------------------------------

# 50. AGENT INSTRUCTIONS

Any AI coding agent working on this repository should follow these
rules.

## Rule 1 --- Understand before modifying

Before coding:

``` text
Inspect:
- package.json
- README
- source tree
- environment files
- database schema
- existing APIs
- existing AI services
- current UI
```

## Rule 2 --- Preserve working code

Do not rewrite functioning modules without a concrete reason.

## Rule 3 --- Implement the smallest complete slice

Prefer:

``` text
one complete feature
```

over:

``` text
five partially implemented features
```

## Rule 4 --- Respect domain boundaries

Frontend:

``` text
presentation + client state
```

Backend:

``` text
business rules + persistence + authorization
```

AI:

``` text
extraction + scoring + normalization
```

Offline:

``` text
local persistence + sync orchestration
```

## Rule 5 --- Never silently infer clinical facts

Missing information must remain missing.

## Rule 6 --- Never silently merge patients

Identity linking requires explicit confirmation.

## Rule 7 --- Make failure visible

Connectivity, AI, sync, identity and document failures need explicit
states.

## Rule 8 --- Keep APIs deterministic

Document request/response schemas.

## Rule 9 --- Add tests for risky logic

Especially:

-   identity matching;
-   synchronization;
-   idempotency;
-   permissions;
-   confidence/review logic.

## Rule 10 --- Do not expand scope without approval

If a new feature is not necessary for the end-to-end demo, do not
prioritize it over core reliability.

------------------------------------------------------------------------

# 51. AGENT TASK FORMAT

When assigning a task to an AI agent, use:

``` text
TASK:
<feature>

CONTEXT:
<why it exists>

INPUT:
<API/data/UI inputs>

OUTPUT:
<expected behavior>

FILES:
<allowed/likely files>

CONSTRAINTS:
<what must not change>

ACCEPTANCE:
<testable conditions>
```

Example:

``` text
TASK:
Implement the offline referral queue.

CONTEXT:
PHC users must be able to create referrals without internet access.

INPUT:
Referral form payload.

OUTPUT:
Referral persisted locally and sync event created.

CONSTRAINTS:
Do not modify backend API.

ACCEPTANCE:
1. Referral survives page refresh.
2. Queue survives offline mode.
3. Queue syncs after reconnection.
4. Duplicate event does not create duplicate referral.
```

------------------------------------------------------------------------

# 52. INTEGRATION ORDER

Build in this order:

``` text
1. Database
2. Patient + referral API
3. Basic PHC UI
4. Basic hospital UI
5. Offline persistence
6. Sync engine
7. Identity matching
8. Document upload
9. OCR/extraction
10. Confidence + review
11. Timeline
12. Follow-up
13. Audit
14. Demo polish
```

Do not wait until the end to integrate.

After every major module:

``` text
integrate
→ test
→ commit
```

------------------------------------------------------------------------

# 53. HACKATHON PRIORITY ORDER

If time becomes limited:

## P0 --- absolutely required

``` text
Referral
Offline queue
Sync
Hospital dashboard
Identity match
Human confirmation
Document OCR/extraction
Confidence/review
Timeline
```

## P1 --- important polish

``` text
SMS fallback
Audit timeline
RBAC
Better error states
Seed data
Demo mode
```

## P2 --- only if time remains

``` text
Advanced analytics
Additional languages
FHIR mapping
ABDM integration
Advanced dashboards
```

Never sacrifice P0 to build P2.

------------------------------------------------------------------------

# 54. FINAL PRODUCT CHECKLIST

## Referral

-   [ ] Referral can be created
-   [ ] Local validation works
-   [ ] Referral ID exists
-   [ ] Referral can be saved offline
-   [ ] Referral syncs online
-   [ ] Duplicate sync is safe
-   [ ] Status is visible

## SMS

-   [ ] Minimum metadata formatter exists
-   [ ] Simulation mode is clearly labeled
-   [ ] Real provider integration is isolated

## Identity

-   [ ] Candidate search works
-   [ ] Weighted score works
-   [ ] Field-level evidence shown
-   [ ] No automatic merge
-   [ ] Clinician confirmation works
-   [ ] Audit event recorded

## Documents

-   [ ] Upload works
-   [ ] Original document preserved
-   [ ] OCR works
-   [ ] Structured fields returned
-   [ ] Confidence shown
-   [ ] Low-confidence fields reviewed
-   [ ] Manual correction stored
-   [ ] Audit event recorded

## Timeline

-   [ ] Referral event appears
-   [ ] Sync event appears
-   [ ] Identity event appears
-   [ ] Document event appears
-   [ ] Review event appears
-   [ ] Follow-up appears

## Security

-   [ ] Auth works
-   [ ] RBAC enforced
-   [ ] No secrets committed
-   [ ] Sensitive logs avoided

## Demo

-   [ ] Seed data works
-   [ ] Offline simulation works
-   [ ] SMS simulation works
-   [ ] AI fallback exists if needed
-   [ ] Entire journey can be demonstrated without manual database edits

------------------------------------------------------------------------

# 55. THE ONE QUESTION THE TEAM MUST ANSWER

Before declaring the MVP complete, ask:

> **Can Ramesh's clinical information travel from a PHC to a district
> hospital, survive an internet outage, reconcile his identity without
> silently merging records, convert a difficult clinical document into
> structured information without hiding uncertainty, require human
> verification where necessary, and close the follow-up loop?**

If the answer is **yes**, the core SwasthyaSetu concept is implemented.

If the answer is **no**, do not add another flashy feature.

Fix the missing part of the continuity journey.

------------------------------------------------------------------------

# 56. FINAL PRODUCT DEFINITION

SwasthyaSetu is an **offline-first healthcare continuity layer**.

It connects:

``` text
REFERRAL
   ↓
CONNECTIVITY RESILIENCE
   ↓
IDENTITY RECONCILIATION
   ↓
CLINICAL DOCUMENT STRUCTURING
   ↓
HUMAN VERIFICATION
   ↓
AUDITABLE CARE TIMELINE
   ↓
FOLLOW-UP
```

Its core principle is:

> **Information should follow the patient --- even when the internet
> doesn't.**

The implementation should remain faithful to this principle throughout
development.
