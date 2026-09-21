import React, { useState, useEffect } from 'react';
import { Stethoscope, Building2, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

export const PHCHeader: React.FC = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState(getGreeting());

  // Refresh greeting if tab stays open across midnight or long idle
  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  const facilityName = user?.facility?.name || 'Primary Health Centre';
  const doctorName = user?.name;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left: icon + title block */}
        <div className="flex items-start space-x-4">
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            {/* Greeting line */}
            <p className="text-xs font-medium text-slate-500 mb-0.5">
              {greeting}{doctorName ? `, ${doctorName}` : ''}
            </p>

            {/* Primary title */}
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              PHC Referral &amp; Continuity Dashboard
            </h1>

            {/* Support copy */}
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Track referrals and continue patient handoffs — even with weak connectivity.
            </p>

            {/* Facility + role badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {user?.facility && (
                <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{facilityName}</span>
                </span>
              )}
              {user?.role && (
                <span className="inline-flex items-center text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded px-2 py-0.5 uppercase tracking-wide">
                  {user.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: local time */}
        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400 self-start pt-1">
          <Clock className="w-3.5 h-3.5" />
          <LiveTime />
        </div>
      </div>
    </div>
  );
};

/** Tiny sub-component that ticks every minute */
const LiveTime: React.FC = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span>
      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      {' · '}
      {now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
    </span>
  );
};
