import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { ShieldCheck, Database, Users, Building, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [testLog, setTestLog] = useState<Array<{ endpoint: string; status: 'ok' | 'fail'; message: string }>>([]);

  const runFullRbacAudit = async () => {
    const endpoints = [
      '/test/phc-only',
      '/test/clinician-only',
      '/test/coordinator-only',
      '/test/admin-only',
    ];

    const results: Array<{ endpoint: string; status: 'ok' | 'fail'; message: string }> = [];

    for (const ep of endpoints) {
      const res = await apiRequest(ep);
      if (res.success) {
        results.push({
          endpoint: ep,
          status: 'ok',
          message: res.message || 'Access granted (Admin privilege)',
        });
      } else {
        results.push({
          endpoint: ep,
          status: 'fail',
          message: res.error?.message || 'Access denied',
        });
      }
    }

    setTestLog(results);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">System Administration Console</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Superuser: <span className="font-semibold text-slate-700">{user?.name}</span> ({user?.email})
            </p>
          </div>
        </div>

        <button
          onClick={runFullRbacAudit}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center space-x-2"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Run RBAC Security Audit</span>
        </button>
      </div>

      {/* RBAC Security Audit Results */}
      {testLog.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4">RBAC Endpoint Security Audit Log</h2>
          <div className="space-y-2">
            {testLog.map((log, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  log.status === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {log.status === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span className="font-mono font-bold">{log.endpoint}</span>
                </div>
                <span className="font-medium">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-2">
            <Database className="w-4 h-4 text-teal-600" />
            <span>Supabase Database</span>
          </h2>
          <div className="text-xs text-emerald-700 font-semibold mb-3 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Connected to ap-southeast-2 Pooler</span>
          </div>
          <p className="text-xs text-slate-500">
            PostgreSQL instance storing users, referrals, documents, and immutable audit events.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-2">
            <Building className="w-4 h-4 text-purple-600" />
            <span>Healthcare Facilities</span>
          </h2>
          <div className="text-2xl font-extrabold text-slate-900 mb-1">3 Active</div>
          <p className="text-xs text-slate-500">
            PHC Khed, Aundh District Hospital, Sanjivani Clinic.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Staff RBAC Profiles</span>
          </h2>
          <div className="text-2xl font-extrabold text-slate-900 mb-1">4 Roles</div>
          <p className="text-xs text-slate-500">
            PHC_USER, CLINICIAN, REFERRAL_COORDINATOR, ADMIN.
          </p>
        </div>
      </div>
    </div>
  );
};
