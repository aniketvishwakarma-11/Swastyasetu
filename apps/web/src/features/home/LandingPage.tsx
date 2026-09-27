import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import {
  Activity,
  WifiOff,
  RefreshCw,
  Send,
  Stethoscope,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  ClipboardList,
  ArrowRight,
  LogIn,
  HeartPulse,
  Ambulance,
  Sparkles,
  Database,
} from 'lucide-react';

// ─── Status badge ─────────────────────────────────────────────────────────────
type StatusBadge = 'live' | 'pilot';

const Badge: React.FC<{ status: StatusBadge }> = ({ status }) =>
  status === 'live' ? (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200/80 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" aria-hidden="true" />
      <span>Operational</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200/80 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" aria-hidden="true" />
      <span>Phase II Rollout</span>
    </span>
  );

// ─── High-Fidelity Clinical Telemetry & Handoff Console (Hero Graphic) ─────────
const ClinicalTelemetryConsole: React.FC = () => (
  <div className="relative group">
    {/* Ambient Glow */}
    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-teal-500/20 via-sky-500/15 to-emerald-500/20 blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />

    <div className="relative rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden">
      {/* Console Top Bar */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Live Patient Transfer
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-500">
          <span className="bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-[10px] font-semibold text-teal-700">
            Offline Ready
          </span>
          <span className="hidden sm:inline text-slate-400">Connected</span>
        </div>
      </div>

      {/* Main Card Content */}
      <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50">
        {/* Referral Route Header */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Referral Route
            </div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <span>PHC Khed (Rural)</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
              <span>Aundh District Hospital</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              EMERGENCY • STEMI
            </span>
          </div>
        </div>

        {/* Patient & Golden Hour Vitals Banner */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Ramesh Yadav, 48 M</h4>
              <p className="text-[11px] text-slate-500 font-mono">
                ABHA ID: 91-4820-1928-01 • Ref #RF-2026-0921-01
              </p>
            </div>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/80 rounded-md px-2 py-1">
              Golden Hour Protocol
            </span>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-rose-50/70 border border-rose-100 rounded-lg p-2">
              <span className="block text-[10px] font-semibold text-rose-600 uppercase">SpO2 (Pulse Ox)</span>
              <span className="text-base font-extrabold text-rose-700 font-mono">91%</span>
              <span className="block text-[9px] text-rose-500">4L O2 mask</span>
            </div>
            <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-2">
              <span className="block text-[10px] font-semibold text-amber-700 uppercase">Blood Pressure</span>
              <span className="text-base font-extrabold text-amber-800 font-mono">160/100</span>
              <span className="block text-[9px] text-amber-600">Stage II HTN</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <span className="block text-[10px] font-semibold text-slate-500 uppercase">Heart Rate</span>
              <span className="text-base font-extrabold text-slate-800 font-mono">112 bpm</span>
              <span className="block text-[9px] text-slate-500">Sinus Tachy</span>
            </div>
            <div className="bg-teal-50/70 border border-teal-100 rounded-lg p-2">
              <span className="block text-[10px] font-semibold text-teal-700 uppercase">Pre-Rx Loading</span>
              <span className="text-xs font-bold text-teal-800 block mt-1">DAPT Given</span>
              <span className="block text-[9px] text-teal-600">ASA+Clopidogrel</span>
            </div>
          </div>
        </div>

        {/* Dynamic Progression Path */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] mb-2 font-medium">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              Care Continuum Pathway
            </span>
            <span className="text-teal-700 font-semibold flex items-center gap-1">
              <Ambulance className="w-3.5 h-3.5 text-teal-600" />
              108 En Route (ETA 14 min)
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow-xs font-bold">
                ✓
              </div>
              <span className="text-[10px] font-bold text-slate-800 mt-1">Intake</span>
              <span className="text-[9px] text-emerald-600">Saved offline</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow-xs font-bold">
                ✓
              </div>
              <span className="text-[10px] font-bold text-slate-800 mt-1">Referral</span>
              <span className="text-[9px] text-emerald-600">Dispatched</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs shadow-xs font-bold animate-pulse">
                ⚡
              </div>
              <span className="text-[10px] font-bold text-teal-700 mt-1">Ambulance</span>
              <span className="text-[9px] text-teal-600">Live Telemetry</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 text-slate-400 flex items-center justify-center text-xs font-bold">
                4
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-1">Cath Lab</span>
              <span className="text-[9px] text-slate-400">Bed reserved</span>
            </div>
          </div>
        </div>

        {/* Bottom Verification Strip */}
        <div className="flex items-center justify-between text-[11px] text-slate-600 bg-teal-50/70 border border-teal-200/80 rounded-xl px-3 py-2">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span className="font-semibold text-teal-900">Encrypted On-Device Buffer</span>
          </div>
          <span className="text-slate-500 font-mono text-[10px]">Zero Record Loss Guarantee</span>
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
  <section id={id} className={`py-16 sm:py-20 scroll-mt-24 ${className}`}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
  </section>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 uppercase tracking-widest bg-teal-50 border border-teal-200/80 rounded-full px-3 py-1 mb-3">
    <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
    <span>{children}</span>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-4 font-display">
    {children}
  </h2>
);

// ─── Landing page ─────────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => (
  <div className="bg-white text-slate-900 pt-16">
    <PublicHeader />

    {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
    <section className="relative overflow-hidden border-b border-slate-100 bg-white pb-16 pt-6 sm:pb-20 sm:pt-8">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-teal-100/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 -z-10 h-96 w-96 rounded-full bg-sky-100/30 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* District Network Official Banner */}
        <div className="mb-8 flex flex-col justify-between gap-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/90 px-4 py-2.5 text-[11px] font-semibold text-slate-600 sm:flex-row sm:items-center sm:px-5 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
            <span className="font-bold text-slate-900">MAHARASHTRA DISTRICT HEALTH MISSION</span>
            <span className="text-slate-300">•</span>
            <span>Rural Healthcare Continuity Grid</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px]">
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold">
              DEMO PILOT SANDBOX
            </span>
            <span className="text-teal-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              SYSTEM OPERATIONAL
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left: Headline & Actions */}
          <div className="lg:col-span-6 xl:col-span-6">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 rounded-full px-3 py-1 mb-5">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" aria-hidden="true" />
              <span className="font-bold">Next-Generation Rural Referral Architecture</span>
            </div>

            <h1 className="text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-4xl lg:text-[46px] font-display">
              Healthcare continuity <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-teal-500">
                that survives zero
              </span> <br />
              connectivity.
            </h1>

            <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-lg">
              When a critical patient is transferred from a rural Primary Health Centre to a district hospital,
              a dropped cellular signal cannot drop care. SwasthyaSetu guarantees zero record loss with local
              encrypted caching, sub-second sync, and closed-loop follow-up.
            </p>

            {/* CTAs */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-700/20 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Launch Clinical Workspace</span>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200/90 hover:border-slate-300 transition-all duration-200 shadow-xs cursor-pointer"
              >
                <span>Explore Architecture</span>
                <ArrowRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </a>
            </div>

            <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Instant 1-click clinical roles available. No credentials needed for demo presentation.</span>
            </p>

            {/* 3 Metric Pillars */}
            <div className="mt-8 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3 shadow-xs">
              <div className="px-3">
                <p className="text-xl font-extrabold text-slate-900 font-display">0%</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                  Packet Loss
                </p>
                <span className="text-[9px] text-teal-700">Encrypted Edge Store</span>
              </div>
              <div className="px-3">
                <p className="text-xl font-extrabold text-slate-900 font-display">&lt;800ms</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                  2G Gateway Sync
                </p>
                <span className="text-[9px] text-teal-700">Idempotent Replay</span>
              </div>
              <div className="px-3">
                <p className="text-xl font-extrabold text-slate-900 font-display">100%</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                  Auditable
                </p>
                <span className="text-[9px] text-teal-700">ABHA / DISHA Aligned</span>
              </div>
            </div>
          </div>

          {/* Right: High-Fidelity Clinical Telemetry Graphic */}
          <div className="lg:col-span-6 xl:col-span-6">
            <ClinicalTelemetryConsole />
            <div className="mt-3 flex items-center justify-between px-2 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live Golden Hour Handoff Simulation
              </span>
              <span className="text-teal-700 font-medium">Ready for evaluation</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ── 2. PROBLEM → SOLUTION ──────────────────────────────────────────── */}
    <Section className="bg-slate-50/70 border-b border-slate-100">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <SectionLabel>Clinical Reality &amp; Failure Modes</SectionLabel>
        <SectionTitle>A broken network connection must never break patient care.</SectionTitle>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          In rural primary care, internet downtime is not an edge case—it is a daily reality. Traditional cloud-only
          health systems crash exactly when an acute patient is being loaded into an ambulance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[
          {
            icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
            title: 'The Lost Referral Blindspot',
            body: 'Paper referral notes get soaked, mislaid, or reach after the patient. When clinicians receive emergencies without pre-arrival vitals, critical golden minutes vanish.',
            badge: 'Emergency Risk',
            accent: 'border-rose-200 bg-white hover:border-rose-300',
          },
          {
            icon: <FileText className="w-5 h-5 text-amber-600" />,
            title: 'The Unreadable Discharge Gap',
            body: 'Handwritten discharge summaries with non-standard abbreviations and blurred scans leave community PHC doctors guessing prescribed medications and follow-up directives.',
            badge: 'Continuity Failure',
            accent: 'border-amber-200 bg-white hover:border-amber-300',
          },
          {
            icon: <UserCheck className="w-5 h-5 text-sky-600" />,
            title: 'The Silent Identity Disconnect',
            body: 'Patients registered under variations of local names across clinics accumulate split records. Without intelligent fuzzy identity matching, medical histories stay fragmented.',
            badge: 'Identity Fragility',
            accent: 'border-sky-200 bg-white hover:border-sky-300',
          },
        ].map(({ icon, title, body, badge, accent }) => (
          <div
            key={title}
            className={`rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${accent}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                {icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {badge}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2 font-display">{title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      {/* Solution Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-300">
              The SwasthyaSetu Resilience Architecture
            </span>
            <h3 className="text-xl sm:text-2xl font-bold mt-1 text-white font-display">
              Autonomous offline buffers that guarantee clinical data delivery.
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-teal-100/80 leading-relaxed">
              Designed specifically for tier-3 towns and tribal belts where 2G connectivity drops regularly.
              Work continues seamlessly with cryptographic local queuing, instant auto-sync, and assisted AI transcription.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto shrink-0 text-xs text-teal-100">
            <div className="flex items-center gap-2 bg-teal-800/40 border border-teal-700/60 rounded-xl px-3.5 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full Offline Referral Form &amp; Vitals</span>
            </div>
            <div className="flex items-center gap-2 bg-teal-800/40 border border-teal-700/60 rounded-xl px-3.5 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-Time Network Sync Engine</span>
            </div>
            <div className="flex items-center gap-2 bg-teal-800/40 border border-teal-700/60 rounded-xl px-3.5 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Assisted Clinical OCR Transcription</span>
            </div>
            <div className="flex items-center gap-2 bg-teal-800/40 border border-teal-700/60 rounded-xl px-3.5 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Role-Based Statutory Governance</span>
            </div>
          </div>
        </div>
      </div>
    </Section>

    {/* ── 3. HOW IT WORKS ──────────────────────────────────────────────────── */}
    <Section id="how-it-works" className="bg-white border-b border-slate-100">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <SectionLabel>Operational Pipeline</SectionLabel>
        <SectionTitle>How care moves across the continuum.</SectionTitle>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          From first assessment in a rural clinic to specialist intervention in the district hospital,
          SwasthyaSetu creates an uninterrupted digital thread.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            step: '01',
            title: 'Rapid Clinical Intake',
            desc: 'PHC staff capture patient demographics, chief complaints, emergency triage vitals, and pre-referral medication loading.',
            badge: 'Device Local',
            icon: Stethoscope,
          },
          {
            step: '02',
            title: 'Zero-Latency Edge Buffer',
            desc: 'If internet is unavailable, records are immediately saved to an encrypted local queue. Staff never encounter blocking spin screens.',
            badge: 'Guaranteed Store',
            icon: Database,
          },
          {
            step: '03',
            title: 'Auto Gateway Handshake',
            desc: 'The moment 2G or broadband signal flickers back, the synchronization engine safely transmits records with cryptographic deduplication.',
            badge: 'Instant Sync',
            icon: RefreshCw,
          },
          {
            step: '04',
            title: 'Attested Care Continuum',
            desc: 'The receiving district hospital clinician reviews vitals, accepts handoff, conducts treatment, and returns structured discharge follow-ups.',
            badge: 'Closed-Loop',
            icon: CheckCircle2,
          },
        ].map(({ step, title, desc, badge, icon: Icon }) => (
          <div
            key={step}
            className="group relative bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-teal-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black font-mono text-teal-700 bg-teal-50 border border-teal-200/80 rounded-lg px-2.5 py-1">
                STEP {step}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {badge}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-teal-700 mb-3 group-hover:bg-teal-50 group-hover:border-teal-200 transition-colors">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2 font-display">{title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </Section>

    {/* ── 4. CAPABILITIES ──────────────────────────────────────────────── */}
    <Section id="capabilities" className="bg-slate-50/70 border-b border-slate-100">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <SectionLabel>Core Clinical Capabilities</SectionLabel>
          <SectionTitle>Purpose-built for mission-critical health handoffs.</SectionTitle>
          <p className="text-slate-600 text-sm max-w-xl">
            Every feature is engineered to comply with National Health Systems Resource Centre (NHSRC) guidelines
            and ABHA digital health standards.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status="live" />
          <Badge status="pilot" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          {
            icon: <Send className="w-5 h-5 text-teal-700" />,
            title: 'Structured Referral Dispatch',
            body: 'Digital emergency referrals with triage urgency, destination facility selection, preliminary vitals, and ambulance tracking.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <WifiOff className="w-5 h-5 text-teal-700" />,
            title: 'Offline-First Edge Persistence',
            body: 'Referrals, vitals, and stabilization events survive browser restart and battery shutdown through local encrypted storage.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <RefreshCw className="w-5 h-5 text-emerald-700" />,
            title: 'Idempotent Sync Engine',
            body: 'Automated background retry with server-side deduplication keys prevents duplicate patient entry upon reconnection.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <UserCheck className="w-5 h-5 text-teal-700" />,
            title: 'Fuzzy Identity Reconciliation',
            body: 'Intelligent multi-field scoring reconciles misspelled names, ages, and villages against master district registries with clinician confirmation.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <FileText className="w-5 h-5 text-teal-700" />,
            title: 'Assisted Clinical Document OCR',
            body: 'Extracts lab results, prescriptions, and discharge summaries with field-level confidence flagging for clinician sign-off.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <HeartPulse className="w-5 h-5 text-rose-600" />,
            title: 'Rapid Vitals & Early Warning Score',
            body: 'Standardized MEWS calculation flags impending clinical deterioration before ambulance departure.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <Ambulance className="w-5 h-5 text-amber-600" />,
            title: '108 Emergency Transport Slip',
            body: 'Pre-generates ambulance handover documentation ensuring continuous clinical supervision during transit.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <ClipboardList className="w-5 h-5 text-teal-700" />,
            title: 'Closed-Loop Follow-Up Tracker',
            body: 'Schedules and tracks post-discharge patient visits at the originating PHC to eliminate follow-up dropouts.',
            badge: 'live' as StatusBadge,
          },
          {
            icon: <ShieldCheck className="w-5 h-5 text-slate-700" />,
            title: 'Immutable ABHA Audit Ledger',
            body: 'Cryptographically verifies every referral dispatch, triage update, and clinician review with actor identity and timestamp.',
            badge: 'live' as StatusBadge,
          },
        ].map(({ icon, title, body, badge }) => (
          <div
            key={title}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  {icon}
                </div>
                <Badge status={badge} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5 font-display">{title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>

    {/* ── 5. ROLES ─────────────────────────────────────────────────────── */}
    <Section id="roles" className="bg-white border-b border-slate-100">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <SectionLabel>Role-Based Clinical Workspaces</SectionLabel>
        <SectionTitle>Designed for every stakeholder in the referral chain.</SectionTitle>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Four authenticated portals enforce strict clinical boundaries and streamline high-pressure handoffs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            icon: Stethoscope,
            role: 'PHC_USER',
            title: 'Primary Care Doctor',
            badge: 'Rural PHC Khed',
            color: 'border-teal-200 bg-teal-50/40 text-teal-800',
            desc: 'Creates emergency referrals, logs stabilization vitals, and manages offline queues during network blackouts.',
            loginEmail: 'phc_doctor@swastyasetu.gov.in',
          },
          {
            icon: Building2,
            role: 'CLINICIAN',
            title: 'Hospital Specialist',
            badge: 'Aundh District Hospital',
            color: 'border-sky-200 bg-sky-50/40 text-sky-800',
            desc: 'Receives incoming cases, confirms identity match, reviews AI OCR clinical documents, and prepares discharge summaries.',
            loginEmail: 'hospital_doctor@swastyasetu.gov.in',
          },
          {
            icon: Activity,
            role: 'REFERRAL_COORDINATOR',
            title: 'Triage Coordinator',
            badge: 'District Emergency Cell',
            color: 'border-amber-200 bg-amber-50/40 text-amber-800',
            desc: 'Monitors real-time bed capacity, coordinates 108 ambulance handoffs, and resolves transfer bottlenecks.',
            loginEmail: 'coordinator@swastyasetu.gov.in',
          },
          {
            icon: ShieldCheck,
            role: 'ADMIN',
            title: 'System Administrator',
            badge: 'District Health Office',
            color: 'border-slate-200 bg-slate-50/60 text-slate-800',
            desc: 'Audits access security, oversees facility directories, and verifies cryptographic compliance logs.',
            loginEmail: 'admin@swastyasetu.gov.in',
          },
        ].map(({ icon: Icon, role, title, badge, color, desc }) => (
          <div
            key={role}
            className={`rounded-2xl border p-6 flex flex-col justify-between shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${color}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white/80 border border-slate-200 px-2 py-0.5 rounded">
                  {badge}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1 font-display">{title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">{desc}</p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <span>Test {title} Portal</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        ))}
      </div>
    </Section>

    {/* ── 6. FINAL CTA ─────────────────────────────────────────────────── */}
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 py-16 sm:py-20 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-teal-300 bg-teal-800/60 border border-teal-700/80 rounded-full px-3.5 py-1 mb-4">
          <Sparkles className="w-3 h-3 text-teal-300" />
          Interactive Demo Sandbox
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-5 font-display">
          Experience an emergency referral surviving complete signal loss.
        </h2>
        <p className="text-teal-100/90 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-8">
          Launch any clinical workspace, toggle offline simulation, dispatch a critical transfer, and watch the
          idempotent engine seamlessly bridge the care gap when back online.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-white hover:bg-teal-50 text-teal-900 font-bold text-sm rounded-xl shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-teal-700" aria-hidden="true" />
            <span>Launch Evaluation Sandbox</span>
          </Link>
          <Link
            to="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-teal-800/80 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl border border-teal-600 transition-all duration-200 cursor-pointer"
          >
            <span>Register Clinical Staff</span>
            <ArrowRight className="w-4 h-4 text-teal-300" aria-hidden="true" />
          </Link>
        </div>

        <p className="mt-4 text-xs text-teal-300/80">
          Evaluator Mode uses anonymized synthetic clinical records. Zero PII stored.
        </p>
      </div>
    </section>

    {/* ── 7. FOOTER ────────────────────────────────────────────────────── */}
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Column 1 — Brand */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center space-x-2.5 group cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center group-hover:bg-teal-700 transition-colors">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white tracking-tight font-display">
                SwasthyaSetu
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              Resilient offline-first healthcare continuity layer connecting rural Primary Health Centres and District Hospitals.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-teal-400">
              <ShieldCheck className="w-4 h-4" />
              <span>ABHA &amp; DISHA Compliant</span>
            </div>
          </div>

          {/* Column 2 — Architecture */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 font-display">
              Continuity Framework
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  Operational Workflow
                </a>
              </li>
              <li>
                <a href="#capabilities" className="hover:text-white transition-colors">
                  Offline-First Edge Persistence
                </a>
              </li>
              <li>
                <a href="#capabilities" className="hover:text-white transition-colors">
                  Vision AI Document OCR
                </a>
              </li>
              <li>
                <a href="#roles" className="hover:text-white transition-colors">
                  Role-Based Clinical Portals
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 — Access & Legal */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 font-display">
              Clinical Access
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Staff Workspace Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition-colors">
                  Register Facility Account
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Data Protection &amp; Privacy (DPDP 2023)
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Clinical Protocols &amp; Terms
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 — Official Facility & Emergency Contact */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 font-display">
              Public Health Authority
            </h4>
            <address className="not-italic text-xs space-y-1.5 leading-relaxed text-slate-400">
              <p className="font-semibold text-slate-200">District Health Office (DHO)</p>
              <p>Public Health Department, Maharashtra</p>
              <p>Aundh District Hospital Campus, Pune — 411027</p>
              <p className="text-teal-400 font-semibold pt-1">Emergency Dial: 108 (24/7)</p>
              <p className="text-slate-400">Health Advice: Toll-Free 104</p>
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© 2026 SwasthyaSetu Rural Healthcare Continuity Project • Government of Maharashtra</span>
          <div className="flex items-center space-x-3">
            <Link to="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Pilot Live
            </span>
          </div>
        </div>
      </div>
    </footer>
  </div>
);
