import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Network, CheckCircle2, AlertCircle, ArrowRightLeft, Clock } from 'lucide-react';

export const CoordinatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'success' | 'error' | null>(null);

  const testCoordinatorRbac = async () => {
    setTestResult('Testing RBAC access against /api/test/coordinator-only...');
    const res = await apiRequest('/test/coordinator-only');
    if (res.success) {
      setTestStatus('success');
      setTestResult(res.message || 'RBAC Access Granted: Verified as REFERRAL_COORDINATOR!');
    } else {
      setTestStatus('error');
      setTestResult(res.error?.message || 'Access Denied');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">Inter-Facility Referral Board</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Triage & Coordination Staff: <span className="font-semibold text-slate-700">{user?.name}</span>
            </p>
          </div>
        </div>

        <button
          onClick={testCoordinatorRbac}
          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors border border-blue-200"
        >
          Verify Coordinator RBAC
        </button>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start space-x-3 ${
            testStatus === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {testStatus === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold mb-0.5">RBAC Middleware Response:</div>
            <div>{testResult}</div>
          </div>
        </div>
      )}

      {/* Transfer Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-3">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Queued / Pending Transfers</span>
          </h2>
          <div className="text-2xl font-extrabold text-slate-900 mb-1">2</div>
          <p className="text-xs text-slate-500">Transfers awaiting bed availability</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-3">
            <ArrowRightLeft className="w-4 h-4 text-teal-600" />
            <span>Active En-Route Patients</span>
          </h2>
          <div className="text-2xl font-extrabold text-slate-900 mb-1">1</div>
          <p className="text-xs text-slate-500">Ramesh Yadav (PHC Khed → Aundh)</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Completed Handoffs</span>
          </h2>
          <div className="text-2xl font-extrabold text-slate-900 mb-1">14</div>
          <p className="text-xs text-slate-500">Care continuity closed loops</p>
        </div>
      </div>
    </div>
  );
};
