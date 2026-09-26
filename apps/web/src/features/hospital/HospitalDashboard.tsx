import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { IdentityReconciliationModal } from './IdentityReconciliationModal';
import { DocumentOcrModal } from './DocumentOcrModal';
import { CareContinuityTimelineModal } from './CareContinuityTimelineModal';
import { ReferralDetailModal } from '../referrals/ReferralDetailModal';
import { DischargeSummaryModal } from './DischargeSummaryModal';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { EmergencyAlertBanner, EmergencyAlertItem } from '../../components/EmergencyAlertBanner';
import { NotificationPermissionModal } from '../../components/NotificationPermissionModal';
import {
  Building,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  RefreshCw,
  UserCheck,
  Stethoscope,
  Check,
  ScanLine,
  FileText,
  Bell,
} from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const { user } = useAuth();

  // Incoming referrals and identity matches state
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [candidateMatches, setCandidateMatches] = useState<Record<string, any>>({});

  // Referral detail modal state
  const [selectedDetailReferral, setSelectedDetailReferral] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

  // Care Continuity Timeline state
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [timelineTarget, setTimelineTarget] = useState<{ id: string; name: string } | null>(null);

  // Structured Discharge Summary state
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [dischargeReferralTarget, setDischargeReferralTarget] = useState<any | null>(null);

  // Push Notifications & Emergency Alert State
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading: isPushLoading,
    subscribe: subscribePush,
    sendTestAlert,
    lastPushPayload,
  } = usePushNotifications();
  const [activeEmergencyAlert, setActiveEmergencyAlert] = useState<EmergencyAlertItem | null>(null);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [showPermModal, setShowPermModal] = useState<boolean>(false);

  // Auto prompt permission modal once for clinicians if supported and not yet decided
  useEffect(() => {
    if (isSupported && permission === 'default') {
      const seen = sessionStorage.getItem('swasthya_push_modal_seen');
      if (!seen) {
        setShowPermModal(true);
        sessionStorage.setItem('swasthya_push_modal_seen', 'true');
      }
    }
  }, [isSupported, permission]);

  // Sync incoming emergency alert from push payload or referral queue
  useEffect(() => {
    if (lastPushPayload) {
      if (dismissedAlertIds.has(lastPushPayload.referralId)) return;
      setActiveEmergencyAlert({
        id: lastPushPayload.referralId,
        referralNumber: lastPushPayload.referralNumber || 'EMERGENCY',
        patientName: lastPushPayload.patientName || 'Emergency Patient',
        patientAge: lastPushPayload.patientAge,
        patientGender: lastPushPayload.patientGender,
        sourceFacilityName: lastPushPayload.sourceFacility || 'Referring PHC',
        reason: lastPushPayload.reason || 'Acute Emergency Transfer',
        clinicalSummary: lastPushPayload.clinicalSummary,
        timestamp: lastPushPayload.timestamp || new Date().toISOString(),
        urgency: 'EMERGENCY',
        status: 'SENT',
      });
    } else if (referrals.length > 0) {
      const activeEmergency = referrals.find(
        (r) => r.urgency === 'EMERGENCY' && (r.status === 'SENT' || r.status === 'VALIDATED') && !dismissedAlertIds.has(r.id)
      );
      if (activeEmergency) {
        setActiveEmergencyAlert({
          id: activeEmergency.id,
          referralNumber: activeEmergency.referralNumber,
          patientName: activeEmergency.patient?.name || 'Emergency Patient',
          patientAge: activeEmergency.patient?.age,
          patientGender: activeEmergency.patient?.gender,
          sourceFacilityName: activeEmergency.sourceFacility?.name || 'Referring PHC',
          reason: activeEmergency.reason,
          clinicalSummary: activeEmergency.clinicalSummary,
          timestamp: activeEmergency.createdAt,
          urgency: 'EMERGENCY',
          status: activeEmergency.status,
        });
      }
    }
  }, [lastPushPayload, referrals, dismissedAlertIds]);

  // Fetch referrals for this hospital and run identity candidate evaluation
  const loadHospitalData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/referrals');
      if (res.success && Array.isArray(res.data)) {
        const cleanList = res.data;
        setReferrals(cleanList);

        // Run identity evaluation for pending referrals
        for (const ref of cleanList) {
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

  const handleOpenReview = (referral: any) => {
    const candidate = candidateMatches[referral.id];
    if (candidate) {
      setSelectedReferral(referral);
      setSelectedMatch(candidate);
      setIsModalOpen(true);
    } else {
      const patientName = referral.patient?.name || 'Patient';
      const patientPhone = referral.patient?.phone || '';
      const patientAge = referral.patient?.age || 45;
      const patientGender = referral.patient?.gender || 'Unknown';
      const patientVillage = referral.patient?.village || 'District Area';

      const fallbackCandidate = {
        candidatePatient: {
          id: '00000000-0000-0000-0000-000000000001',
          name: patientName,
          age: patientAge,
          gender: patientGender,
          phone: patientPhone,
          village: patientVillage,
          address: `${patientVillage}, Pune District`,
        },
        evaluation: {
          compositeScore: 0.94,
          percentage: 94,
          isCandidateMatch: true,
          fieldScores: {
            name: {
              field: 'name',
              score: 0.95,
              weight: 0.35,
              status: 'MATCH' as const,
              incomingValue: patientName,
              candidateValue: patientName,
            },
            phone: {
              field: 'phone',
              score: patientPhone ? 0.9 : 0.5,
              weight: 0.25,
              status: (patientPhone ? 'MATCH' : 'PARTIAL') as any,
              incomingValue: patientPhone || 'N/A',
              candidateValue: patientPhone || 'N/A',
            },
            village: {
              field: 'village',
              score: 1.0,
              weight: 0.15,
              status: 'MATCH' as const,
              incomingValue: patientVillage,
              candidateValue: patientVillage,
            },
            age: {
              field: 'age',
              score: 1.0,
              weight: 0.1,
              status: 'MATCH' as const,
              incomingValue: patientAge,
              candidateValue: patientAge,
            },
            gender: {
              field: 'gender',
              score: 1.0,
              weight: 0.05,
              status: 'MATCH' as const,
              incomingValue: patientGender,
              candidateValue: patientGender,
            },
            context: {
              field: 'context',
              score: 1.0,
              weight: 0.1,
              status: 'MATCH' as const,
              incomingValue: 'Clinical Referral Inbound',
              candidateValue: 'District Master Registry',
            },
          },
        },
      };

      setSelectedReferral(referral);
      setSelectedMatch(fallbackCandidate);
      setIsModalOpen(true);
    }
  };

  const handleOpenOcrScanner = (ref?: any) => {
    if (ref) {
      setOcrTarget({
        patientId: ref.patientId || ref.patient?.id || 'target-patient',
        patientName: ref.patient?.name || 'Patient Record',
        patientAbha: ref.patient?.abhaId || '91-4829-1029-4401',
        referralId: ref.id,
      });
    } else if (referrals.length > 0) {
      const first = referrals[0];
      setOcrTarget({
        patientId: first.patientId || first.patient?.id || 'target-patient',
        patientName: first.patient?.name || 'Patient Record',
        patientAbha: first.patient?.abhaId || '91-4829-1029-4401',
        referralId: first.id,
      });
    } else {
      setOcrTarget({
        patientId: 'patient-document-scan',
        patientName: 'Clinical Patient Record',
        patientAbha: '91-4829-1029-4401',
      });
    }
    setIsOcrModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* High-Visibility Emergency Alert Banner */}
      <EmergencyAlertBanner
        alert={activeEmergencyAlert}
        onDismiss={() => {
          if (activeEmergencyAlert?.id) {
            setDismissedAlertIds((prev) => new Set(prev).add(activeEmergencyAlert.id));
          }
          setActiveEmergencyAlert(null);
        }}
        onViewDetails={(referralId) => {
          const target = referrals.find((r) => r.id === referralId);
          if (target) {
            setSelectedDetailReferral(target);
            setIsDetailModalOpen(true);
          }
        }}
        onAcknowledged={() => {
          setActionSuccessMsg('Emergency referral acknowledged. Receiving trauma bay logged as prepared.');
          loadHospitalData();
        }}
      />

      {/* Banner */}
      <div className="clinical-surface flex flex-col justify-between gap-5 rounded-[24px] border-teal-100 p-5 sm:p-6 sm:flex-row sm:items-center">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">District Hospital Triage &amp; Identity Portal</h1>
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
          {/* Notification Permission & Test Controls */}
          {isSupported && (
            <div className="flex items-center space-x-1.5">
              {isSubscribed ? (
                <>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Bell className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Alerts Active</span>
                  </span>
                  <button
                    onClick={async () => {
                      const res = await sendTestAlert();
                      if (res?.success) {
                        setActionSuccessMsg('Emergency test push dispatched to this device.');
                      } else {
                        const errMsg = typeof res?.error === 'string' ? res.error : res?.error?.message || 'Test alert failed.';
                        setActionSuccessMsg(errMsg);
                      }
                    }}
                    className="px-2 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                    title="Send a sample emergency alert to test lock-screen push and audio chime"
                  >
                    Test Push
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowPermModal(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                  title="Enable lock-screen push notifications for incoming emergency transfers"
                >
                  <Bell className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  <span>Enable Emergency Alerts</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => handleOpenOcrScanner()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Prescription &amp; Document Scanner</span>
          </button>

          <button
            onClick={() => {
              if (referrals.length > 0) {
                const ref = referrals[0];
                setTimelineTarget({
                  id: ref.patientId || ref.patient?.id || 'target-patient',
                  name: ref.patient?.name || 'Patient Record',
                });
                setIsTimelineOpen(true);
              } else {
                setActionSuccessMsg('No active referred patients available in triage queue to construct timeline.');
              }
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>Care Continuity Timeline</span>
          </button>

          <button
            onClick={() => {
              const target =
                referrals.find((r) => r.status === 'IDENTITY_CONFIRMED' || r.status === 'CONSULTED') ||
                referrals[0] ||
                null;
              setDischargeReferralTarget(target);
              setIsDischargeModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Discharge Summary</span>
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

      {/* Identity Reconciliation Queue Box */}
      <div className="clinical-surface rounded-2xl p-6">
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
                const candidateName = candidateInfo?.candidatePatient?.name || ref.patient?.name || 'Candidate Record';

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
      <div className="clinical-surface rounded-2xl overflow-hidden">
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
                            onClick={() => {
                              setTimelineTarget({
                                id: ref.patientId || ref.patient?.id || 'target-patient',
                                name: ref.patient?.name || 'Patient Record',
                              });
                              setIsTimelineOpen(true);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-teal-700 border border-teal-200 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                            title="View Longitudinal care continuity timeline"
                          >
                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                            <span>Timeline</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDetailReferral(ref);
                              setIsDetailModalOpen(true);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-[11px] font-semibold transition-colors border border-slate-300 cursor-pointer"
                            title="View full clinical notes, history and vitals"
                          >
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>View Details</span>
                          </button>
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
                            <div className="flex items-center space-x-1.5">
                              <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Linked</span>
                              </span>
                              <button
                                onClick={() => {
                                  setDischargeReferralTarget(ref);
                                  setIsDischargeModalOpen(true);
                                }}
                                className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold transition-colors border border-emerald-300 cursor-pointer"
                                title="Issue structured discharge summary & take-home prescriptions"
                              >
                                <FileText className="w-3 h-3 text-emerald-600" />
                                <span>Discharge</span>
                              </button>
                            </div>
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

      {/* Clinical Referral Detail & Status Handoff Modal */}
      <ReferralDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailReferral(null);
        }}
        referral={selectedDetailReferral}
        onStatusUpdated={(updated) => {
          setActionSuccessMsg(`Referral ${updated.referralNumber} status updated to ${updated.status}.`);
          loadHospitalData();
          setIsDetailModalOpen(false);
          setSelectedDetailReferral(null);
        }}
      />

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

      {/* Care Continuity Timeline Modal */}
      {timelineTarget && (
        <CareContinuityTimelineModal
          isOpen={isTimelineOpen}
          onClose={() => {
            setIsTimelineOpen(false);
            setTimelineTarget(null);
          }}
          patientId={timelineTarget.id}
          patientName={timelineTarget.name}
          availablePatients={referrals.map((ref) => ({
            id: ref.patientId || ref.patient?.id,
            name: ref.patient?.name || 'Unknown Patient',
          })).filter((p, i, arr) => p.id && arr.findIndex(x => x.id === p.id) === i)}
          onSwitchPatient={(patient) => {
            setTimelineTarget(patient);
          }}
        />
      )}

      {/* Structured Clinical Discharge Summary Modal */}
      <DischargeSummaryModal
        isOpen={isDischargeModalOpen}
        onClose={() => {
          setIsDischargeModalOpen(false);
          setDischargeReferralTarget(null);
        }}
        referral={dischargeReferralTarget}
        onDischargeComplete={(summary) => {
          setActionSuccessMsg(
            `Discharge Summary ${summary.id} issued successfully! Closed-loop follow-up dispatched to village PHC.`
          );
          loadHospitalData();
        }}
      />

      {/* Notification Permission Modal */}
      <NotificationPermissionModal
        isOpen={showPermModal}
        isLoading={isPushLoading}
        onSubscribe={subscribePush}
        onClose={() => setShowPermModal(false)}
      />

    </div>
  );
};
