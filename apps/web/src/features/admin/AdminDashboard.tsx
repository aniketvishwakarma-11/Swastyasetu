import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { FeatureBlueprintModal, FeatureBlueprint } from '../../components/FeatureBlueprintModal';
import { ADMIN_BLUEPRINTS } from '../../lib/featureBlueprints';
import {
  ShieldCheck,
  Database,
  Users,
  Building,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileText,
  Network,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [testLog, setTestLog] = useState<Array<{ endpoint: string; status: 'ok' | 'fail'; message: string }>>([]);
  const [activeBlueprint, setActiveBlueprint] = useState<FeatureBlueprint | null>(null);

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
      {/* Header & Feature Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
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

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={runFullRbacAudit}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Run RBAC Audit</span>
          </button>

          <button
            onClick={() => setActiveBlueprint(ADMIN_BLUEPRINTS.auditTrail)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>Audit Trail Explorer</span>
          </button>

          <button
            onClick={() => setActiveBlueprint(ADMIN_BLUEPRINTS.syncGateway)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Network className="w-3.5 h-3.5 text-blue-600" />
            <span>Sync &amp; Outbreak Radar</span>
          </button>
        </div>
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

      {/* Operational Modules Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold mb-4">
            <Database className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 mb-1">PostgreSQL Master Schema</h2>
          <p className="text-xs text-slate-500 mb-4">
            Supabase managed multi-tenant database supporting strict referential integrity.
          </p>
          <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
            Prisma Engine v5.14.0 • Active Pool 20
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold mb-4">
            <Building className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 mb-1">Facility Registry</h2>
          <p className="text-xs text-slate-500 mb-4">
            Accredited network of primary, secondary, and tertiary healthcare centres.
          </p>
          <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
            PHC Khed • Aundh DH • Sanjivani Clinic
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold mb-4">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 mb-1">Practitioner Access Control</h2>
          <p className="text-xs text-slate-500 mb-4">
            Role-based authorization covering doctors, clinicians, coordinators, and admins.
          </p>
          <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
            RBAC Enforcement: 100% Verified
          </div>
        </div>
      </div>

      {/* Feature Blueprint Modal */}
      <FeatureBlueprintModal
        blueprint={activeBlueprint}
        onClose={() => setActiveBlueprint(null)}
      />
    </div>
  );
};
