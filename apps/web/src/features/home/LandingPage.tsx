import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import {
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Send,
  Stethoscope,
  Building,
  Network,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  UserCheck,
  MessageSquare,
  ClipboardList,
  ArrowRight,
  LogIn,
  Server,
} from 'lucide-react';

// ─── Status badge ─────────────────────────────────────────────────────────────
type StatusBadge = 'live' | 'dev';

const Badge: React.FC<{ status: StatusBadge }> = ({ status }) =>
  status === 'live' ? (
    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      <span>Live in Demo</span>
    </span>
  ) : (
    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
      <span>In Development</span>
    </span>
  );

// ─── Static PHC dashboard illustration ───────────────────────────────────────
// Pure static JSX — no auth, no API, no IndexedDB.
const DashboardIllustration: React.FC = () => (
  <div
    className="bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-lg select-none pointer-events-none"
    aria-hidden="true"
    role="img"
  >
    {/* Browser chrome */}
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center space-x-2">
      <div className="flex space-x-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
      </div>
      <div className="flex-1 bg-slate-100 rounded text-[10px] text-slate-400 font-mono px-2 py-0.5 ml-2 truncate">
        swasthyasetu.app/phc
      </div>
      <div className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-700 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>ONLINE</span>
      </div>
    </div>

    {/* Simulated navbar */}
    <div className="bg-white border-b border-slate-100 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center">
          <Activity className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-bold text-slate-900">SwasthyaSetu</span>
        <span className="text-[9px] text-teal-700 bg-teal-50 border border-teal-200 rounded px-1 hidden sm:inline">Continuity Layer</span>
      </div>
      <div className="flex items-center space-x-1.5 text-[9px]">
        <span className="text-slate-500">Dr. Rajesh Sharma</span>
        <span className="bg-teal-50 text-teal-700 border border-teal-200 rounded px-1 font-bold">PHC_USER</span>
      </div>
    </div>

    {/* Dashboard body */}
    <div className="bg-slate-50 p-3 space-y-2">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <div className="text-[9px] text-slate-400 mb-0.5">Good morning, Dr. Rajesh Sharma</div>
        <div className="text-xs font-bold text-slate-900">PHC Referral &amp; Continuity Dashboard</div>
        <div className="text-[9px] text-slate-500 mt-0.5">Track referrals and continue patient handoffs — even with weak connectivity.</div>
        <div className="flex space-x-1 mt-2">
          <span className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[9px] text-slate-600 flex items-center space-x-1">
            <Building className="w-2 h-2" />
            <span>PHC Khed</span>
          </span>
          <span className="bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5 text-[9px] text-teal-700 font-bold">PHC_USER</span>
        </div>
      </div>

      {/* Workflow strip */}
      <div className="bg-white rounded-xl border border-slate-200 px-3 py-2">
        <div className="text-[8px] text-slate-400 uppercase tracking-wider mb-1.5">Patient Care Pathway</div>
        <div className="flex items-center">
          {['PHC', 'Referral', 'Hospital', 'Consult', 'Discharge'].map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${i < 2 ? 'bg-teal-500 border-teal-500' : 'bg-slate-50 border-slate-200'}`}>
                  {i < 2
                    ? <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                    : <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  }
                </div>
                <span className={`text-[7px] mt-0.5 font-medium ${i < 2 ? 'text-teal-700' : 'text-slate-300'}`}>{s}</span>
              </div>
              {i < 4 && <div className={`h-px w-4 mx-0.5 ${i < 1 ? 'bg-teal-400' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl border border-slate-200 p-2.5">
          <div className="flex items-center space-x-1 mb-1.5">
            <Send className="w-3 h-3 text-teal-600" />
            <span className="text-[9px] font-bold text-slate-800">Create Referral</span>
          </div>
          <p className="text-[8px] text-slate-500 mb-2">Generate digital referral. Works offline.</p>
          <div className="w-full bg-teal-600 rounded-lg py-1 text-center text-[8px] font-semibold text-white">Launch Form →</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1">
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span className="text-[9px] font-bold text-emerald-800">Online</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-lg font-extrabold text-slate-800 leading-none mb-0.5">0</div>
          <div className="text-[8px] text-slate-500 mb-1.5">pending on this device</div>
          <div className="w-full bg-white border border-emerald-300 rounded-lg py-1 text-center text-[8px] font-semibold text-emerald-700">Force Sync Queue</div>
        </div>
      </div>

      {/* Demo scenario */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-1">
            <FileText className="w-3 h-3 text-purple-600" />
            <span className="text-[9px] font-bold text-slate-800">Demo Scenario</span>
          </div>
          <span className="text-[8px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5 uppercase">Demo</span>
        </div>
        <div className="grid grid-cols-2 gap-1 mb-1.5 text-[8px]">
          <div className="bg-slate-50 rounded px-1.5 py-1">
            <div className="text-slate-400 text-[7px]">Patient</div>
            <div className="font-semibold text-slate-700">Ramesh Yadav, 47, M</div>
          </div>
          <div className="bg-slate-50 rounded px-1.5 py-1">
            <div className="text-slate-400 text-[7px]">Urgency</div>
            <div className="font-semibold text-rose-600">EMERGENCY</div>
          </div>
        </div>
        <div className="w-full bg-purple-50 border border-purple-200 rounded-lg py-1 text-center text-[8px] font-semibold text-purple-700">Load Demo Patient</div>
      </div>
    </div>
  </div>
);

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section: React.FC<{ id?: string; className?: string; children: React.ReactNode }> = ({
  id,
  className = '',
  children,
}) => (
  <section id={id} className={`py-16 sm:py-20 ${className}`}>
    <div className="max-w-5xl mx-auto px-4 sm:px-6">{children}</div>
  </section>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] font-bold text-teal-700 uppercase tracking-widest mb-3">{children}</div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug mb-4">{children}</h2>
);

// ─── Landing page ─────────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => (
  <div className="bg-white text-slate-900">
    <PublicHeader />

    {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
    <section className="bg-white pt-12 pb-20 border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center space-x-2 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" aria-hidden="true" />
              <span>Offline-first healthcare continuity</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-5">
              Healthcare continuity<br />
              <span className="text-teal-600">that survives weak</span><br />
              connectivity.
            </h1>

            <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-md">
              SwasthyaSetu is an offline-first continuity layer connecting PHCs
              and district hospitals. Referrals are saved on the device and sync
              automatically when connectivity returns.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Open Demo Application</span>
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 hover:border-teal-300 transition-colors"
              >
                <span>Create Staff Account</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <p className="text-xs text-slate-400 mt-4">
              One-click demo logins available at the sign-in screen. No credentials required.
            </p>
          </div>

          {/* Right: static illustration */}
          <div className="lg:pl-4">
            <DashboardIllustration />
            <p className="text-center text-[11px] text-slate-400 mt-3">
              PHC Referral &amp; Continuity Dashboard — actual application UI
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* ── 2. PROBLEM → SOLUTION ──────────────────────────────────────────── */}
    <Section className="bg-slate-50 border-b border-slate-100">
      <SectionLabel>Problem</SectionLabel>
      <SectionTitle>A connectivity interruption shouldn't break a referral.</SectionTitle>
      <p className="text-slate-600 text-sm leading-relaxed max-w-2xl mb-10">
        When a patient moves from a PHC to a district hospital, digital referral
        workflows that depend on continuous internet access fail at the exact moment
        continuity matters most.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          {
            icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
            title: 'The Lost Referral',
            body: 'Paper referrals are lost, damaged, or arrive after the patient. Digital systems that require constant connectivity fail in the same way.',
            color: 'border-rose-100 bg-rose-50/50',
          },
          {
            icon: <FileText className="w-4 h-4 text-amber-600" />,
            title: 'The Unreadable Discharge',
            body: 'Handwritten discharge summaries with abbreviations and poor scans leave receiving clinicians without usable structured information.',
            color: 'border-amber-100 bg-amber-50/50',
          },
          {
            icon: <UserCheck className="w-4 h-4 text-blue-600" />,
            title: 'The Identity Gap',
            body: 'Patients are recorded differently at every facility. Without a reconciliation step, duplicate or confused records accumulate silently.',
            color: 'border-blue-100 bg-blue-50/50',
          },
        ].map(({ icon, title, body, color }) => (
          <div key={title} className={`rounded-2xl border p-5 ${color}`}>
            <div className="mb-2">{icon}</div>
            <h3 className="text-sm font-bold text-slate-800 mb-1.5">{title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-teal-200 p-6">
        <div className="text-[11px] font-bold text-teal-700 uppercase tracking-widest mb-1">
          Solution
        </div>
        <p className="text-sm font-semibold text-slate-800 mb-4">
          SwasthyaSetu keeps the referral workflow usable during connectivity loss by
          allowing referral data to remain safely queued locally and synchronized when
          connectivity returns.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
          {/* Only items that are genuinely present in the current codebase */}
          {[
            'Saving digital referrals locally when connectivity is unavailable',
            'Surfacing real-time connectivity status in every session',
            'Providing a sync queue that holds pending referrals safely on the device',
            'Role-based access so each facility type sees only its own workflow',
          ].map((item) => (
            <div key={item} className="flex items-start space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>

    {/* ── 3. HOW IT WORKS ──────────────────────────────────────────────────── */}
    <Section id="how-it-works" className="bg-teal-50/40 border-b border-slate-100">
      <SectionLabel>How It Works</SectionLabel>
      <SectionTitle>Referrals keep moving when the connection doesn't.</SectionTitle>
      <p className="text-slate-600 text-base leading-relaxed max-w-2xl mb-10">
        At a PHC, a digital referral is saved in the local queue if the connection
        drops. When connectivity returns, the pending referral can sync so the handoff
        can continue.
      </p>

      {/* Desktop: horizontal flex row with arrow connectors.
          Mobile: vertical stack with gap between cards. */}
      <div id="offline-first" className="flex flex-col lg:flex-row lg:items-stretch gap-4 lg:gap-0">
        {[
          {
            num: 1,
            title: 'Create referral',
            body: 'PHC staff fill in the digital referral.',
          },
          {
            num: 2,
            title: 'Save on the device',
            body: 'Stored in the local queue, even offline.',
          },
          {
            num: 3,
            title: 'Wait safely',
            body: 'Shown as pending until a connection is available.',
          },
          {
            num: 4,
            title: 'Sync when online',
            body: 'The queue syncs and the referral moves on.',
          },
        ].map((step, i) => (
          <React.Fragment key={step.num}>
            {/* Card — grows equally on desktop */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
              {/* Teal numbered badge */}
              <div
                className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm font-bold mb-4 shrink-0"
                aria-hidden="true"
              >
                {step.num}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed flex-1">{step.body}</p>
            </div>

            {/* Arrow connector — visible only on desktop */}
            {i < 3 && (
              <div
                className="hidden lg:flex items-center justify-center px-2 shrink-0"
                aria-hidden="true"
              >
                <ArrowRight className="w-4 h-4 text-teal-400" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </Section>

    {/* ── 4. CAPABILITIES ──────────────────────────────────────────────── */}
    <Section id="capabilities" className="bg-slate-50 border-b border-slate-100">
      <SectionLabel>Capabilities</SectionLabel>
      <SectionTitle>What is built, and what is coming.</SectionTitle>
      <p className="text-slate-500 text-sm mb-10 max-w-2xl leading-relaxed">
        Every capability shows its current implementation status. <strong className="text-slate-700">Live in Demo</strong> means
        demonstrably working in the current repository. <strong className="text-slate-700">In Development</strong> means
        specified and planned but not yet fully implemented.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            icon: <Send className="w-4 h-4 text-teal-600" />,
            title: 'Digital Referral Creation',
            body: 'PHC staff create structured referrals with patient details, urgency, destination facility, and clinical summary.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <WifiOff className="w-4 h-4 text-amber-600" />,
            title: 'Offline-First Persistence',
            body: 'Referrals and sync events are stored in IndexedDB via Dexie.js. Data survives page refresh and browser close.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <Wifi className="w-4 h-4 text-sky-600" />,
            title: 'Connectivity Awareness',
            body: 'navigator.onLine events surface the current network state in the PHC dashboard. The pending queue count updates accordingly.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <ShieldCheck className="w-4 h-4 text-teal-600" />,
            title: 'Role-Based Access Control',
            body: 'JWT RBAC enforces permissions for PHC_USER, CLINICIAN, REFERRAL_COORDINATOR, and ADMIN across all API endpoints.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <Server className="w-4 h-4 text-teal-600" />,
            title: 'PostgreSQL Backend',
            body: 'Relational storage for patients, referrals, facilities, and audit events. Prisma ORM for type-safe schema and queries.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <RefreshCw className="w-4 h-4 text-slate-500" />,
            title: 'Idempotent Sync Engine',
            body: 'Queued events replay when connectivity returns. Server deduplication by event_id prevents duplicate submissions.',
            badge: 'dev' as StatusBadge,
          },
          {
            icon: <MessageSquare className="w-4 h-4 text-purple-600" />,
            title: 'SMS Fallback',
            body: 'A compact ≤160-character referral payload for SMS delivery when internet is completely unavailable. Simulated gateway; real-provider adapter planned.',
            badge: 'dev' as StatusBadge,
          },
          {
            icon: <UserCheck className="w-4 h-4 text-blue-600" />,
            title: 'Fuzzy Identity Reconciliation',
            body: 'Multi-field weighted matching for incoming patients. Clinician confirmation required — no silent record merging.',
            badge: 'dev' as StatusBadge,
          },
          {
            icon: <FileText className="w-4 h-4 text-slate-500" />,
            title: 'Clinical Document OCR',
            body: 'Upload prescription images or discharge slips. Pipeline: image preprocessing → OCR → entity extraction → normalization.',
            badge: 'dev' as StatusBadge,
          },
          {
            icon: <CheckCircle2 className="w-4 h-4 text-slate-500" />,
            title: 'Field-Level Confidence',
            body: 'Every extracted clinical field carries a confidence score. Fields below 90% are flagged for clinician review before saving.',
            badge: 'dev' as StatusBadge,
          },
          {
            icon: <ClipboardList className="w-4 h-4 text-slate-500" />,
            title: 'Continuity Timeline',
            body: 'Patient care journey from referral creation through discharge and follow-up, rendered as a provider-visible timeline.',
            badge: 'dev' as StatusBadge,
          },
          {
            icon: <Clock className="w-4 h-4 text-slate-500" />,
            title: 'Audit Trail',
            body: 'Every lifecycle event writes an immutable record with timestamp, actor, facility, and event type.',
            badge: 'dev' as StatusBadge,
          },
        ].map(({ icon, title, body, badge }) => (
          <div key={title} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                {icon}
              </div>
              <Badge status={badge} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1.5">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed flex-1">{body}</p>
          </div>
        ))}
      </div>
    </Section>

    {/* ── 5. ROLES ─────────────────────────────────────────────────────── */}
    <Section id="roles" className="bg-white border-b border-slate-100">
      <SectionLabel>Roles</SectionLabel>
      <SectionTitle>Who uses SwasthyaSetu.</SectionTitle>
      <p className="text-slate-500 text-sm mb-10 max-w-xl leading-relaxed">
        Four roles are implemented and testable in the demo. Each has its own
        protected dashboard and RBAC-enforced access controls.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <Stethoscope className="w-5 h-5 text-teal-700" />,
            role: 'PHC_USER',
            title: 'PHC Health Worker',
            color: 'border-teal-200 bg-teal-50',
            iconBg: 'bg-teal-100',
            description:
              'Creates digital referrals, monitors the local sync queue, and continues working during connectivity loss.',
          },
          {
            icon: <Building className="w-5 h-5 text-purple-700" />,
            role: 'CLINICIAN',
            title: 'District Hospital Clinician',
            color: 'border-purple-200 bg-purple-50',
            iconBg: 'bg-purple-100',
            description:
              'Receives incoming referrals at the hospital dashboard. Identity reconciliation and discharge document review are in development for this role.',
          },
          {
            icon: <Network className="w-5 h-5 text-blue-700" />,
            role: 'REFERRAL_COORDINATOR',
            title: 'Referral Coordinator',
            color: 'border-blue-200 bg-blue-50',
            iconBg: 'bg-blue-100',
            description:
              'Monitors inter-facility transfer status and tracks active patients moving between PHC and district hospital.',
          },
          {
            icon: <ShieldCheck className="w-5 h-5 text-slate-700" />,
            role: 'ADMIN',
            title: 'System Administrator',
            color: 'border-slate-200 bg-slate-50',
            iconBg: 'bg-slate-100',
            description:
              'Full system access — manages facilities, staff accounts, and runs RBAC security audits across all endpoints.',
          },
        ].map(({ icon, role, title, color, iconBg, description }) => (
          <div key={role} className={`rounded-2xl border p-5 ${color}`}>
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
              {icon}
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{role}</div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </Section>

    {/* ── 6. FINAL CTA ─────────────────────────────────────────────────── */}
    <section className="bg-teal-700 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto">
          <div className="text-[11px] font-bold text-teal-200 uppercase tracking-widest mb-4">
            Try the working demo
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            See a referral survive<br className="hidden sm:inline" /> a dropped connection.
          </h2>
          <p className="text-teal-100 text-sm leading-relaxed mb-6 max-w-md mx-auto">
            Log in as a PHC user, create a digital referral, go offline, and
            watch it wait safely on the device until you're back online.
          </p>

          {/* 3-point bullets — only items genuinely implemented */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8 text-sm font-medium text-white">
            {[
              'Referral saved on the device',
              'Pending queue while offline',
              'Visible connectivity status',
            ].map((item) => (
              <div key={item} className="flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
            <Link
              to="/login"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-white hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-700 text-teal-700 font-bold text-sm rounded-xl shadow-sm transition-colors w-full sm:w-auto"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Open Demo Application</span>
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-transparent hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-700 text-white font-semibold text-sm rounded-xl border border-teal-400 hover:border-teal-300 transition-colors w-full sm:w-auto"
            >
              <span>Create Staff Account</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <p className="text-teal-300 text-xs">
            Demo mode uses sample data only. No real patient information.
          </p>
        </div>
      </div>
    </section>

    {/* ── 7. FOOTER ────────────────────────────────────────────────────── */}
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">

          {/* Column 1 — Brand */}
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-3 group cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center group-hover:bg-teal-700 transition-colors">
                <Activity className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-sm font-bold text-white">SwasthyaSetu</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Healthcare continuity that survives weak connectivity.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              An offline-first continuity layer connecting PHCs and district hospitals.
            </p>
          </div>

          {/* Column 2 — Explore */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Explore</h3>
            <ul className="space-y-2.5 text-xs">
              {[
                { label: 'How it works', href: '#how-it-works' },
                { label: 'Offline-first', href: '#offline-first' },
                { label: 'Capabilities', href: '#capabilities' },
                { label: 'Roles', href: '#roles' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-slate-400 hover:text-white focus:outline-none focus:underline hover:underline transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Access */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Access</h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  to="/login"
                  className="text-slate-400 hover:text-white focus:outline-none focus:underline hover:underline transition-colors"
                >
                  Open demo
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-slate-400 hover:text-white focus:outline-none focus:underline hover:underline transition-colors"
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="text-slate-400 hover:text-white focus:outline-none focus:underline hover:underline transition-colors"
                >
                  Create staff account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>© 2026 SwasthyaSetu</span>
          <span>Demo build. Sample data only. Not for clinical use.</span>
        </div>
      </div>
    </footer>
  </div>
);
