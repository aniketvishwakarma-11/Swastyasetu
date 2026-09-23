import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { FeatureBlueprintModal, FeatureBlueprint } from '../../components/FeatureBlueprintModal';
import { COORDINATOR_BLUEPRINTS } from '../../lib/featureBlueprints';
import {
  Network,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Clock,
  Layers,
  Building2,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react';

export const CoordinatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'success' | 'error' | null>(null);
  const [activeBlueprint, setActiveBlueprint] = useState<FeatureBlueprint | null>(null);

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
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Banner & Feature Action Buttons */}
      <div className="clinical-surface flex flex-col justify-between gap-5 rounded-[24px] border-teal-100 p-5 sm:p-6 md:flex-row md:items-center">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">Inter-Facility Referral Board</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Triage &amp; Coordination Staff: <span className="font-semibold text-slate-700">{user?.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={() => setActiveBlueprint(COORDINATOR_BLUEPRINTS.kanban)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Transfer Kanban</span>
          </button>

          <button
            onClick={() => setActiveBlueprint(COORDINATOR_BLUEPRINTS.readiness)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Bed &amp; ICU Readiness</span>
          </button>

          <button
            onClick={() => setActiveBlueprint(COORDINATOR_BLUEPRINTS.ambulanceSlip)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
            <span>108 Transport Slip</span>
          </button>

          <button
            onClick={() => setActiveBlueprint(COORDINATOR_BLUEPRINTS.metrics)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
            <span>Transit Analytics</span>
          </button>

          <button
            onClick={testCoordinatorRbac}
            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-medium transition-colors border border-teal-200"
          >
            Verify RBAC
          </button>
        </div>
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
        <div className="clinical-surface rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-3">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Awaiting Ambulance</span>
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Referrals confirmed by primary medical officer awaiting 108 ambulance dispatch.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
            Queue clear. No pending transfers.
          </div>
        </div>

        <div className="clinical-surface rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-3">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            <span>In-Transit Active Transfers</span>
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Patients currently en-route between PHC centres and secondary/tertiary hospitals.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
            0 active ambulances tracked
          </div>
        </div>

        <div className="clinical-surface rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Completed Handoffs</span>
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Patients admitted at destination facility with confirmed handoff receipt.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
            Handoff registry up-to-date
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
