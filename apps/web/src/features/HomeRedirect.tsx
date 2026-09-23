import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LandingPage } from './home/LandingPage';
import { Activity } from 'lucide-react';

export const HomeRedirect: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center animate-pulse">
            <Activity className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm font-medium text-slate-600">Loading SwasthyaSetu Portal...</p>
        </div>
      </div>
    );
  }

  return <LandingPage />;
};
