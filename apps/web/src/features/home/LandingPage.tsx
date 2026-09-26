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
// Balanced, proportional preview mockup — readable typography, compact vertical height.
const DashboardIllustration: React.FC = () => (
  <div
    className="bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-lg select-none"
    aria-hidden="true"
    role="img"
  >
    {/* Browser chrome bar */}
    <div className="bg-white border-b border-slate-200 px-3.5 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="bg-slate-100 rounded text-[11px] text-slate-500 font-mono px-2.5 py-0.5 ml-1.5 truncate">
          https://swasthyasetu.gov.in/phc
        </div>
      </div>
      <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>ONLINE</span>
      </div>
    </div>

    {/* Simulated app header */}
    <div className="bg-white border-b border-slate-100 px-3.5 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 rounded-md bg-teal-600 flex items-center justify-center">
          <Activity className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-bold text-slate-900">SwasthyaSetu</span>
        <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.2 hidden sm:inline font-semibold">
          Continuity Layer
        </span>
      </div>
      <div className="flex items-center space-x-1.5 text-[11px]">
        <span className="text-slate-600 font-medium">Dr. Rajesh Sharma</span>
        <span className="bg-teal-50 text-teal-700 border border-teal-200 rounded px-1.5 py-0.2 font-bold text-[10px]">
          PHC_USER
        </span>
      </div>
    </div>

    {/* Dashboard body */}
    <div className="bg-slate-50 p-3 space-y-2.5">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] text-slate-400">Primary Health Centre Khed (PHC-KHED)</div>
            <div className="text-xs sm:text-sm font-bold text-slate-900">Referral &amp; Patient Continuity</div>
          </div>
          <span className="bg-teal-50 text-teal-700 border border-teal-200 rounded px-1.5 py-0.5 text-[10px] font-bold">
            Staff Portal
          </span>
        </div>
      </div>

      {/* Pathway strip */}
      <div className="bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-2xs">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Care Pathway</div>
        <div className="flex items-center justify-between">
          {[
            { name: 'Intake', done: true },
            { name: 'Referral', done: true },
            { name: 'Triage', done: false },
            { name: 'Consult', done: false },
            { name: 'OCR', done: false },
          ].map((step, i) => (
            <React.Fragment key={step.name}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    step.done ? 'bg-teal-600 border-teal-600 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  )}
                </div>
                <span className={`text-[9px] mt-0.5 font-semibold ${step.done ? 'text-teal-700' : 'text-slate-400'}`}>
                  {step.name}
                </span>
              </div>
              {i < 4 && <div className={`flex-1 h-0.5 mx-1.5 ${i < 1 ? 'bg-teal-400' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Action cards row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <Send className="w-3 h-3 text-teal-600" />
              <span className="text-[11px] font-bold text-slate-800">New Referral</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-2 leading-tight">Digital handoff. Works offline.</p>
          </div>
          <div className="w-full bg-teal-600 rounded-md py-1 text-center text-[10px] font-bold text-white shadow-2xs">
            Create Form →
          </div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1">
                <Wifi className="w-3 h-3 text-emerald-600" />
                <span className="text-[11px] font-bold text-emerald-800">Local Queue</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-base font-extrabold text-slate-800 leading-none mb-1">0 pending</div>
          </div>
          <div className="w-full bg-white border border-emerald-300 rounded-md py-1 text-center text-[10px] font-bold text-emerald-700 shadow-2xs">
            Synced with Hospital
          </div>
        </div>
      </div>

      {/* Active referral card preview */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-1">
            <FileText className="w-3 h-3 text-teal-600" />
            <span className="text-[11px] font-bold text-slate-800">Recent Outbound Record</span>
          </div>
          <span className="text-[9px] font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.2 uppercase">
            Dispatched
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] mb-2">
          <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
            <span className="text-slate-400 block text-[8px] uppercase font-semibold">Patient</span>
            <span className="font-bold text-slate-700 truncate block">Anand Joshi, 52</span>
          </div>
          <div className="bg-rose-50/60 rounded p-1.5 border border-rose-100">
            <span className="text-rose-400 block text-[8px] uppercase font-semibold">Urgency</span>
            <span className="font-bold text-rose-700 truncate block">EMERGENCY (STEMI)</span>
          </div>
        </div>
        <div className="w-full bg-slate-50 border border-slate-200 rounded-md py-1 text-center text-[10px] font-bold text-slate-700">
          Inbound to District Hospital
        </div>
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
  <section id={id} className={`scroll-mt-16 sm:scroll-mt-20 py-14 sm:py-18 ${className}`}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
  </section>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-2.5">{children}</div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug mb-3.5">{children}</h2>
);

// ─── Landing page ─────────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => (
  <div className="bg-white text-slate-900 pt-16">
    <PublicHeader />

    {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
    <section className="border-b border-slate-100 bg-white pb-14 pt-6 sm:pb-16 sm:pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:flex-row sm:items-center sm:px-5">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" /> District continuity network <span className="text-slate-300">/</span> Demo environment</div>
          <div className="flex items-center gap-4 text-slate-400"><span>Sample data only</span><span className="text-emerald-700">System ready</span></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

          {/* Left: copy */}
          <div className="lg:col-span-6 xl:col-span-6">
            <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-3 py-1 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" aria-hidden="true" />
              <span>Offline-first healthcare continuity</span>
            </div>

            <h1 className="text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-4xl lg:text-[44px]">
              Healthcare continuity<br />
              <span className="text-teal-600">that survives weak</span><br />
              connectivity.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 max-w-md">
              SwasthyaSetu is an offline-first continuity layer connecting PHCs
              and district hospitals. Referrals are saved safely on the device and sync
              automatically when connectivity returns.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <Link
                to="/login"
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Open Demo Application</span>
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 hover:border-teal-300 transition-colors cursor-pointer"
              >
                <span>Create Staff Account</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              One-click demo logins available at the sign-in screen. No credentials required.
            </p>

            <div className="mt-8 grid max-w-md grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50/70 py-3">
              <div className="px-3"><p className="text-lg font-bold text-slate-900">4</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Care roles</p></div>
              <div className="px-3"><p className="text-lg font-bold text-slate-900">24/7</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Queue ready</p></div>
              <div className="px-3"><p className="text-lg font-bold text-slate-900">100%</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Auditable</p></div>
            </div>
          </div>

          {/* Right: static illustration */}
          <div className="lg:col-span-6 xl:col-span-6">
            <DashboardIllustration />
            <div className="mt-3 flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><span>Live workspace preview</span><span className="flex items-center gap-1.5 text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ready for handoff</span></div>
            <p className="mt-2 text-center text-[11px] font-medium text-slate-400">
              PHC Referral &amp; Continuity Dashboard — actual application UI
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* ── 2. PROBLEM → SOLUTION ──────────────────────────────────────────── */}
    <Section className="bg-slate-50 border-b border-slate-100">
      <SectionLabel>Problem &amp; Challenge</SectionLabel>
      <SectionTitle>A connectivity interruption shouldn't break a referral.</SectionTitle>
      <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mb-8">
        When a patient moves from a PHC to a district hospital, digital referral
        workflows that depend on continuous internet access fail at the exact moment
        continuity matters most.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
            title: 'The Lost Referral',
            body: 'Paper referrals are lost, damaged, or arrive after the patient. Digital systems that require constant connectivity fail in the same way.',
            color: 'border-rose-100 bg-rose-50/50',
          },
          {
            icon: <FileText className="w-5 h-5 text-amber-600" />,
            title: 'The Unreadable Discharge',
            body: 'Handwritten discharge summaries with abbreviations and poor scans leave receiving clinicians without usable structured information.',
            color: 'border-amber-100 bg-amber-50/50',
          },
          {
            icon: <UserCheck className="w-5 h-5 text-blue-600" />,
            title: 'The Identity Gap',
            body: 'Patients are recorded differently at every facility. Without a reconciliation step, duplicate or confused records accumulate silently.',
            color: 'border-blue-100 bg-blue-50/50',
          },
        ].map(({ icon, title, body, color }) => (
          <div key={title} className={`rounded-xl border p-5 ${color} shadow-2xs`}>
            <div className="mb-2">{icon}</div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-teal-200 p-6 sm:p-7 shadow-xs">
        <div className="text-[11px] font-bold text-teal-700 uppercase tracking-widest mb-1.5">
          Solution Architecture
        </div>
        <p className="text-sm sm:text-base font-bold text-slate-900 mb-4">
          SwasthyaSetu keeps the referral workflow usable during connectivity loss by
          allowing referral data to remain safely queued locally and synchronized when
          connectivity returns.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700">
          {[
            'Saving digital referrals locally when connectivity is unavailable',
            'Surfacing real-time connectivity status in every session',
            'Providing a sync queue that holds pending referrals safely on the device',
            'Role-based access so each facility type sees only its own workflow',
          ].map((item) => (
            <div key={item} className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" aria-hidden="true" />
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
      <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mb-8">
        At a PHC, a digital referral is saved in the local queue if the connection
        drops. When connectivity returns, the pending referral can sync so the handoff
        can continue.
      </p>

      {/* Sequential cards */}
      <div id="offline-first" className="flex flex-col lg:flex-row lg:items-stretch gap-4 lg:gap-0">
        {[
          {
            num: 1,
            title: 'Create referral',
            body: 'PHC staff fill in the digital referral with vitals, urgency, and medical notes.',
          },
          {
            num: 2,
            title: 'Save on device',
            body: 'Stored in the local Dexie.js IndexedDB queue, even during complete network loss.',
          },
          {
            num: 3,
            title: 'Wait safely',
            body: 'Shown as pending with automatic retry timers until an internet connection is restored.',
          },
          {
            num: 4,
            title: 'Sync when online',
            body: 'The queue syncs with server-side deduplication (event_id) and the referral moves on.',
          },
        ].map((step, i) => (
          <React.Fragment key={step.num}>
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col shadow-xs">
              <div
                className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center text-sm font-bold mb-3 shrink-0 shadow-2xs"
                aria-hidden="true"
              >
                {step.num}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">{step.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed flex-1">{step.body}</p>
            </div>

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
      <p className="text-slate-600 text-sm mb-8 max-w-2xl leading-relaxed">
        Every capability shows its current implementation status. <strong className="text-slate-800">Live in Demo</strong> means
        demonstrably working in the current repository. <strong className="text-slate-800">In Development</strong> means
        specified on the engineering roadmap.
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
            body: 'Real-time network listeners surface connectivity in every session. The pending queue count updates accordingly.',
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
            icon: <RefreshCw className="w-4 h-4 text-emerald-600" />,
            title: 'Idempotent Sync Engine',
            body: 'Queued events replay when connectivity returns. Server deduplication by event_id prevents duplicate submissions.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <MessageSquare className="w-4 h-4 text-amber-600" />,
            title: 'SMS Fallback',
            body: 'A compact ≤160-character referral payload for SMS delivery when internet is completely unavailable. Gateway adapter planned.',
            badge: 'dev' as StatusBadge,
          },
          {
            icon: <UserCheck className="w-4 h-4 text-teal-600" />,
            title: 'Fuzzy Identity Reconciliation',
            body: 'Multi-field weighted matching for incoming patients. Clinician confirmation required — no silent record merging.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <FileText className="w-4 h-4 text-teal-600" />,
            title: 'Clinical Document OCR',
            body: 'Upload prescription images or discharge slips. Powered by Hugging Face TrOCR with split-screen clinician review & local storage.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <CheckCircle2 className="w-4 h-4 text-teal-600" />,
            title: 'Field-Level Confidence',
            body: 'Every extracted clinical field carries a confidence score. Fields below 90% are flagged for clinician review before saving.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <ClipboardList className="w-4 h-4 text-slate-500" />,
            title: 'Continuity Timeline',
            body: 'Patient care journey from referral creation through discharge and follow-up, rendered as a provider-visible timeline.',
            badge: 'dev' as StatusBadge,
          },
          {
            icon: <Clock className="w-4 h-4 text-emerald-600" />,
            title: 'Audit Trail',
            body: 'Every lifecycle event writes an immutable record with timestamp, actor, facility, and event type.',
            badge: 'live' as StatusBadge,
          },
        ].map(({ icon, title, body, badge }) => (
          <div key={title} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                {icon}
              </div>
              <Badge status={badge} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed flex-1">{body}</p>
          </div>
        ))}
      </div>
    </Section>

    {/* ── 5. ROLES ─────────────────────────────────────────────────────── */}
    <Section id="roles" className="bg-white border-b border-slate-100">
      <SectionLabel>Roles</SectionLabel>
      <SectionTitle>Who uses SwasthyaSetu.</SectionTitle>
      <p className="text-slate-600 text-sm mb-8 max-w-xl leading-relaxed">
        Four clinical and administrative roles are implemented and testable in the demo. Each has its own
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
            icon: <Building className="w-5 h-5 text-sky-700" />,
            role: 'CLINICIAN',
            title: 'District Hospital Clinician',
            color: 'border-sky-200 bg-sky-50',
            iconBg: 'bg-sky-100',
            description:
              'Receives incoming referrals, confirms patient identity reconciliation, and reviews AI TrOCR discharge summaries.',
          },
          {
            icon: <Activity className="w-5 h-5 text-sky-700" />,
            role: 'REFERRAL_COORDINATOR',
            title: 'Triage Coordinator',
            color: 'border-sky-200 bg-sky-50',
            iconBg: 'bg-sky-100',
            description:
              'Monitors district-wide patient referrals, bed capacity, ambulance routing, and clinical prioritization.',
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
          <div key={role} className={`rounded-xl border p-5 ${color} shadow-2xs`}>
            <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
              {icon}
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{role}</div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </Section>

    {/* ── 6. FINAL CTA ─────────────────────────────────────────────────── */}
    <section className="bg-teal-700 py-14 sm:py-18">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto">
          <div className="text-[11px] font-bold text-teal-200 uppercase tracking-widest mb-3">
            Try the working demo
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            See a referral survive<br className="hidden sm:inline" /> a dropped connection.
          </h2>
          <p className="text-teal-100 text-sm leading-relaxed mb-6 max-w-md mx-auto">
            Log in as a PHC user, create a digital referral, go offline, and
            watch it wait safely on the device until you're back online.
          </p>

          {/* 3-point bullets */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8 text-sm font-medium text-white">
            {[
              'Referral saved on device',
              'Pending queue while offline',
              'Visible connectivity status',
            ].map((item) => (
              <div key={item} className="flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-5">
            <Link
              to="/login"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-white hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-700 text-teal-700 font-bold text-sm rounded-xl shadow-xs transition-colors w-full sm:w-auto cursor-pointer"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Open Demo Application</span>
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-transparent hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-700 text-white font-semibold text-sm rounded-xl border border-teal-400 hover:border-teal-300 transition-colors w-full sm:w-auto cursor-pointer"
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Column 1 — Brand */}
          <div>
            <Link to="/" className="flex items-center space-x-2.5 mb-3 group cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center group-hover:bg-teal-700 transition-colors">
                <Activity className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">SwasthyaSetu</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Healthcare continuity that survives weak connectivity.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              An offline-first continuity layer connecting rural PHCs and district hospitals across rural health networks.
            </p>
          </div>

          {/* Column 2 — Explore */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Continuity Architecture</h3>
            <ul className="space-y-2 text-xs">
              {[
                { label: 'How it works', href: '#how-it-works' },
                { label: 'Dexie.js Offline Sync', href: '#offline-first' },
                { label: 'AI Document OCR', href: '#capabilities' },
                { label: 'Role-Based Portals', href: '#roles' },
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

          {/* Column 3 — Access & Legal */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Access &amp; Compliance</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/login"
                  className="text-slate-400 hover:text-white focus:outline-none focus:underline hover:underline transition-colors"
                >
                  Clinical Staff Log in
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="text-slate-400 hover:text-white focus:outline-none focus:underline hover:underline transition-colors"
                >
                  Create Staff Account
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-teal-400 hover:text-teal-300 focus:outline-none focus:underline hover:underline transition-colors"
                >
                  Privacy Policy (DPDP 2023)
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-teal-400 hover:text-teal-300 focus:outline-none focus:underline hover:underline transition-colors"
                >
                  Terms &amp; Clinical Protocols
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 — Official Facility & Emergency Contact */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">District Authority</h3>
            <address className="not-italic text-xs text-slate-400 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-slate-300">District Health Office (DHO)</p>
              <p>Public Health Department, Maharashtra</p>
              <p>Aundh District Hospital Campus, Pune — 411027</p>
              <p className="text-teal-400 pt-1 font-semibold">Emergency Dial: 108 (24/7)</p>
              <p className="text-slate-400">Health Advice: Toll-Free 104</p>
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>© 2026 SwasthyaSetu Rural Healthcare Continuity Project • Government of Maharashtra</span>
          <div className="flex items-center space-x-3">
            <Link to="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Demo Environment
            </span>
          </div>
        </div>
      </div>
    </footer>
  </div>
);
