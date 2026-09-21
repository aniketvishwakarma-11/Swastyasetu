import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Building, ShieldCheck, FileCheck, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'success' | 'error' | null>(null);

  const testClinicianRbac = async () => {
    setTestResult('Testing RBAC access against /api/test/clinician-only...');
    const res = await apiRequest('/test/clinician-only');
    if (res.success) {
      setTestStatus('success');
      setTestResult(res.message || 'RBAC Access Granted: Verified as CLINICIAN!');
    } else {
      setTestStatus('error');
      setTestResult(res.error?.message || 'Access Denied');
    }
  };

  const testForbiddenPHC = async () => {
    setTestResult('Attempting to access PHC resource /api/test/phc-only...');
    const res = await apiRequest('/test/phc-only');
    if (res.success) {
      setTestStatus('success');
      setTestResult('Access granted (User has dual permission)');
    } else {
      setTestStatus('error');
      setTestResult(`Correctly Blocked by RBAC: ${res.error?.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">District Hospital Triage & Review</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Facility: <span className="font-semibold text-slate-700">{user?.facility?.name || 'Aundh District Hospital'}</span> • Clinician: {user?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={testClinicianRbac}
            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition-colors border border-purple-200"
          >
            Verify Clinician RBAC
          </button>
          <button
            onClick={testForbiddenPHC}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-300"
          >
            Test PHC Route RBAC
          </button>
        </div>
      </div>

      {/* RBAC verification alert */}
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

      {/* Clinician Review Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identity Reconciliation Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Identity Reconciliation Queue</h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              1 Pending Match
            </span>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900">Incoming: Ramesh Yadav (PHC Khed)</span>
              <span className="text-xs font-extrabold text-amber-800">94% Similarity</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Matched with existing record: <span className="font-semibold text-slate-800">Ramesh Kumar (Age 47, Village Khed)</span>. Clinician confirmation required before linking.
            </p>
            <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors">
              <span>Open Side-by-Side Review</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Clinical Document Intelligence */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Clinical Document OCR & Extraction</h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              AI Confidence Ready
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Upload prescription images or discharge slips. The system structures medical entities with field-level confidence scores (&ge; 90% verified vs &lt; 90% review required).
          </p>

          <button className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors">
            <span>Upload Discharge Document / Prescription</span>
          </button>
        </div>
      </div>
    </div>
  );
};
