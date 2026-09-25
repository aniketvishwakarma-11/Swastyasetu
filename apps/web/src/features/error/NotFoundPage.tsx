import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle,
  Home,
  ArrowLeft,
  PhoneCall,
  Building,
  Radio,
} from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getRoleLandingRoute = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'PHC_USER':
        return '/phc';
      case 'CLINICIAN':
        return '/hospital';
      case 'REFERRAL_COORDINATOR':
        return '/triage';
      case 'ADMIN':
        return '/admin';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full text-center space-y-6">
        {/* Visual 404 Badge */}
        <div className="relative mx-auto w-24 h-24 rounded-3xl bg-teal-50 border-2 border-teal-200 flex items-center justify-center shadow-lg">
          <AlertTriangle className="w-12 h-12 text-teal-600 animate-pulse" />
          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
            404
          </span>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Clinical Route Not Located
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            The page or clinical registry resource you are searching for does not exist, has expired, or requires higher cryptographic permissions.
          </p>
        </div>

        {/* Live System Diagnostics Pill */}
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>Central Gateway: Operational • Offline Dexie.js Cache Active</span>
        </div>

        {/* Actions Grid */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Go Back</span>
          </button>

          <Link
            to={getRoleLandingRoute()}
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to {user ? 'Your Dashboard' : 'Home'}</span>
          </Link>
        </div>

        {/* Emergency Assistance Footer */}
        <div className="pt-8 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center space-x-1.5 text-rose-700 font-semibold">
            <PhoneCall className="w-4 h-4" />
            <span>108 Ambulance Hotline (24/7 Emergency)</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="flex items-center space-x-1.5 text-slate-600">
            <Building className="w-4 h-4 text-slate-400" />
            <span>Pune District Health Command Desk</span>
          </div>
        </div>
      </div>
    </div>
  );
};
