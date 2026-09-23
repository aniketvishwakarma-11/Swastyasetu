import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getDefaultDashboard } from '../../context/AuthContext';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  GitFork,
  Globe2,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  Wifi,
} from 'lucide-react';

const demoRoles = [
  { email: 'phc_doctor@swastyasetu.gov.in', role: 'PHC_USER', name: 'Dr. Rajesh Sharma', facility: 'PHC Khed', icon: Stethoscope, tone: 'teal' },
  { email: 'hospital_doctor@swastyasetu.gov.in', role: 'CLINICIAN', name: 'Dr. Priya Deshmukh', facility: 'Aundh District Hospital', icon: Building2, tone: 'sky' },
  { email: 'coordinator@swastyasetu.gov.in', role: 'REFERRAL_COORDINATOR', name: 'Vikram Solanki', facility: 'Aundh District Hospital', icon: GitFork, tone: 'amber' },
  { email: 'admin@swastyasetu.gov.in', role: 'ADMIN', name: 'System Admin', facility: 'District Network', icon: ShieldCheck, tone: 'slate' },
] as const;

export const LoginView: React.FC = () => {
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !isLoading) navigate(getDefaultDashboard(user.role), { replace: true });
  }, [user, isLoading, navigate]);

  const authenticate = async (loginEmail: string, loginPassword: string, role?: string) => {
    setEmail(loginEmail);
    setPassword(loginPassword);
    setErrorMessage(null);
    setIsSubmitting(true);
    const result = await login(loginEmail, loginPassword);
    setIsSubmitting(false);
    if (result.success) navigate(role ? getDefaultDashboard(role as any) : '/');
    else setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await authenticate(email, password);
  };

  return (
    <div className="min-h-[calc(100vh-68px)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,78,74,0.10)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-teal-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-teal-800/70" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full border border-teal-800/60" />
          <div className="relative clinical-enter">
            <div className="mb-12 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-400 text-teal-950"><Activity className="h-6 w-6" /></div>
              <div><p className="text-lg font-bold tracking-tight">SwasthyaSetu</p><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-teal-200">Clinical continuity</p></div>
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">District health network</p>
            <h1 className="max-w-md text-4xl font-semibold leading-[1.08] tracking-tight">The right patient story, at the right point of care.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-teal-100/75">A dependable workspace for referrals, identity review, documents, and follow-up across every care handoff.</p>
          </div>
          <div className="relative space-y-3 clinical-enter-delay">
            <div className="flex items-center gap-3 rounded-2xl border border-teal-800/80 bg-teal-900/60 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300"><Wifi className="h-4 w-4" /></div>
              <div><p className="text-sm font-semibold">Continuity stays online</p><p className="mt-0.5 text-xs text-teal-200/65">Offline work queues safely and syncs when ready.</p></div>
              <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {['Referral', 'Review', 'Follow-up'].map((label, index) => <div key={label} className="rounded-xl border border-teal-800/70 bg-teal-900/40 px-2 py-3"><p className="text-xs font-bold text-teal-300">0{index + 1}</p><p className="mt-1 text-[11px] text-teal-100/70">{label}</p></div>)}
            </div>
          </div>
        </aside>

        <main className="p-6 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md clinical-enter-delay">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 lg:hidden"><Activity className="h-5 w-5" /></div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Secure staff access</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Welcome back.</h2>
                <p className="mt-2 text-sm text-slate-500">Sign in to continue your clinical workspace.</p>
              </div>
              <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 sm:flex"><CheckCircle2 className="h-3.5 w-3.5" /> Secure</div>
            </div>

            {errorMessage && <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /><span>{errorMessage}</span></div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700">Staff email</label><div className="relative"><Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="doctor@swastyasetu.gov.in" className="w-full rounded-xl border border-slate-300 bg-slate-50/60 py-3 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-500/10" /></div></div>
              <div><div className="mb-2 flex items-center justify-between"><label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Password</label><span className="text-[11px] text-slate-400">Protected session</span></div><div className="relative"><Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="w-full rounded-xl border border-slate-300 bg-slate-50/60 py-3 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-500/10" /></div></div>
              <button type="submit" disabled={isSubmitting} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/15 transition-all hover:bg-teal-700 disabled:cursor-wait disabled:opacity-60"><span>{isSubmitting ? 'Signing you in...' : 'Continue to workspace'}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></button>
            </form>

            <div className="my-7 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">or use a demo role</span><div className="h-px flex-1 bg-slate-200" /></div>
            <div className="space-y-2">
              {demoRoles.map(({ email: demoEmail, role, name, facility, icon: Icon, tone }) => {
                const toneClass =
                  tone === 'teal'
                    ? 'border-teal-200 bg-teal-50/50 text-teal-700 hover:border-teal-300 hover:bg-teal-50'
                    : tone === 'sky'
                    ? 'border-sky-200 bg-sky-50/50 text-sky-700 hover:border-sky-300 hover:bg-sky-50'
                    : tone === 'amber'
                    ? 'border-amber-200 bg-amber-50/50 text-amber-800 hover:border-amber-300 hover:bg-amber-50'
                    : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-slate-100';
                return <button key={role} type="button" onClick={() => authenticate(demoEmail, 'password123', role)} disabled={isSubmitting} className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all disabled:opacity-60 ${toneClass}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-black/5"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-slate-800">{name}</span><span className="mt-0.5 block truncate text-[11px] text-slate-500">{facility} · {role}</span></span><ArrowRight className="h-4 w-4 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" /></button>;
              })}
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 text-xs text-slate-500"><span className="flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5 text-teal-600" /> District network access</span><Link to="/signup" className="font-semibold text-teal-700 hover:text-teal-800">Create staff account</Link></div>
          </div>
        </main>
      </div>
    </div>
  );
};