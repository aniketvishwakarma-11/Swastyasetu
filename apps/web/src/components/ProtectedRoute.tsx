import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth, getDefaultDashboard } from '../context/AuthContext';
import { UserRole } from '@swastyasetu/shared';
import { ShieldAlert, ArrowRight, Activity } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm animate-pulse">
            <Activity className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm font-medium text-slate-600">Verifying healthcare session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-slate-50 p-6">
        <div className="clinical-surface w-full max-w-md rounded-[24px] border-rose-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 text-rose-600 mb-4 border border-rose-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied (403 Forbidden)</h2>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            This healthcare resource requires one of the following roles:{' '}
            <span className="font-semibold text-slate-800">{allowedRoles.join(', ')}</span>.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 mb-6 text-left">
            <div><span className="font-semibold text-slate-700">Your Account:</span> {user.name}</div>
            <div><span className="font-semibold text-slate-700">Your Active Role:</span> <span className="text-amber-700 font-bold">{user.role}</span></div>
          </div>
          <Link
            to={getDefaultDashboard(user.role)}
            className="inline-flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
          >
            <span>Go to Your Authorized Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
