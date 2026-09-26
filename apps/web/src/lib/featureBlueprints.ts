import { FeatureBlueprint } from '../components/FeatureBlueprintModal';

export const PHC_BLUEPRINTS: Record<string, FeatureBlueprint> = {
  vitals: {
    id: 'phc-vitals-screening',
    title: 'Frontline Rapid Vitals & NCD Screening Intake',
    role: 'PHC_USER',
    status: 'NEXT_UP',
    badgeLabel: 'Roadmap Sprint 1',
    clinicalPurpose: 'Standardized frontline intake recording Blood Pressure, SpO2, Blood Sugar, and maternal gestational age for hypertension/diabetes screening.',
    targetUsers: 'Community Health Officers (CHOs) and ASHA workers',
    safetyRule: 'Automatic warning badges triggered for systolic BP >160 mmHg or SpO2 <92%.',
    technicalSpecs: {
      endpoints: ['POST /api/vitals', 'GET /api/patients/:id/vitals'],
      models: ['VitalSign', 'PatientObservation'],
    },
    acceptanceCriteria: [
      'Single-screen rapid vitals entry with validation',
      'Seamlessly attaches to referral creation modal',
    ],
  },
  followup: {
    id: 'phc-followup-check',
    title: 'Post-Discharge Return & Follow-Up Tracker',
    role: 'PHC_USER',
    status: 'NEXT_UP',
    badgeLabel: 'Roadmap Sprint 2',
    clinicalPurpose: 'Notifies the local PHC when a patient discharged from the District Hospital is due for a follow-up consultation or medication refill.',
    targetUsers: 'PHC doctors and community health workers',
    technicalSpecs: {
      endpoints: ['GET /api/follow-ups/facility/:id', 'POST /api/follow-ups/:id/complete'],
      models: ['FollowUp', 'Referral'],
    },
    acceptanceCriteria: [
      'Displays patients due this week with original discharge summary notes',
      'Completing the visit closes the loop back to the hospital',
    ],
  },
};

export const HOSPITAL_BLUEPRINTS: Record<string, FeatureBlueprint> = {
  timeline: {
    id: 'hosp-timeline',
    title: 'Unified Patient Care Continuity Timeline (EHR)',
    role: 'CLINICIAN',
    status: 'NEXT_UP',
    badgeLabel: 'Roadmap Sprint 2',
    clinicalPurpose: 'Chronological master timeline tracking the patient through PHC referral, hospital arrival, emergency triage, ICU/Ward stay, surgery, and discharge.',
    targetUsers: 'Hospital doctors and receiving practitioners',
    technicalSpecs: {
      endpoints: ['GET /api/patients/:id/timeline'],
      models: ['AuditEvent', 'Referral', 'ClinicalDocument'],
    },
    acceptanceCriteria: [
      'Multi-facility chronological journey visualization',
      'Tamper-evident audit trail attached to every clinical event',
    ],
  },
  discharge: {
    id: 'hosp-discharge-summary',
    title: 'Standardized Structured Discharge Summary Generator',
    role: 'CLINICIAN',
    status: 'PLANNED',
    badgeLabel: 'Roadmap Sprint 3',
    clinicalPurpose: 'Generates structured digital discharge summaries with ICD-10 confirmed diagnoses, medication lists, and automatically alerts the patient village PHC.',
    targetUsers: 'Attending hospital physicians and discharge coordinators',
    technicalSpecs: {
      endpoints: ['POST /api/discharge-summaries'],
      models: ['DischargeSummary', 'FollowUpSchedule'],
    },
    acceptanceCriteria: [
      'Auto-populates from verified OCR and inpatient notes',
      'Auto-schedules local PHC return alert',
    ],
  },
};

export const COORDINATOR_BLUEPRINTS: Record<string, FeatureBlueprint> = {
  kanban: {
    id: 'coord-kanban',
    title: 'District Inter-Facility Transfer Kanban Board',
    role: 'REFERRAL_COORDINATOR',
    status: 'NEXT_UP',
    badgeLabel: 'Roadmap Sprint 1',
    clinicalPurpose: 'Visual Kanban board tracking active patient transfers across statuses: Dispatched, In-Transit, Arrived, and Admitted.',
    targetUsers: '108 Ambulance dispatchers and district referral officers',
    safetyRule: 'Emergency transfer cards display active ambulance coordinates and transit timer.',
    technicalSpecs: {
      endpoints: ['GET /api/referrals/transfers', 'PUT /api/referrals/:id/status'],
      models: ['Referral', 'AmbulanceDispatch'],
    },
    acceptanceCriteria: [
      'Drag-and-drop or 1-click status transitions',
      'Real-time transit timer with delay alerts',
    ],
  },
  readiness: {
    id: 'coord-readiness',
    title: 'Hospital Bed & Capability Readiness Radar',
    role: 'REFERRAL_COORDINATOR',
    status: 'NEXT_UP',
    badgeLabel: 'Roadmap Sprint 2',
    clinicalPurpose: 'Live capacity monitor showing available ICU/CCU beds, oxygen beds, and on-duty specialists (Cath lab active, C-section ready) across district facilities.',
    targetUsers: 'District health coordinators and emergency dispatchers',
    technicalSpecs: {
      endpoints: ['GET /api/facilities/capacity', 'PUT /api/facilities/capacity'],
      models: ['FacilityCapacity', 'SpecialistRoster'],
    },
    acceptanceCriteria: [
      'Real-time bed counts across all secondary and tertiary hospitals',
      'Prevents ambulance dispatch to saturated facilities',
    ],
  },
  ambulanceSlip: {
    id: 'coord-ambulance-slip',
    title: '108 Ambulance Digital Transport Slip',
    role: 'REFERRAL_COORDINATOR',
    status: 'BUILT',
    badgeLabel: 'Operational',
    clinicalPurpose: 'Generates a 1-click printable or SMS handoff summary for ambulance drivers containing pickup coordinates, patient vitals, and en-route stabilization notes.',
    targetUsers: 'Ambulance EMTs and paramedic drivers',
    technicalSpecs: {
      endpoints: ['GET /api/referrals/:id/transport-slip'],
      models: ['Referral', 'TransportSlip'],
    },
    acceptanceCriteria: [
      'Accessible offline on mobile devices',
      'Captures en-route vitals timestamp',
    ],
  },
  metrics: {
    id: 'coord-metrics',
    title: 'Transit Delay & Casualty Intake Lag Analytics',
    role: 'REFERRAL_COORDINATOR',
    status: 'PLANNED',
    badgeLabel: 'Roadmap Sprint 3',
    clinicalPurpose: 'District-wide operational intelligence tracking ambulance transit times, casualty gate delays, and transfer bottleneck patterns.',
    targetUsers: 'District Health Officers and hospital superintendents',
    technicalSpecs: {
      endpoints: ['GET /api/coordination/metrics'],
      models: ['AuditEvent', 'ReferralMetric'],
    },
    acceptanceCriteria: [
      'Calculates median transfer duration by corridor',
      'Highlights facilities with >30min intake delays',
    ],
  },
};

export const ADMIN_BLUEPRINTS: Record<string, FeatureBlueprint> = {
  auditTrail: {
    id: 'admin-audit',
    title: 'Immutable Clinical Audit Trail Explorer',
    role: 'ADMIN',
    status: 'NEXT_UP',
    badgeLabel: 'Audit Verified',
    clinicalPurpose: 'Searchable, tamper-evident ledger of every system event (REFERRAL_CREATED, IDENTITY_CONFIRMED, DOCUMENT_OCR_VERIFIED) with actorId, facilityId, and timestamps.',
    targetUsers: 'District Health Officers, Compliance Auditors, Chief Medical Officers',
    safetyRule: 'Clinical Governance (Auditability): Audit log is strictly append-only; records cannot be updated or deleted.',
    technicalSpecs: {
      endpoints: ['GET /api/audit/events', 'GET /api/audit/verify'],
      models: ['AuditEvent'],
    },
    acceptanceCriteria: [
      'Cryptographically verifiable hash chain',
      'Filterable by actor, facility, event type, and date range',
    ],
  },
  syncGateway: {
    id: 'admin-sync',
    title: 'Sync Gateway Diagnostics & District Outbreak Radar',
    role: 'ADMIN',
    status: 'PLANNED',
    badgeLabel: 'Roadmap Sprint 3',
    clinicalPurpose: 'Monitors offline queue volumes across rural PHCs, network packet health, and automated syndromic cluster detection (e.g. fever or Dengue spikes by village).',
    targetUsers: 'Epidemiologists and District Surveillance Officers',
    technicalSpecs: {
      endpoints: ['GET /api/analytics/referral-trends', 'GET /api/sync/health'],
      models: ['SyncEvent', 'DiseaseSurveillanceReport'],
    },
    acceptanceCriteria: [
      'Visual heat map of village syndromic clusters',
      'Diagnostics monitor for rural sync queues',
    ],
  },
};
