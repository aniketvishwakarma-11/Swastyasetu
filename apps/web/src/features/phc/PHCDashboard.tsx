import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Stethoscope, PlusCircle, RefreshCw, Send, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export const PHCDashboard: React.FC = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'success' | 'error' | null>(null);

  const testRbacAccess = async () => {
    setTestResult('Verifying RBAC token against /api/test/phc-only...');
    const res = await apiRequest('/test/phc-only');
    if (res.success) {
      setTestStatus('success');
      setTestResult(res.message || 'RBAC Access Granted: Verified as PHC_USER!');
    } else {
      setTestStatus('error');
      setTestResult(res.error?.message || 'Access Denied');
    }
  };

  const testForbiddenAccess = async () => {
    setTestResult('Attempting to access Admin-only resource /api/test/admin-only...');
    const res = await apiRequest('/test/admin-only');
    if (res.success) {
      setTestStatus('success');
      setTestResult('Unexpected: Access granted');
    } else {
      setTestStatus('error');
      setTestResult(`Correctly Blocked by RBAC: ${res.error?.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">PHC Referral Portal</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Facility: <span className="font-semibold text-slate-700">{user?.facility?.name || 'Primary Health Centre'}</span> • Doctor: {user?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={testRbacAccess}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-300"
          >
            Verify PHC RBAC Access
          </button>
          <button
            onClick={testForbiddenAccess}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium transition-colors border border-rose-200"
          >
            Test Forbidden (Admin) Endpoint
          </button>
        </div>
      </div>

      {/* RBAC Verification Alert */}
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

      {/* Main Operational Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Referral Creator Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <PlusCircle className="w-4 h-4 text-teal-600" />
              <span>Create Digital Referral</span>
            </h2>
            <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Offline Capable
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Generate digital referral for incoming patients. Works seamlessly whether online or offline with automatic sync queue.
          </p>
          <button className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors">
            <Send className="w-3.5 h-3.5" />
            <span>Launch Referral Form</span>
          </button>
        </div>

        {/* Offline Queue Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              <span>Local Offline Queue</span>
            </h2>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              IndexedDB Ready
            </span>
          </div>
          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-3xl font-extrabold text-slate-900">0</span>
            <span className="text-xs text-slate-500">pending sync events</span>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Referrals created during connectivity drops are stored safely in local browser storage.
          </p>
          <button className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Force Sync Queue</span>
          </button>
        </div>

        {/* Demo Scenario Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Demo Scenario</span>
            </h2>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Ramesh Yadav
            </span>
          </div>
          <div className="text-xs text-slate-600 space-y-1.5 mb-6">
            <div><span className="font-semibold text-slate-700">Patient:</span> Ramesh Yadav, 47, Male</div>
            <div><span className="font-semibold text-slate-700">Village:</span> Khed, Pune</div>
            <div><span className="font-semibold text-slate-700">Destination:</span> Aundh District Hospital</div>
            <div><span className="font-semibold text-slate-700">Urgency:</span> <span className="text-rose-600 font-bold">EMERGENCY</span></div>
          </div>
          <button className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold rounded-xl transition-colors">
            <span>Load Demo Patient</span>
          </button>
        </div>
      </div>
    </div>
  );
};
