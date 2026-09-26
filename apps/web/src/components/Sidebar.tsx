import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FeatureBlueprintModal, FeatureBlueprint } from './FeatureBlueprintModal';
import {
  ShieldCheck,
  LayoutGrid,
  FileText,
  ScanLine,
  Clock,
  ShieldAlert,
  Key,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Send,
  CalendarCheck,
  WifiOff,
  MessageSquare,
  FileSpreadsheet,
  HeartPulse,
  UserCheck,
  FileCheck2,
  Building2,
  ArrowRightLeft,
  Layers,
  BarChart3,
  Activity,
} from 'lucide-react';

interface NavItem {
  id: string;
  title: string;
  route?: string;
  icon: React.ElementType;
  status: 'BUILT' | 'IN_PROGRESS' | 'NEXT_UP' | 'PLANNED';
  badge?: string;
  blueprint: FeatureBlueprint;
}

interface RoleConfig {
  key: 'PHC_USER' | 'CLINICIAN' | 'REFERRAL_COORDINATOR' | 'ADMIN';
  shortLabel: string;
  fullTitle: string;
  sectionHeader: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeBlueprint, setActiveBlueprint] = useState<FeatureBlueprint | null>(null);

  // Active role is strictly locked to the authenticated user's role
  const activeRole = user?.role || 'PHC_USER';

  // Complete Role-Specific Feature Configurations (Built + Planned for each role)
  const roleConfigs: Record<string, RoleConfig> = {
    PHC_USER: {
      key: 'PHC_USER',
      shortLabel: 'PHC',
      fullTitle: 'Primary Health Centre Doctor / CHO',
      sectionHeader: 'PHC CLINICIAN WORKFLOW',
      items: [
        {
          id: 'phc-dashboard',
          title: 'PHC Clinical Dashboard',
          route: '/phc',
          icon: LayoutGrid,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'phc-dashboard',
            title: 'PHC Clinical Operations Cockpit',
            role: 'PHC_USER',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'Real-time overview of outbound patient referrals, live offline sync queue counter, and frontline connectivity status.',
            targetUsers: 'Primary Care Doctors, Community Health Officers (CHOs), ASHA workers',
            technicalSpecs: {
              endpoints: ['GET /api/referrals', 'GET /api/health'],
              models: ['Referral', 'Patient', 'Facility'],
            },
            acceptanceCriteria: [
              'Role-aware filtering displays only referrals originated by this PHC',
              'Instant visual indicators for queued offline events',
            ],
          },
        },
        {
          id: 'phc-referral-create',
          title: 'Create Digital Referral',
          route: '/phc',
          icon: Send,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'phc-referral-create',
            title: '3-Tier Digital Referral & Urgency Triage Form',
            role: 'PHC_USER',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'Generates structured referrals with 3 urgency tiers (Routine, Urgent, Emergency), clinical notes, vitals, and pre-referral medication.',
            targetUsers: 'PHC Medical Officers and frontline health workers',
            safetyRule: 'Urgency tier triggers instant visual red alerts across receiving district hospitals.',
            technicalSpecs: {
              endpoints: ['POST /api/referrals', 'GET /api/facilities'],
              models: ['Referral', 'Patient', 'Facility', 'AuditEvent'],
            },
            acceptanceCriteria: [
              'Unique collision-resistant referral ID (RF-XXXX)',
              'Replay-protected via client UUID',
              'Atomic Prisma transaction writes referral and AuditEvent',
            ],
          },
        },
        {
          id: 'phc-offline-queue',
          title: 'Offline Queue (Dexie.js)',
          route: '/phc',
          icon: WifiOff,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'phc-offline-queue',
            title: 'IndexedDB Offline Persistence Engine',
            role: 'PHC_USER',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'Guarantees rural doctors can create referrals when internet drops to zero. Data persists in browser IndexedDB with 15-second heartbeat auto-sync.',
            targetUsers: 'Rural clinicians operating under intermittent connectivity',
            safetyRule: 'Idempotency Guarantee: Event-scoped UUID deduplication prevents patient record duplication upon reconnect.',
            technicalSpecs: {
              endpoints: ['POST /api/sync/events', 'GET /api/health'],
              models: ['SyncEvent', 'LocalReferral'],
            },
            acceptanceCriteria: [
              'Auto-syncs batch queue upon network reconnection',
              'Manual "Force Sync Queue" trigger available in dashboard',
            ],
          },
        },
        {
          id: 'phc-sms-dispatch',
          title: '2G Cellular SMS Fallback',
          route: '/phc',
          icon: MessageSquare,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'phc-sms-dispatch',
            title: 'GSM 160-Character Compact Emergency SMS Dispatcher',
            role: 'PHC_USER',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'Encodes emergency referrals into a compact <160 char GSM string for dispatch over ordinary 2G cellular text when packet data fails completely.',
            targetUsers: 'Frontline ASHA workers and PHC doctors in remote hill/tribal pockets',
            safetyRule: 'Transmits minimum required clinical metadata for immediate triage without exposing full private history.',
            technicalSpecs: {
              endpoints: ['Local Shared Formatter: formatFallbackSMS'],
              models: ['Referral'],
            },
            acceptanceCriteria: [
              'String fits within 160 GSM character limit',
              '1-click copy action for immediate cellular transmission',
            ],
          },
        },
        {
          id: 'phc-referral-log',
          title: 'Dispatched Referrals Log',
          route: '/phc',
          icon: FileSpreadsheet,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'phc-referral-log',
            title: 'Live Dispatched Referrals Status Tracker',
            role: 'PHC_USER',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'Live operational list tracking outbound referrals with urgency pills and sync states (QUEUED vs SYNCED).',
            targetUsers: 'PHC Medical Officers and staff nurses',
            technicalSpecs: {
              endpoints: ['GET /api/referrals'],
              models: ['Referral', 'Patient'],
            },
            acceptanceCriteria: [
              'Real-time merging of local Dexie.js records and cloud database',
            ],
          },
        },
        {
          id: 'phc-vitals-screening',
          title: 'Rapid Vitals & Screening',
          icon: HeartPulse,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'phc-vitals-screening',
            title: 'Frontline Rapid Vitals & NCD Screening Intake',
            role: 'PHC_USER',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
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
        },
        {
          id: 'phc-followup-check',
          title: 'Patient Return Follow-Up',
          icon: CalendarCheck,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'phc-followup-check',
            title: 'Post-Discharge Return & Follow-Up Tracker',
            role: 'PHC_USER',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
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
        },
        {
          id: 'phc-profile',
          title: 'Facility & Profile',
          route: '/phc',
          icon: User,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'phc-profile',
            title: 'PHC Center Profile & Practitioner Credentials',
            role: 'PHC_USER',
            status: 'BUILT',
            badgeLabel: 'Active',
            clinicalPurpose: 'Displays active doctor credentials, government facility code, and assigned sub-district area.',
            targetUsers: 'PHC Medical Officers',
            technicalSpecs: {
              endpoints: ['GET /api/auth/me', 'GET /api/facilities'],
              models: ['User', 'Facility'],
            },
            acceptanceCriteria: [
              'Displays linked PHC facility name and code',
            ],
          },
        },
      ],
    },

    CLINICIAN: {
      key: 'CLINICIAN',
      shortLabel: 'HOSP',
      fullTitle: 'District Hospital Clinician & Specialist',
      sectionHeader: 'HOSPITAL CLINICIAN WORKFLOW',
      items: [
        {
          id: 'hosp-dashboard',
          title: 'Hospital Intake Dashboard',
          route: '/hospital',
          icon: LayoutGrid,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'hosp-dashboard',
            title: 'District Hospital Emergency Triage Cockpit',
            role: 'CLINICIAN',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'Central dashboard showing incoming emergency transfers, pending identity candidate matches, and hospital triage statistics.',
            targetUsers: 'Emergency medical officers, triage nurses, and chief clinicians',
            technicalSpecs: {
              endpoints: ['GET /api/referrals', 'GET /api/identity/evaluate/:id'],
              models: ['Referral', 'Patient', 'Facility'],
            },
            acceptanceCriteria: [
              'Emergency referrals pinned at the top with rose alert badges',
              'Identity reconciliation queue highlights high-similarity candidates',
            ],
          },
        },
        {
          id: 'hosp-triage-queue',
          title: 'Emergency Triage Queue',
          route: '/hospital',
          icon: ShieldAlert,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'hosp-triage-queue',
            title: 'Live District Triage Stream',
            role: 'CLINICIAN',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'Live incoming stream of referred patients categorized by urgency (Emergency, Urgent, Routine) with facility origin and clinical complaints.',
            targetUsers: 'Emergency department clinicians and casualty medical officers',
            safetyRule: 'STEMI and critical cardiac/obstetric emergencies trigger prominent red pulse visual badges.',
            technicalSpecs: {
              endpoints: ['GET /api/referrals?urgency=EMERGENCY'],
              models: ['Referral', 'Patient'],
            },
            acceptanceCriteria: [
              'Live filtering by urgency and source PHC',
              '1-click deep link to Identity Verification',
            ],
          },
        },
        {
          id: 'hosp-identity-reconcile',
          title: 'Identity Reconciliation',
          route: '/hospital',
          icon: UserCheck,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'hosp-identity-reconcile',
            title: 'Side-by-Side Patient Identity Reconciliation',
            role: 'CLINICIAN',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'Matches incoming patient against hospital registry records (Name 35%, Phone 25%, Village 15%, Age 10%) and renders side-by-side 50/50 review screen.',
            targetUsers: 'Clinicians, hospital registrars, medical records officers',
            safetyRule: 'Safety Protocol: High-similarity records require clinician side-by-side verification before master chart linkage.',
            technicalSpecs: {
              endpoints: ['GET /api/identity/evaluate/:id', 'POST /api/identity/confirm', 'POST /api/identity/reject'],
              models: ['IdentityMatch', 'Patient', 'AuditEvent'],
              aiServices: ['RapidFuzz / Weighted Levenshtein Engine'],
            },
            acceptanceCriteria: [
              'Side-by-side comparison screen with field-level score pills (Match 100%, Partial, Mismatch)',
              'Mandatory clinician verification notes captured in append-only AuditEvent',
            ],
          },
        },
        {
          id: 'hosp-document-ocr',
          title: 'Prescription & Document Scanner',
          icon: ScanLine,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'hosp-document-ocr',
            title: 'Uncertainty-Aware Clinical Document & Prescription Scanner',
            role: 'CLINICIAN',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'Digitizes discharge summaries, handwritten doctor slips, and lab tests into structured JSON records with field-level confidence scores.',
            targetUsers: 'Clinicians, medical records clerks, and pharmacists',
            safetyRule: 'Clinical Safety Protocol: Any field with confidence score <90% is flagged for mandatory manual confirmation.',
            technicalSpecs: {
              endpoints: ['POST /api/documents/extract', 'POST /api/documents/confirm-fields'],
              models: ['ClinicalDocument', 'ExtractedField'],
              aiServices: ['Vision OCR Microservice (services/ai)'],
            },
            acceptanceCriteria: [
              'Split-screen review: Document scan on left, editable extracted fields on right',
              'Visual confidence badges (Emerald >=90%, Amber <90%)',
              'Never saves unverified OCR guesses as clinical fact',
            ],
          },
        },
        {
          id: 'hosp-medical-records',
          title: 'Master Medical Records',
          route: '/hospital',
          icon: FileText,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'hosp-medical-records',
            title: 'Master Patient Index & Clinical History',
            role: 'CLINICIAN',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'Consolidated view of patient historical records, linked referrals, verified identity matches, and past admissions.',
            targetUsers: 'Hospital medical staff',
            technicalSpecs: {
              endpoints: ['GET /api/referrals/:id'],
              models: ['Patient', 'Referral', 'AuditEvent'],
            },
            acceptanceCriteria: [
              'Unified view of patient records across facilities',
            ],
          },
        },
        {
          id: 'hosp-timeline',
          title: 'Care Continuity Timeline',
          icon: Clock,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'hosp-timeline',
            title: 'Unified Patient Care Continuity Timeline (EHR)',
            role: 'CLINICIAN',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'Chronological master timeline tracking the patient through PHC referral, hospital arrival, emergency triage, ICU/Ward stay, surgery, and discharge.',
            targetUsers: 'Hospital doctors and receiving practitioners',
            technicalSpecs: {
              endpoints: ['GET /api/patients/:id/timeline'],
              models: ['AuditEvent', 'Referral', 'ClinicalDocument'],
            },
            acceptanceCriteria: [
              'Vertical continuous track with circular event badges',
              'Clear visual demarcation of facility transfers',
            ],
          },
        },
        {
          id: 'hosp-discharge-gen',
          title: 'Discharge Summary Generator',
          icon: FileCheck2,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'hosp-discharge-gen',
            title: 'Standardized Structured Discharge Summary Handoff',
            role: 'CLINICIAN',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'Generates structured discharge summaries with final diagnoses, discharge vitals, take-home medications, and scheduled follow-up instructions.',
            targetUsers: 'Attending physicians and ward medical officers',
            technicalSpecs: {
              endpoints: ['POST /api/discharge-summaries', 'GET /api/discharge-summaries/:id'],
              models: ['DischargeSummary', 'FollowUp'],
            },
            acceptanceCriteria: [
              'Conforms to discharge handoff standards',
              'Auto-schedules follow-up alert for patient local PHC',
            ],
          },
        },
      ],
    },

    REFERRAL_COORDINATOR: {
      key: 'REFERRAL_COORDINATOR',
      shortLabel: 'COORD',
      fullTitle: 'District Referral & Transfer Coordinator',
      sectionHeader: 'COORDINATION & TRANSFER WORKFLOW',
      items: [
        {
          id: 'coord-overview',
          title: 'Transfer Overview',
          route: '/triage',
          icon: LayoutGrid,
          status: 'IN_PROGRESS',
          badge: 'Wiring',
          blueprint: {
            id: 'coord-overview',
            title: 'District Referral Coordination Overview',
            role: 'REFERRAL_COORDINATOR',
            status: 'IN_PROGRESS',
            badgeLabel: 'In Progress',
            clinicalPurpose: 'Real-time overview of active inter-facility transfers, ambulance transit times, and district hospital bed availability.',
            targetUsers: 'Referral coordinators and 108 emergency dispatchers',
            technicalSpecs: {
              endpoints: ['GET /api/test/coordinator-only', 'GET /api/referrals'],
              models: ['Referral', 'Facility'],
            },
            acceptanceCriteria: [
              'Live stats on in-transit vs arrived emergency cases',
            ],
          },
        },
        {
          id: 'coord-transfer-board',
          title: 'Inter-Facility Transfer Board',
          route: '/triage',
          icon: ArrowRightLeft,
          status: 'IN_PROGRESS',
          badge: 'Wiring',
          blueprint: {
            id: 'coord-transfer-board',
            title: 'Inter-Facility Transfer Kanban Board',
            role: 'REFERRAL_COORDINATOR',
            status: 'IN_PROGRESS',
            badgeLabel: 'In Progress',
            clinicalPurpose: 'Kanban view organizing transfers: Dispatched -> In-Transit -> Received -> Admitted.',
            targetUsers: 'Referral coordinators',
            technicalSpecs: {
              endpoints: ['GET /api/referrals/transfers', 'PUT /api/referrals/:id/status'],
              models: ['Referral', 'Facility'],
            },
            acceptanceCriteria: [
              'Drag-and-drop or 1-click status transitions',
              'Filter by receiving facility and urgency',
            ],
          },
        },
        {
          id: 'coord-bed-ambulance',
          title: 'Bed & Ambulance Tracking',
          icon: Building2,
          status: 'NEXT_UP',
          badge: 'Next',
          blueprint: {
            id: 'coord-bed-ambulance',
            title: 'Hospital Bed Readiness & Ambulance Dispatch',
            role: 'REFERRAL_COORDINATOR',
            status: 'NEXT_UP',
            badgeLabel: 'Roadmap Sprint 2',
            clinicalPurpose: 'Monitors real-time ICU, CCU, and general bed capacity at District Hospitals to ensure incoming STEMI/trauma patients are routed to facilities with ready beds.',
            targetUsers: 'District health dispatchers',
            technicalSpecs: {
              endpoints: ['GET /api/facilities/capacity'],
              models: ['Facility', 'WardStay'],
            },
            acceptanceCriteria: [
              'Live occupancy percentage per facility',
              'Alerts when receiving hospital is on critical diversion',
            ],
          },
        },
        {
          id: 'coord-timeline',
          title: 'Care Continuity Timeline',
          icon: Clock,
          status: 'NEXT_UP',
          badge: 'Next',
          blueprint: {
            id: 'coord-timeline',
            title: 'Cross-Facility Patient Care Journey',
            role: 'REFERRAL_COORDINATOR',
            status: 'NEXT_UP',
            badgeLabel: 'Roadmap Sprint 2',
            clinicalPurpose: 'Tracks the complete journey of transferred patients across institutions.',
            targetUsers: 'Referral coordinators',
            technicalSpecs: {
              endpoints: ['GET /api/patients/:id/timeline'],
              models: ['AuditEvent', 'Referral'],
            },
            acceptanceCriteria: [
              'Full multi-institution event chain',
            ],
          },
        },
        {
          id: 'coord-followup-scheduler',
          title: 'Follow-Up Scheduler',
          icon: CalendarCheck,
          status: 'NEXT_UP',
          badge: 'Next',
          blueprint: {
            id: 'coord-followup-scheduler',
            title: 'Closed-Loop Post-Discharge Follow-Up Scheduler',
            role: 'REFERRAL_COORDINATOR',
            status: 'NEXT_UP',
            badgeLabel: 'Roadmap Sprint 2',
            clinicalPurpose: 'Schedules post-discharge appointments, coordinates ASHA home visits, and tracks follow-up completion.',
            targetUsers: 'Coordinators and community health teams',
            technicalSpecs: {
              endpoints: ['GET /api/follow-ups/due', 'POST /api/follow-ups'],
              models: ['FollowUp', 'Patient'],
            },
            acceptanceCriteria: [
              'Auto-assigns follow-up task to originating PHC doctor',
            ],
          },
        },
      ],
    },

    ADMIN: {
      key: 'ADMIN',
      shortLabel: 'ADMIN',
      fullTitle: 'District Health Officer & System Admin',
      sectionHeader: 'GOVERNANCE & COMPLIANCE WORKFLOW',
      items: [
        {
          id: 'admin-dashboard',
          title: 'Governance Dashboard',
          route: '/admin',
          icon: LayoutGrid,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'admin-dashboard',
            title: 'District Governance & Compliance Cockpit',
            role: 'ADMIN',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'High-level dashboard monitoring district-wide referral volume, sync gateway uptime, compliance audit health, and role management.',
            targetUsers: 'District Health Officers and system administrators',
            technicalSpecs: {
              endpoints: ['GET /api/facilities', 'GET /api/test/admin-only'],
              models: ['Facility', 'User', 'AuditEvent'],
            },
            acceptanceCriteria: [
              'Full administrative access across all district records',
            ],
          },
        },
        {
          id: 'admin-audit-trail',
          title: 'Immutable Clinical Audit Log',
          route: '/admin',
          icon: Layers,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'admin-audit-trail',
            title: 'Immutable Append-Only Clinical Audit Trail',
            role: 'ADMIN',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'Provides complete tamper-evident traceability for every referral creation, sync event, identity confirmation, and clinical override.',
            targetUsers: 'Chief Medical Officers and compliance auditors',
            safetyRule: 'Append-Only Audit Trail: Every clinical state change generates an immutable cryptographic audit record.',
            technicalSpecs: {
              endpoints: ['GET /api/audit/events'],
              models: ['AuditEvent'],
            },
            acceptanceCriteria: [
              'Searchable by actor ID, patient ID, event type, or facility',
              'Read-only interface preventing any tampering or record deletion',
            ],
          },
        },
        {
          id: 'admin-facilities',
          title: 'Healthcare Facilities Directory',
          route: '/admin',
          icon: Building2,
          status: 'IN_PROGRESS',
          badge: 'Wiring',
          blueprint: {
            id: 'admin-facilities',
            title: 'District Healthcare Facilities Registry',
            role: 'ADMIN',
            status: 'IN_PROGRESS',
            badgeLabel: 'In Progress',
            clinicalPurpose: 'Registers and manages PHCs, Community Health Centres, District Hospitals, and private specialty clinics.',
            targetUsers: 'District Health Officers',
            technicalSpecs: {
              endpoints: ['GET /api/facilities', 'POST /api/facilities'],
              models: ['Facility'],
            },
            acceptanceCriteria: [
              'Directory of facilities with district, contact numbers, and type tags',
            ],
          },
        },
        {
          id: 'admin-staff-rbac',
          title: 'Staff & Role Permissions',
          route: '/admin',
          icon: Key,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'admin-staff-rbac',
            title: 'Role-Based Access Control & Credentialing',
            role: 'ADMIN',
            status: 'BUILT',
            badgeLabel: 'Active in Production',
            clinicalPurpose: 'Manages doctor accounts, password policies, JWT sessions, and role permissions across all clinical endpoints.',
            targetUsers: 'System administrators',
            technicalSpecs: {
              endpoints: ['GET /api/test/rbac', 'POST /api/auth/register'],
              models: ['User', 'UserRole'],
            },
            acceptanceCriteria: [
              'Enforces role boundaries with HTTP 403 blocks on unauthorized routes',
            ],
          },
        },
        {
          id: 'admin-analytics',
          title: 'Outbreak Analytics & Trends',
          icon: BarChart3,
          status: 'PLANNED',
          badge: 'Roadmap',
          blueprint: {
            id: 'admin-analytics',
            title: 'District Epidemiological Outbreak Analytics',
            role: 'ADMIN',
            status: 'PLANNED',
            badgeLabel: 'Roadmap Phase 3',
            clinicalPurpose: 'Aggregates referral complaints across PHCs to detect disease clusters (Dengue, Cholera) or acute cardiac spikes in specific villages.',
            targetUsers: 'District Health Officers, state epidemiologists',
            technicalSpecs: {
              endpoints: ['GET /api/analytics/referral-trends'],
              models: ['Referral', 'Patient', 'Facility'],
            },
            acceptanceCriteria: [
              'Spatial syndrome heatmap by village and PHC catchment area',
            ],
          },
        },
        {
          id: 'admin-diagnostics',
          title: 'Sync Gateway Diagnostics',
          route: '/admin',
          icon: Activity,
          status: 'BUILT',
          badge: 'Built',
          blueprint: {
            id: 'admin-diagnostics',
            title: 'Sync Gateway & Offline Network Diagnostics',
            role: 'ADMIN',
            status: 'BUILT',
            badgeLabel: 'Active',
            clinicalPurpose: 'Monitors health and throughput of the offline synchronization gateway (/api/sync/events).',
            targetUsers: 'System engineers and IT administrators',
            technicalSpecs: {
              endpoints: ['GET /api/sync/status', 'GET /api/health'],
              models: ['SyncEvent'],
            },
            acceptanceCriteria: [
              'Displays synced events count and failed sync events requiring review',
            ],
          },
        },
      ],
    },
  };

  const currentConfig = roleConfigs[activeRole] || roleConfigs.PHC_USER;

  const handleNavClick = (item: NavItem) => {
    if (item.status === 'BUILT' && item.route) {
      navigate(item.route);
    } else {
      setActiveBlueprint(item.blueprint);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <aside
        className={`bg-white border-r border-slate-200 h-screen flex flex-col transition-all duration-300 z-40 select-none shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top Header: Brand Logo & Title */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                    SwasthyaSetu
                  </span>
                  <span className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1 py-0.2 rounded uppercase">
                    EHR
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase block mt-1 truncate">
                  CLINICAL HEALTH PORTAL
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Section Heading (Matches Reference Screenshot) */}
        {!isCollapsed && (
          <div className="px-6 pt-5 pb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {currentConfig.sectionHeader}
            </span>
          </div>
        )}

        {/* Navigation Item List for Current Role */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          {currentConfig.items.filter((item) => item.status === 'BUILT').map((item) => {
            const isActive = item.route && location.pathname === item.route;
            const Icon = item.icon;
            const isBuilt = item.status === 'BUILT';

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                title={isCollapsed ? `${item.title} (${item.badge || item.status})` : undefined}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-left text-xs transition-all cursor-pointer group relative ${
                  isActive
                    ? 'bg-teal-50/80 text-teal-700 font-semibold border-l-4 border-teal-600 rounded-l-xs shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className={`flex items-center space-x-3 min-w-0 ${isCollapsed ? 'mx-auto' : ''}`}>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-teal-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />

                  {!isCollapsed && (
                    <span className="truncate">{item.title}</span>
                  )}
                </div>

                {/* Status Dot / Pill Indicator */}
                {!isCollapsed && (
                  <div className="shrink-0 ml-2 flex items-center space-x-1.5">
                    {isBuilt ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Active & Built" />
                    ) : (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          item.status === 'IN_PROGRESS'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {item.badge || 'Next'}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: System Status Card & Sign Out Button (Exact Match to Screenshot) */}
        <div className="p-3 border-t border-slate-100 space-y-2.5">
          {/* Status Box */}
          {!isCollapsed && (
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px] font-medium">Sync Engine</span>
                <span className="inline-flex items-center space-x-1.5 text-emerald-700 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Operational</span>
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500 text-[11px] font-medium">Storage</span>
                <span className="font-semibold text-teal-700 font-mono text-[10px]">
                  PostgreSQL + Dexie
                </span>
              </div>
            </div>
          )}

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-2xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer ${
              isCollapsed ? 'px-2' : ''
            }`}
            title="Sign Out of Session"
          >
            <LogOut className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Feature Blueprint Specification Modal */}
      <FeatureBlueprintModal
        blueprint={activeBlueprint}
        onClose={() => setActiveBlueprint(null)}
        onStartBuilding={(_bp) => {
          setActiveBlueprint(null);
        }}
      />
    </>
  );
};
