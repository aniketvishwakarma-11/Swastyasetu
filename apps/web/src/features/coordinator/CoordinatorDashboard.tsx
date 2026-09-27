import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { ReferralDetailModal } from '../referrals/ReferralDetailModal';
import { HospitalReadinessRadarModal } from './HospitalReadinessRadarModal';
import { AmbulanceTransportSlipModal } from './AmbulanceTransportSlipModal';
import {
  Network,
  CheckCircle2,
  ArrowRightLeft,
  Clock,
  Building2,
  FileSpreadsheet,
  RefreshCw,
  Ambulance,
  ArrowRight,
  FileText,
  Check,
} from 'lucide-react';

export const CoordinatorDashboard: React.FC = () => {
  const { user } = useAuth();
  // Live referrals state
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Detail Modal state
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Bed & ICU Readiness Radar Modal state
  const [isRadarOpen, setIsRadarOpen] = useState(false);

  // 108 Transport Slip Modal state
  const [isTransportSlipOpen, setIsTransportSlipOpen] = useState(false);
  const [transportSlipReferral, setTransportSlipReferral] = useState<any | null>(null);

  // Mobile column tab state for mobile responsiveness (< md screens)
  const [activeMobileTab, setActiveMobileTab] = useState<'AWAITING' | 'IN_TRANSIT' | 'COMPLETED'>('AWAITING');

  const loadReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/referrals');
      if (res.success && Array.isArray(res.data)) {
        const cleanList = res.data;
        setReferrals(cleanList);
      }
    } catch (err) {
      console.error('[Load coordinator referrals error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  // Status transitions
  const handleTransitStatus = async (referralId: string, newStatus: string, note?: string) => {
    try {
      const res = await apiRequest(`/referrals/${referralId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          notes: note || `Dispatched via 108 emergency transport coordinator`,
        }),
      });

      if (res.success) {
        setActionSuccessMsg(`Referral updated to ${newStatus}.`);
        loadReferrals();
      }
    } catch (err: any) {
      console.error('[Coordinator status update error]', err);
    }
  };

  // Group referrals into 3 Kanban columns
  const awaitingDispatch = referrals.filter((r) =>
    ['SENT', 'QUEUED', 'VALIDATED', 'DRAFT'].includes(r.status)
  );

  const inTransit = referrals.filter((r) =>
    ['SYNCING', 'RECEIVED', 'IDENTITY_PENDING'].includes(r.status)
  );

  const completedHandoffs = referrals.filter((r) =>
    [
      'IDENTITY_CONFIRMED',
      'CONSULTED',
      'DISCHARGE_PROCESSING',
      'DOCUMENT_REVIEW',
      'CARE_RECORD_UPDATED',
      'FOLLOW_UP_DUE',
      'FOLLOW_UP_COMPLETED',
    ].includes(r.status)
  );

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
              <h1 className="text-xl font-bold text-slate-900">Referral Coordination</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                Coordinator
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Triage Staff: <span className="font-semibold text-slate-700">{user?.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={loadReferrals}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Refresh pipeline"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsRadarOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Bed &amp; ICU Readiness</span>
          </button>

          <button
            onClick={() => {
              setTransportSlipReferral(referrals[0] || null);
              setIsTransportSlipOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
            <span>108 Transport Slip</span>
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

      {/* Mobile Column Tab Switcher */}
      <div className="flex md:hidden bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold">
        <button
          onClick={() => setActiveMobileTab('AWAITING')}
          className={`flex-1 py-2 px-1 rounded-lg text-center transition-all ${
            activeMobileTab === 'AWAITING'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Awaiting ({awaitingDispatch.length})
        </button>
        <button
          onClick={() => setActiveMobileTab('IN_TRANSIT')}
          className={`flex-1 py-2 px-1 rounded-lg text-center transition-all ${
            activeMobileTab === 'IN_TRANSIT'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          In-Transit ({inTransit.length})
        </button>
        <button
          onClick={() => setActiveMobileTab('COMPLETED')}
          className={`flex-1 py-2 px-1 rounded-lg text-center transition-all ${
            activeMobileTab === 'COMPLETED'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed ({completedHandoffs.length})
        </button>
      </div>

      {/* Live Kanban Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Awaiting Ambulance */}
        <div className={`clinical-surface rounded-2xl p-5 flex-col h-full ${activeMobileTab === 'AWAITING' ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Awaiting Ambulance</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              {awaitingDispatch.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Referrals dispatched by primary care doctors awaiting 108 transport assignment.
          </p>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
            {awaitingDispatch.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                Queue clear. No pending transfers.
              </div>
            ) : (
              awaitingDispatch.map((ref) => {
                const isEmergency = ref.urgency === 'EMERGENCY';
                return (
                  <div
                    key={ref.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-teal-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">{ref.referralNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isEmergency
                            ? 'bg-teal-50 text-teal-800 border-teal-300'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {ref.urgency}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-800">{ref.patient?.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {ref.patient?.age}y, {ref.patient?.gender} • {ref.patient?.village}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 line-clamp-1 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                      &quot;{ref.reason}&quot;
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedReferral(ref);
                            setIsDetailModalOpen(true);
                          }}
                          className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>Details</span>
                        </button>

                        <button
                          onClick={() => {
                            setTransportSlipReferral(ref);
                            setIsTransportSlipOpen(true);
                          }}
                          className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1 cursor-pointer"
                          title="Generate 108 Ambulance Transport Slip"
                        >
                          <FileSpreadsheet className="w-3 h-3 text-teal-600" />
                          <span>108 Slip</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleTransitStatus(ref.id, 'SYNCING', '108 Ambulance Unit Assigned')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <Ambulance className="w-3 h-3" />
                        <span>Dispatch 108</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: In-Transit Active Transfers */}
        <div className={`clinical-surface rounded-2xl p-5 flex-col h-full ${activeMobileTab === 'IN_TRANSIT' ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <ArrowRightLeft className="w-4 h-4 text-teal-600" />
              <span>In-Transit Active Transfers</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              {inTransit.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Ambulances currently en-route between PHCs and destination hospital ERs.
          </p>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
            {inTransit.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                0 active ambulances tracked.
              </div>
            ) : (
              inTransit.map((ref) => (
                <div
                    key={ref.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-teal-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">{ref.referralNumber}</span>
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-300">
                        <Ambulance className="w-3 h-3" />
                        <span>EN-ROUTE</span>
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-800">{ref.patient?.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {ref.sourceFacility?.name || 'PHC'} <ArrowRight className="inline w-3 h-3 mx-0.5 text-slate-400" /> {ref.destinationFacility?.name || 'District Hospital'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedReferral(ref);
                            setIsDetailModalOpen(true);
                          }}
                          className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>Details</span>
                        </button>

                        <button
                          onClick={() => {
                            setTransportSlipReferral(ref);
                            setIsTransportSlipOpen(true);
                          }}
                          className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1 cursor-pointer"
                          title="View 108 Ambulance Transport Slip"
                        >
                          <FileSpreadsheet className="w-3 h-3 text-teal-600" />
                          <span>108 Slip</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleTransitStatus(ref.id, 'RECEIVED', 'Arrived at Destination ER')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Confirm ER Arrival</span>
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Column 3: Completed Handoffs */}
        <div className={`clinical-surface rounded-2xl p-5 flex-col h-full ${activeMobileTab === 'COMPLETED' ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Completed Handoffs</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              {completedHandoffs.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Patients admitted at destination facility with clinical receipt confirmed.
          </p>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
            {completedHandoffs.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                Handoff registry up-to-date.
              </div>
            ) : (
              completedHandoffs.map((ref) => (
                <div
                  key={ref.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800">{ref.referralNumber}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                      {ref.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-800">{ref.patient?.name}</div>
                    <div className="text-[11px] text-slate-500">
                      Admitted at {ref.destinationFacility?.name || 'District Hospital'}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedReferral(ref);
                        setIsDetailModalOpen(true);
                      }}
                      className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
                    >
                      <FileText className="w-3 h-3 text-teal-600" />
                      <span>View Handoff Summary</span>
                    </button>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ref.updatedAt || ref.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Referral Detail Modal */}
      <ReferralDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedReferral(null);
        }}
        referral={selectedReferral}
        onStatusUpdated={(updated) => {
          setActionSuccessMsg(`Referral ${updated.referralNumber} status updated to ${updated.status}.`);
          loadReferrals();
          setIsDetailModalOpen(false);
          setSelectedReferral(null);
        }}
      />

      {/* Bed & ICU Readiness Radar Modal */}
      <HospitalReadinessRadarModal
        isOpen={isRadarOpen}
        onClose={() => setIsRadarOpen(false)}
      />


      {/* 108 Ambulance Digital Transport Slip Modal */}
      <AmbulanceTransportSlipModal
        isOpen={isTransportSlipOpen}
        onClose={() => {
          setIsTransportSlipOpen(false);
          setTransportSlipReferral(null);
        }}
        referralId={transportSlipReferral?.id}
        referralNumber={transportSlipReferral?.referralNumber}
        onStatusUpdated={(updated) => {
          setActionSuccessMsg(`Referral ${updated.referralNumber} status updated to ${updated.status}.`);
          loadReferrals();
        }}
      />
    </div>
  );
};
