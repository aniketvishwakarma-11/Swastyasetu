import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, getDefaultDashboard } from '../../context/AuthContext';
import { UserRole, Facility, SEED_FACILITIES } from '@swastyasetu/shared';
import { apiRequest } from '../../lib/api';
import { Activity, Lock, Mail, User, Building2, AlertCircle, ArrowRight, ShieldCheck, Wifi } from 'lucide-react';

export const SignupView: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('PHC_USER');
  const [facilityId, setFacilityId] = useState<string>('');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadFacilities() {
      const res = await apiRequest<Facility[]>('/facilities');
      if (res.success && res.data && res.data.length > 0) {
        setFacilities(res.data);
        setFacilityId(res.data[0].id);
      } else {
        // Fallback to seeded demo facilities if server is offline
        const fallback = SEED_FACILITIES.map((f: any, i: number) => ({
          ...f,
          id: `00000000-0000-0000-0000-00000000000${i + 1}`,
        }));
        setFacilities(fallback);
        setFacilityId(fallback[0].id);
      }
    }

    loadFacilities();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const result = await signup({
      name,
      email,
      password,
      role,
      facilityId: facilityId || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      navigate(getDefaultDashboard(role));
    } else {
      setErrorMessage(result.error || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-68px)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,78,74,0.10)] lg:grid-cols-[0.78fr_1.22fr]">
        <aside className="relative hidden overflow-hidden bg-teal-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-teal-800/70" />
          <div className="relative">
            <div className="mb-12 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-400 text-teal-950"><Activity className="h-6 w-6" /></div><div><p className="text-lg font-bold">SwasthyaSetu</p><p className="text-[11px] uppercase tracking-[0.18em] text-teal-200">Clinical continuity</p></div></div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Staff onboarding</p>
            <h1 className="max-w-sm text-4xl font-semibold leading-[1.08] tracking-tight">Join the district care network.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-teal-100/75">Create a role-aware workspace for safer referrals, clear handoffs, and dependable continuity.</p>
          </div>
          <div className="relative space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-teal-800/80 bg-teal-900/60 p-4"><ShieldCheck className="h-5 w-5 text-emerald-300" /><div><p className="text-sm font-semibold">Role-based by design</p><p className="mt-0.5 text-xs text-teal-200/65">Your workspace follows your clinical responsibility.</p></div></div>
            <div className="flex items-center gap-3 rounded-2xl border border-teal-800/80 bg-teal-900/60 p-4"><Wifi className="h-5 w-5 text-teal-300" /><div><p className="text-sm font-semibold">Ready for the field</p><p className="mt-0.5 text-xs text-teal-200/65">Continue safely through weak connectivity.</p></div></div>
          </div>
        </aside>

        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-lg">
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 text-teal-700 mb-3 lg:hidden">
                <Activity className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Secure staff onboarding</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950 tracking-tight">Create your workspace.</h1>
              <p className="text-xs text-slate-500 mt-1">
                Register your role in the SwasthyaSetu continuity network
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Anand Patel"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anand.patel@swastyasetu.gov.in"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Healthcare Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('PHC_USER')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    role === 'PHC_USER'
                      ? 'border-teal-600 bg-teal-50/70 text-teal-900 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-semibold">PHC Doctor / Worker</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Referral creation & offline queue</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('CLINICIAN')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    role === 'CLINICIAN'
                      ? 'border-sky-600 bg-sky-50/70 text-sky-900 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-semibold">Hospital Clinician</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Triage, identity & document review</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('REFERRAL_COORDINATOR')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    role === 'REFERRAL_COORDINATOR'
                      ? 'border-teal-600 bg-teal-50/70 text-teal-900 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-semibold">Referral Coordinator</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Inter-facility transfers</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    role === 'ADMIN'
                      ? 'border-slate-700 bg-slate-100 text-slate-900 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-semibold">Administrator</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Full audit & facility control</div>
                </button>
              </div>
            </div>

            {/* Facility Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned Healthcare Facility
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.code} - {fac.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50 mt-4"
            >
              <span>{isSubmitting ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer link to Login */}
          <div className="text-center mt-6 text-xs text-slate-500">
            Already have an active account?{' '}
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
