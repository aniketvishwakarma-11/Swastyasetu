import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, getDefaultDashboard } from '../../context/AuthContext';
import { Activity, Lock, Mail, AlertCircle, ArrowRight, Stethoscope, Building, ShieldCheck } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !isLoading) {
      navigate(getDefaultDashboard(user.role), { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      // Re-fetch user from context or redirect to root where router picks default dashboard
      navigate('/');
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  // Quick Demo Login Handler
  const handleQuickLogin = async (demoEmail: string, demoRole: any) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMessage(null);
    setIsSubmitting(true);

    const result = await login(demoEmail, 'password123');
    setIsSubmitting(false);

    if (result.success) {
      navigate(getDefaultDashboard(demoRole));
    } else {
      setErrorMessage(result.error || 'Demo login failed.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white mb-3 shadow-md shadow-teal-600/20">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to SwasthyaSetu</h1>
          <p className="text-xs text-slate-500 mt-1">
            Offline-first healthcare continuity and referral intelligence
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@swastyasetu.gov.in"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In with Password'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Google OAuth Login Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={async () => {
                const { supabase } = await import('../../lib/supabaseClient');
                await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/`,
                  },
                });
              }}
              className="w-full flex items-center justify-center space-x-2.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl border border-slate-300 shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Quick Demo Logins */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              One-Click Demo Roles (For Evaluation)
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('phc_doctor@swastyasetu.gov.in', 'PHC_USER')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-teal-100 bg-teal-50/50 hover:bg-teal-50 text-left transition-colors group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                    <Stethoscope className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Dr. Rajesh Sharma</div>
                    <div className="text-[10px] text-slate-500">PHC Khed • PHC_USER</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-teal-700 group-hover:translate-x-0.5 transition-transform">
                  Login →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('hospital_doctor@swastyasetu.gov.in', 'CLINICIAN')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 text-left transition-colors group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                    <Building className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Dr. Priya Deshmukh</div>
                    <div className="text-[10px] text-slate-500">District Hospital • CLINICIAN</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-purple-700 group-hover:translate-x-0.5 transition-transform">
                  Login →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@swastyasetu.gov.in', 'ADMIN')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">System Admin</div>
                    <div className="text-[10px] text-slate-500">Full System Access • ADMIN</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:translate-x-0.5 transition-transform">
                  Login →
                </span>
              </button>
            </div>
          </div>

          {/* Footer link to Register */}
          <div className="text-center mt-6 text-xs text-slate-500">
            Don't have a staff account?{' '}
            <Link to="/signup" className="text-teal-600 font-semibold hover:underline">
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
