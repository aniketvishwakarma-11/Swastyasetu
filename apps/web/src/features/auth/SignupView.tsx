import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, getDefaultDashboard } from '../../context/AuthContext';
import { UserRole, Facility, SEED_FACILITIES } from '@swastyasetu/shared';
import { apiRequest } from '../../lib/api';
import { Activity, Lock, Mail, User, Building2, AlertCircle, ArrowRight } from 'lucide-react';

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
        const fallback = SEED_FACILITIES.map((f, i) => ({
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
    <div className="min-h-[85vh] flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white mb-3 shadow-md shadow-teal-600/20">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Healthcare Staff Account</h1>
          <p className="text-xs text-slate-500 mt-1">
            Register your role in the SwasthyaSetu continuity network
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
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
                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold shadow-xs'
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
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold shadow-xs'
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
  );
};
