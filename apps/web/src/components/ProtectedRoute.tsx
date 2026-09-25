import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, getDefaultDashboard } from '../context/AuthContext';
import { UserRole } from '@swastyasetu/shared';
import { Activity } from 'lucide-react';

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
    // Seamlessly navigate authenticated clinician to their authorized dashboard instead of 403 screen
    return <Navigate to={getDefaultDashboard(user.role)} replace />;
  }

  return <>{children}</>;
};
