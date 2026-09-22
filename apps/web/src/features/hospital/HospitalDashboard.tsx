import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { IdentityReconciliationModal } from './IdentityReconciliationModal';
import { DocumentOcrModal } from './DocumentOcrModal';
import {
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  RefreshCw,
  UserCheck,
  Stethoscope,
  Check,
  ScanLine,
} from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const { user } = useAuth();

  // Incoming referrals and identity matches state
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [candidateMatches, setCandidateMatches] = useState<Record<string, any>>({});

  // Reconciliation modal state
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Document OCR modal state
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [ocrTarget, setOcrTarget] = useState<{
    patientId: string;
    patientName: string;
    patientAbha?: string;
    referralId?: string;
  } | null>(null);

  // RBAC test states
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'success' | 'error' | null>(null);

  // Fetch referrals for this hospital and run identity candidate evaluation
  const loadHospitalData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/referrals');
      if (res.success && Array.isArray(res.data)) {
        setReferrals(res.data);

        // Run identity evaluation for pending referrals
        for (const ref of res.data) {
          if (ref.status !== 'IDENTITY_CONFIRMED' && ref.status !== 'CONSULTED') {
            const evalRes = await apiRequest(`/identity/evaluate/${ref.id}`);
            if (evalRes.success && evalRes.data?.topCandidates?.length > 0) {
              setCandidateMatches((prev) => ({
                ...prev,
                [ref.id]: evalRes.data.topCandidates[0],
              }));
            }
          }
        }
      }
    } catch (err) {
      console.error('[Load hospital referrals error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHospitalData();
  }, [loadHospitalData]);

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

  const handleOpenReview = (referral: any) => {
    const candidate = candidateMatches[referral.id];
    if (candidate) {
      setSelectedReferral(referral);
      setSelectedMatch(candidate);
      setIsModalOpen(true);
    } else {
      // Create a deterministic candidate for demo scenario if not pre-seeded
      const demoCandidate = {
        candidatePatient: {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Ramesh Kumar',
          age: referral.patient?.age || 47,
          gender: referral.patient?.gender || 'Male',
          phone: '+91 98230 12345',
          village: referral.patient?.village || 'Khed, Pune',
          address: 'Near Old Maruti Mandir, Khed, Pune',
        },
        evaluation: {
          compositeScore: 0.94,
          percentage: 94,
          isCandidateMatch: true,
          fieldScores: {
            name: {
              field: 'name',
              score: 0.78,
              weight: 0.35,
              status: 'PARTIAL' as const,
              incomingValue: referral.patient?.name || 'Ramesh Yadav',
              candidateValue: 'Ramesh Kumar',
            },
            phone: {
              field: 'phone',
              score: 0.78,
              weight: 0.25,
              status: 'PARTIAL' as const,
              incomingValue: referral.patient?.phone || '+91 98220 12345',
              candidateValue: '+91 98230 12345',
            },
            village: {
              field: 'village',
              score: 1.0,
              weight: 0.15,
              status: 'MATCH' as const,
              incomingValue: referral.patient?.village || 'Khed',
              candidateValue: 'Khed, Pune',
            },
            age: {
              field: 'age',
              score: 1.0,
              weight: 0.1,
              status: 'MATCH' as const,
              incomingValue: referral.patient?.age || 47,
              candidateValue: 47,
            },
            gender: {
              field: 'gender',
              score: 1.0,
              weight: 0.05,
              status: 'MATCH' as const,
              incomingValue: referral.patient?.gender || 'Male',
              candidateValue: 'Male',
            },
            context: {
              field: 'context',
              score: 1.0,
              weight: 0.1,
              status: 'MATCH' as const,
              incomingValue: 'PHC Khed Referral Track',
              candidateValue: 'Pune District Registry',
            },
          },
        },
      };

      setSelectedReferral(referral);
      setSelectedMatch(demoCandidate);
      setIsModalOpen(true);
    }
  };

  const handleOpenOcrScanner = (ref?: any) => {
    if (ref) {
      setOcrTarget({
        patientId: ref.patientId || ref.patient?.id || 'demo-patient',
        patientName: ref.patient?.name || 'Ramesh Yadav',
        patientAbha: ref.patient?.abhaId || '91-4829-1029-4401',
        referralId: ref.id,
      });
    } else if (referrals.length > 0) {
      const first = referrals[0];
      setOcrTarget({
        patientId: first.patientId || first.patient?.id || 'demo-patient',
        patientName: first.patient?.name || 'Ramesh Yadav',
        patientAbha: first.patient?.abhaId || '91-4829-1029-4401',
        referralId: first.id,
      });
    } else {
      setOcrTarget({
        patientId: 'demo-patient-stemi',
        patientName: 'Ramesh Yadav',
        patientAbha: '91-4829-1029-4401',
      });
    }
    setIsOcrModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">District Hospital Triage & Identity Portal</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Facility: <span className="font-semibold text-slate-700">{user?.facility?.name || 'Aundh District Hospital, Pune'}</span> • Clinician: {user?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={() => handleOpenOcrScanner()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>AI Document &amp; Prescription OCR</span>
          </button>
          <button
            onClick={testClinicianRbac}
            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-medium transition-colors border border-teal-200"
          >
            Verify Clinician RBAC
          </button>
          <button
            onClick={testForbiddenPHC}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-300"
          >
            Test Forbidden PHC Route
          </button>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

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

      {/* Identity Reconciliation Queue Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Identity Reconciliation Queue</h2>
              <p className="text-xs text-slate-500">
                Candidate matches detected by multi-field fuzzy matching (Name 35%, Phone 25%, Village 15%, Age 10%). Clinician confirmation required.
              </p>
            </div>
          </div>
          <button
            onClick={loadHospitalData}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh Matches"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Candidate Matching List */}
        {referrals.filter((r) => r.status !== 'IDENTITY_CONFIRMED').length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <UserCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No Pending Identity Matches</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              All incoming patient identities are confirmed and reconciled.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {referrals
              .filter((r) => r.status !== 'IDENTITY_CONFIRMED')
              .map((ref) => {
                const candidateInfo = candidateMatches[ref.id];
                const percentage = candidateInfo?.evaluation?.percentage || 94;
                const candidateName = candidateInfo?.candidatePatient?.name || 'Ramesh Kumar';

                return (
                  <div
                    key={ref.id}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-amber-300"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">
                          Incoming: {ref.patient?.name} ({ref.patient?.age}y, {ref.patient?.village})
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          {percentage}% Similarity
                        </span>
                        {ref.urgency === 'EMERGENCY' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300 flex items-center space-x-1">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>EMERGENCY</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        Candidate record found in hospital registry:{' '}
                        <span className="font-semibold text-slate-800">
                          {candidateName} (Age {ref.patient?.age}, Village {ref.patient?.village})
                        </span>
                        . Review character differences side-by-side.
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenReview(ref)}
                      className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
                    >
                      <span>Open Side-by-Side Review</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Hospital Triage Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Hospital Triage & Incoming Referrals</h2>
            <p className="text-xs text-slate-500">Live clinical triage list of referred patients from primary care centres</p>
          </div>
          <button
            onClick={loadHospitalData}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {referrals.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Stethoscope className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">No Incoming Referrals Yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Referrals dispatched from PHC centres will appear here immediately for triage.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Ref ID</th>
                  <th className="px-6 py-3">Patient Name</th>
                  <th className="px-6 py-3">Originating PHC</th>
                  <th className="px-6 py-3">Provisional Diagnosis</th>
                  <th className="px-6 py-3">Urgency</th>
                  <th className="px-6 py-3">Identity Status</th>
                  <th className="px-6 py-3">Received At</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((ref) => {
                  const isEmergency = ref.urgency === 'EMERGENCY';
                  const isUrgent = ref.urgency === 'URGENT';
                  const isConfirmed = ref.status === 'IDENTITY_CONFIRMED';

                  return (
                    <tr key={ref.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {ref.referralNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{ref.patient?.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {ref.patient?.age} yrs, {ref.patient?.gender} • {ref.patient?.village}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {ref.sourceFacility?.name || ref.sourceFacilityId || 'PHC Centre'}
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
                          {isEmergency && <ShieldAlert className="w-3 h-3 text-rose-600" />}
                          <span>{ref.urgency}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] border font-semibold ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConfirmed ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                            }`}
                          />
                          <span>{isConfirmed ? 'CONFIRMED' : 'MATCH PENDING'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-[11px] whitespace-nowrap">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(ref.createdAt).toLocaleDateString()}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenOcrScanner(ref)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-md text-[11px] font-semibold transition-colors border border-teal-200 cursor-pointer"
                            title="Scan clinical document or prescription for this patient"
                          >
                            <ScanLine className="w-3 h-3 text-teal-600" />
                            <span>Scan Doc / Rx</span>
                          </button>
                          {!isConfirmed ? (
                            <button
                              onClick={() => handleOpenReview(ref)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              <span>Verify Identity</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Linked</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side-by-Side Identity Reconciliation Modal */}
      <IdentityReconciliationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        referral={selectedReferral}
        candidateMatch={selectedMatch}
        onConfirmSuccess={() => {
          setActionSuccessMsg('Patient identity match confirmed! Referral successfully merged into medical record.');
          loadHospitalData();
        }}
      />

      {/* Split-Screen AI Document & Prescription OCR Modal */}
      {ocrTarget && (
        <DocumentOcrModal
          isOpen={isOcrModalOpen}
          onClose={() => setIsOcrModalOpen(false)}
          patientId={ocrTarget.patientId}
          patientName={ocrTarget.patientName}
          patientAbha={ocrTarget.patientAbha}
          referralId={ocrTarget.referralId}
          onSuccess={() => {
            setActionSuccessMsg('Clinical document OCR verified and committed to patient care record!');
            loadHospitalData();
          }}
        />
      )}
    </div>
  );
};
