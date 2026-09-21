import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import {
  PlusCircle,
  Send,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FlaskConical,
} from 'lucide-react';

import { PHCHeader } from './PHCHeader';
import { ConnectivityCard } from './ConnectivityCard';
import { WorkflowStrip } from './WorkflowStrip';

export const PHCDashboard: React.FC = () => {
  const { user } = useAuth();

  // ── RBAC test state (unchanged) ──────────────────────────────────────────
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'success' | 'error' | null>(null);

  // ── Developer Tools panel toggle ─────────────────────────────────────────
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  // ── Existing RBAC handlers (unchanged) ───────────────────────────────────
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

  // Force Sync: existing behavior (no-op placeholder — kept as-is)
  const handleForceSync = async () => {
    // No sync implementation exists yet; placeholder behavior preserved.
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* ── 1. Header ──────────────────────────────────────────────── */}
      <PHCHeader />

      {/* ── 2. Workflow strip ──────────────────────────────────────── */}
      <WorkflowStrip />

      {/* ── 3. Main action grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* ── 3a. Primary action: Create Referral ───────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <PlusCircle className="w-4 h-4 text-teal-600" aria-hidden="true" />
              <span>Create Digital Referral</span>
            </h2>
            <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Offline Capable
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed flex-1">
            Generate a digital referral for incoming patients. Works seamlessly whether
            online or offline — saved locally and synced automatically.
          </p>
          <button className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors">
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Launch Referral Form</span>
          </button>
        </div>

        {/* ── 3b. Connectivity + Sync hero ──────────────────────────── */}
        <ConnectivityCard onForceSync={handleForceSync} />
      </div>

      {/* ── 4. Demo Scenario card (clearly labelled Demo) ─────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-purple-600" aria-hidden="true" />
            <span>Demo Scenario</span>
          </h2>
          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 uppercase tracking-wide">
            Demo
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Patient',     value: 'Ramesh Yadav, 47, M' },
            { label: 'Village',     value: 'Khed, Pune' },
            { label: 'Destination', value: 'Aundh District Hospital' },
            { label: 'Urgency',     value: 'EMERGENCY', urgent: true },
          ].map(({ label, value, urgent }) => (
            <div key={label} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                {label}
              </div>
              <div
                className={`text-xs font-semibold ${urgent ? 'text-rose-600' : 'text-slate-700'}`}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-700 border border-purple-200 text-xs font-semibold rounded-xl transition-colors">
          <span>Load Demo Patient</span>
        </button>
      </div>

      {/* ── 5. Developer Tools (collapsed) ──────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setDevToolsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          aria-expanded={devToolsOpen}
          aria-controls="dev-tools-panel"
        >
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
            <FlaskConical className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>Developer Tools</span>
            <span className="text-[10px] font-normal text-slate-400">
              — RBAC verification (testing only)
            </span>
          </div>
          {devToolsOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
          )}
        </button>

        {devToolsOpen && (
          <div id="dev-tools-panel" className="bg-white px-5 py-4 space-y-4">
            {/* RBAC buttons — identical behavior, unchanged */}
            <div className="flex flex-wrap gap-2">
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

            {/* RBAC result alert — identical markup, unchanged */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-start space-x-3 ${
                  testStatus === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {testStatus === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div>
                  <div className="font-bold mb-0.5">RBAC Middleware Response:</div>
                  <div>{testResult}</div>
                </div>
              </div>
            )}

            {/* Logged-in user info (read-only) */}
            {user && (
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                Session: <span className="font-mono text-slate-600">{user.email}</span>
                {' · '}
                Role: <span className="font-mono text-slate-600">{user.role}</span>
                {user.facilityId && (
                  <>
                    {' · '}
                    Facility ID: <span className="font-mono text-slate-600">{user.facilityId}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
