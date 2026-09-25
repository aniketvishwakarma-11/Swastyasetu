import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { localDb, LocalReferral } from '../../lib/db';
import { useNetworkSync } from '../../lib/useNetworkSync';
import { ReferralModal } from './ReferralModal';
import { RapidVitalsModal } from './RapidVitalsModal';
import { FollowUpTrackerModal } from './FollowUpTrackerModal';
import { ReferralDetailModal } from '../referrals/ReferralDetailModal';
import { CareContinuityTimelineModal } from '../hospital/CareContinuityTimelineModal';
import { formatFallbackSMS } from '@swastyasetu/shared';
import {
  Stethoscope,
  PlusCircle,
  RefreshCw,
  Send,
  CheckCircle2,
  Clock,
  ShieldAlert,
  MessageSquare,
  Copy,
  Check,
  X,
  HeartPulse,
  CalendarCheck,
  FileText,
  Activity,
} from 'lucide-react';

export const PHCDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isOnline, isSyncing, pendingCount, syncNow, refreshPendingCount } = useNetworkSync();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [referralInitialData, setReferralInitialData] = useState<any | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [selectedSmsReferral, setSelectedSmsReferral] = useState<any | null>(null);
  const [selectedDetailReferral, setSelectedDetailReferral] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [timelinePatient, setTimelinePatient] = useState<{ id: string; name: string } | null>(null);

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

      // Automatically purge legacy test entries from browser IndexedDB
      for (const item of localList) {
        const name = (item as any).patient?.name || (item as any).patientName || '';
        if (name.toLowerCase().includes('ramesh')) {
          if (item.localId) {
            try {
              await localDb.referrals.delete(item.localId);
            } catch {
              // ignore deletion error
            }
          }
        }
      }

      const refreshedLocal = await localDb.referrals.toArray();

      // Merge avoiding duplicates
      const seenIds = new Set(serverList.map((s) => s.id).filter(Boolean));
      const filteredLocal = refreshedLocal.filter((l: LocalReferral) => !l.id || !seenIds.has(l.id));

      const combined = [...filteredLocal, ...serverList]
        .filter((r) => {
          const name = r.patient?.name || r.patientName || '';
          return !name.toLowerCase().includes('ramesh');
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Welcome & Clinical Actions Header */}
      <div className="clinical-surface flex flex-col justify-between gap-5 rounded-[24px] border-teal-100 p-5 sm:p-6 md:flex-row md:items-center">
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
              Facility: <span className="font-semibold text-slate-700">{user?.facility?.name || 'Primary Health Centre Khed'}</span> • Doctor: {user?.name}
            </p>
          </div>
        </div>

        {/* Primary Clinical Actions */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Digital Referral</span>
          </button>

          <button
            onClick={() => setIsVitalsOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <span>Rapid Vitals &amp; EWS</span>
          </button>

          <button
            onClick={() => setIsFollowUpOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4 text-teal-600" />
            <span>Follow-Up Tracker</span>
          </button>

          {pendingCount > 0 && (
            <button
              onClick={() => {
                syncNow();
                loadReferrals();
              }}
              disabled={isSyncing}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Synchronize offline-created records to cloud database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Pending ({pendingCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Clinical Summary Metric Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="clinical-surface rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Dispatched</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{referrals.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Outbound clinical handoffs</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="clinical-surface rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Emergency Referrals</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">
              {referrals.filter((r) => r.urgency === 'EMERGENCY').length}
            </p>
            <p className="text-[11px] text-rose-600/80 mt-0.5 font-medium">Critical acute transfers</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="clinical-surface rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgent / Routine</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {referrals.filter((r) => r.urgency === 'URGENT' || r.urgency === 'ROUTINE').length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Secondary care queue</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="clinical-surface rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cloud Ledger Status</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {referrals.filter((r) => r.syncStatus === 'SYNCED').length}
            </p>
            <p className="text-[11px] text-emerald-600/80 mt-0.5 font-medium">
              {pendingCount > 0 ? `${pendingCount} offline pending` : 'All records synchronized'}
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Referrals Activity Table */}
      <div className="clinical-surface rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Dispatched Referrals</h2>
            <p className="text-xs text-slate-500">Live tracker of patient referrals sent from this facility</p>
          </div>
          <button
            onClick={loadReferrals}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loadingReferrals ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {referrals.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Stethoscope className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">No Referrals Dispatched Yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;+ Create Digital Referral&quot; to initiate a patient transfer.
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
                          {isEmergency && <ShieldAlert className="w-3 h-3 text-rose-600" />}
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
                          />
                          <span>{ref.syncStatus || ref.status}</span>
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
                              setSelectedDetailReferral(ref);
                              setIsDetailModalOpen(true);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                            title="View Clinical Summary & Patient Details"
                          >
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => {
                              const pid = ref.patientId || ref.patient?.id || ref.id;
                              const pname = ref.patient?.name || ref.patientName || 'Patient';
                              setTimelinePatient({ id: pid, name: pname });
                              setIsTimelineOpen(true);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                            title="View Longitudinal Care Continuity Timeline"
                          >
                            <Activity className="w-3 h-3 text-teal-600" />
                            <span>Timeline</span>
                          </button>
                          <button
                            onClick={() => setSelectedSmsReferral(ref)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 text-slate-700 border border-slate-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                            title="View 2G Cellular SMS Fallback Payload"
                          >
                            <MessageSquare className="w-3 h-3 text-teal-600" />
                            <span>SMS Payload</span>
                          </button>
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

      {/* Referral Creation Modal */}
      <ReferralModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setReferralInitialData(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setReferralInitialData(null);
          loadReferrals();
          refreshPendingCount();
        }}
        isOnline={isOnline}
        initialData={referralInitialData}
      />

      {/* Frontline Rapid Vitals & EWS Screening Modal */}
      <RapidVitalsModal
        isOpen={isVitalsOpen}
        onClose={() => setIsVitalsOpen(false)}
        isOnline={isOnline}
        onEscalateToReferral={(data) => {
          setIsVitalsOpen(false);
          setReferralInitialData(data);
          setIsModalOpen(true);
        }}
      />

      {/* Post-Discharge Return & Follow-Up Tracker Modal */}
      <FollowUpTrackerModal
        isOpen={isFollowUpOpen}
        onClose={() => setIsFollowUpOpen(false)}
        isOnline={isOnline}
      />

      {/* Clinical Referral Detail Modal */}
      <ReferralDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailReferral(null);
        }}
        referral={selectedDetailReferral}
        canUpdateStatus={false}
      />

      {/* Care Continuity Longitudinal Timeline Modal */}
      {isTimelineOpen && timelinePatient && (
        <CareContinuityTimelineModal
          isOpen={isTimelineOpen}
          onClose={() => {
            setIsTimelineOpen(false);
            setTimelinePatient(null);
          }}
          patientId={timelinePatient.id}
          patientName={timelinePatient.name}
          availablePatients={referrals
            .map((ref) => ({
              id: ref.patientId || ref.patient?.id || ref.id,
              name: ref.patient?.name || ref.patientName || 'Unknown Patient',
            }))
            .filter((p, i, arr) => p.id && arr.findIndex((x) => x.id === p.id) === i)}
          onSwitchPatient={(patient) => {
            setTimelinePatient(patient);
          }}
        />
      )}

      {/* SMS Fallback Modal (<160 chars) */}
      {selectedSmsReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
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
                <X className="w-4 h-4" />
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
                  reason: selectedSmsReferral.reason,
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
                        {copiedSms ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
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
