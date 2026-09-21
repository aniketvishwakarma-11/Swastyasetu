import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { localDb, LocalReferral } from '../../lib/db';
import { useNetworkSync } from '../../lib/useNetworkSync';
import { ReferralModal } from './ReferralModal';
import { formatFallbackSMS } from '@swastyasetu/shared';
import {
  PlusCircle,
  Send,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Stethoscope,
  RefreshCw,
  Clock,
  ShieldAlert,
  MessageSquare,
  Copy,
  Check,
  X,
} from 'lucide-react';

import { PHCHeader } from './PHCHeader';
import { ConnectivityCard } from './ConnectivityCard';
import { WorkflowStrip } from './WorkflowStrip';

export const PHCDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isOnline, syncNow, refreshPendingCount } = useNetworkSync();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [selectedSmsReferral, setSelectedSmsReferral] = useState<any | null>(null);
  const [copiedSms, setCopiedSms] = useState(false);

  // RBAC test states
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'success' | 'error' | null>(null);

  // Developer Tools panel toggle
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  // Load merged list of referrals (Server + Local IndexedDB)
  const loadReferrals = useCallback(async () => {
    setLoadingReferrals(true);
    try {
      let serverList: any[] = [];
      if (isOnline) {
        const res = await apiRequest('/referrals');
        if (res.success && Array.isArray(res.data)) {
          serverList = res.data.map((item: any) => ({
            ...item,
            syncStatus: 'SYNCED',
          }));
        }
      }

      // Load local indexedDB referrals
      const localList = await localDb.referrals.toArray();

      // Merge avoiding duplicates
      const seenIds = new Set(serverList.map((s) => s.id).filter(Boolean));
      const filteredLocal = localList.filter((l: LocalReferral) => !l.id || !seenIds.has(l.id));

      const combined = [...filteredLocal, ...serverList].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setReferrals(combined);
    } catch (err) {
      console.error('[Load referrals error]', err);
    } finally {
      setLoadingReferrals(false);
      refreshPendingCount();
    }
  }, [isOnline, refreshPendingCount]);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

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

  // Connected to real syncNow implementation
  const handleForceSync = async () => {
    await syncNow();
    await loadReferrals();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ── 1. Header ──────────────────────────────────────────────── */}
      <PHCHeader />

      {/* ── 2. Workflow strip ──────────────────────────────────────── */}
      <WorkflowStrip />

      {/* ── 3. Operational Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Referral Creator Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <PlusCircle className="w-4 h-4 text-teal-600" aria-hidden="true" />
                <span>Create Digital Referral</span>
              </h2>
              <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Offline Capable
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Generate digital referral for incoming patients. Works seamlessly whether online or offline with automatic sync queue.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Launch Referral Form</span>
          </button>
        </div>

        {/* ── 3b. Connectivity + Sync hero ──────────────────────────── */}
        <ConnectivityCard onForceSync={handleForceSync} />

        {/* Demo Scenario Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-purple-600" aria-hidden="true" />
                <span>Demo Scenario</span>
              </h2>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Ramesh Yadav
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-1.5 mb-6">
              <div><span className="font-semibold text-slate-700">Patient:</span> Ramesh Yadav, 47, Male</div>
              <div><span className="font-semibold text-slate-700">Village:</span> Khed, Pune</div>
              <div><span className="font-semibold text-slate-700">Condition:</span> Acute STEMI Chest Pain</div>
              <div><span className="font-semibold text-slate-700">Urgency:</span> <span className="text-rose-600 font-bold">EMERGENCY</span></div>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-700 border border-purple-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <span>Open &amp; Load Demo Patient</span>
          </button>
        </div>
      </div>

      {/* ── 4. Referrals Activity Table ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Dispatched Referrals</h2>
            <p className="text-xs text-slate-500">Live tracker of patient referrals sent from this facility</p>
          </div>
          <button
            onClick={loadReferrals}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loadingReferrals ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>

        {referrals.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Stethoscope className="w-10 h-10 mx-auto text-slate-300 mb-3" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">No Referrals Dispatched Yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Launch Referral Form&quot; or load the demo scenario to generate a patient referral.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Ref ID</th>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Destination Facility</th>
                  <th className="px-6 py-3">Clinical Complaint</th>
                  <th className="px-6 py-3">Urgency</th>
                  <th className="px-6 py-3">Sync Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((ref) => {
                  const isEmergency = ref.urgency === 'EMERGENCY';
                  const isUrgent = ref.urgency === 'URGENT';
                  const isSynced = ref.syncStatus === 'SYNCED';

                  return (
                    <tr key={ref.localId || ref.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {ref.referralNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{ref.patient?.name || 'Unknown'}</div>
                        <div className="text-[11px] text-slate-400">
                          {ref.patient?.age} yrs, {ref.patient?.gender} • {ref.patient?.village}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {ref.destinationFacility?.name || ref.destinationFacilityId || 'District Hospital'}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-800" title={ref.reason}>
                        {ref.reason}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] border font-bold ${
                            isEmergency
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : isUrgent
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isEmergency && <ShieldAlert className="w-3 h-3 text-rose-600" aria-hidden="true" />}
                          <span>{ref.urgency}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] border font-semibold ${
                            isSynced
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSynced ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                            }`}
                            aria-hidden="true"
                          />
                          <span>{ref.syncStatus || ref.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-[11px] whitespace-nowrap">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          <span>{new Date(ref.createdAt).toLocaleDateString()}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedSmsReferral(ref)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 text-slate-700 border border-slate-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                          title="View 2G Cellular SMS Fallback Payload"
                        >
                          <MessageSquare className="w-3 h-3 text-teal-600" aria-hidden="true" />
                          <span>SMS Payload</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. Developer Tools (collapsed) ──────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setDevToolsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left cursor-pointer"
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
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-300 cursor-pointer"
              >
                Verify PHC RBAC Access
              </button>
              <button
                onClick={testForbiddenAccess}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium transition-colors border border-rose-200 cursor-pointer"
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

      {/* Referral Creation Modal */}
      <ReferralModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadReferrals();
        }}
        isOnline={isOnline}
      />

      {/* SMS Fallback Modal (<160 chars) */}
      {selectedSmsReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">SMS Fallback Dispatch</h3>
                  <p className="text-[11px] text-slate-500">GSM 160-character compact emergency dispatch</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSmsReferral(null);
                  setCopiedSms(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                When internet connectivity drops to zero, frontline clinicians and ASHA workers can transmit this compressed referral string via ordinary 2G cellular SMS to the district triage phone.
              </p>

              {(() => {
                const smsText = formatFallbackSMS({
                  referralNumber: selectedSmsReferral.referralNumber,
                  patientName: selectedSmsReferral.patient?.name || 'PATIENT',
                  age: selectedSmsReferral.patient?.age || 0,
                  gender: selectedSmsReferral.patient?.gender || 'M',
                  sourceFacilityCode: user?.facility?.code || 'PHC-KHED',
                  destinationFacilityCode: selectedSmsReferral.destinationFacility?.code || 'DIST-HOSP',
                  urgency: selectedSmsReferral.urgency || 'ROUT',
                });

                return (
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
                      <span>COMPACT PAYLOAD</span>
                      <span className={smsText.length <= 160 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        {smsText.length} / 160 characters
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl break-all select-all">
                      {smsText}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Standard GSM SMS Compatible</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(smsText);
                          setCopiedSms(true);
                          setTimeout(() => setCopiedSms(false), 2000);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                      >
                        {copiedSms ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                        <span>{copiedSms ? 'Copied to Clipboard' : 'Copy Payload'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
