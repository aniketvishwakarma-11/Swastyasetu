import React, { useState } from 'react';
import {
  X,
  Stethoscope,
  Phone,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  FileText,
  AlertCircle,
  Activity,
  Check,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useModalA11y } from '../../hooks/useModalA11y';

interface ReferralDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  referral: any | null;
  onStatusUpdated?: (updatedReferral: any) => void;
  canUpdateStatus?: boolean;
}

export const ReferralDetailModal: React.FC<ReferralDetailModalProps> = ({
  isOpen,
  onClose,
  referral,
  onStatusUpdated,
  canUpdateStatus = true,
}) => {
  useModalA11y(isOpen, onClose);

  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string | null>(null);

  if (!isOpen || !referral) return null;

  const patient = referral.patient || {};
  const isEmergency = referral.urgency === 'EMERGENCY';
  const isUrgent = referral.urgency === 'URGENT';
  const currentStatus = referral.status;

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest(`/referrals/${referral.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          notes: statusNote.trim() || undefined,
        }),
      });

      if (res.success && res.data) {
        setShowNoteInput(false);
        setStatusNote('');
        if (onStatusUpdated) {
          onStatusUpdated(res.data);
        }
      } else {
        setErrorMsg(res.error?.message || 'Failed to update referral status.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error updating referral status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Referral Details ${referral.referralNumber}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-slate-900 text-base">
                  {referral.referralNumber}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                    isEmergency
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : isUrgent
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isEmergency && <ShieldAlert className="w-3 h-3 mr-1 text-rose-600" />}
                  {referral.urgency}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                  {currentStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Clinical Referral Record &amp; Handoff Sheet</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Patient Demographics Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <span>Patient Information</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Full Name</span>
                <span className="font-semibold text-slate-900 text-sm">{patient.name || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Age &amp; Gender</span>
                <span className="font-medium text-slate-800">
                  {patient.age ? `${patient.age} yrs` : 'N/A'}, {patient.gender || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium flex items-center space-x-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>Phone</span>
                </span>
                <span className="font-medium text-slate-800">{patient.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>Village / Area</span>
                </span>
                <span className="font-medium text-slate-800">{patient.village || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Facility Routing Transfer Track */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Transfer Route
            </h3>
            <div className="flex items-center justify-between text-xs gap-3">
              <div className="flex-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-teal-700 block">Originating PHC</span>
                <span className="font-semibold text-slate-900 block mt-0.5">
                  {referral.sourceFacility?.name || 'Primary Health Centre'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Dispatched: {new Date(referral.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-center text-teal-600 px-2">
                <ArrowRight className="w-5 h-5" />
              </div>

              <div className="flex-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Destination Facility</span>
                <span className="font-semibold text-slate-900 block mt-0.5">
                  {referral.destinationFacility?.name || 'District Hospital'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  District: {referral.destinationFacility?.district || 'Pune'}
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Presentation & Summary */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Provisional Diagnosis / Reason for Referral
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900">
                {referral.reason}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Clinical Summary &amp; Pre-Referral Stabilization
              </label>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-mono">
                {referral.clinicalSummary || 'No clinical summary notes entered.'}
              </div>
            </div>
          </div>

          {/* Clinician Operational Status Actions */}
          {canUpdateStatus && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Update Referral Status</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Current: <strong className="text-slate-800">{currentStatus}</strong>
                </span>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                {currentStatus === 'SENT' && (
                  <button
                    onClick={() => {
                      setTargetStatus('RECEIVED');
                      setShowNoteInput(true);
                    }}
                    disabled={updating}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Acknowledge / Mark Received</span>
                  </button>
                )}

                {(currentStatus === 'RECEIVED' || currentStatus === 'IDENTITY_CONFIRMED') && (
                  <button
                    onClick={() => {
                      setTargetStatus('CONSULTED');
                      setShowNoteInput(true);
                    }}
                    disabled={updating}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Consulted / Admitted</span>
                  </button>
                )}

                {currentStatus === 'CONSULTED' && (
                  <button
                    onClick={() => {
                      setTargetStatus('DISCHARGE_PROCESSING');
                      setShowNoteInput(true);
                    }}
                    disabled={updating}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>Initiate Discharge Processing</span>
                  </button>
                )}

                {currentStatus !== 'SENT' && currentStatus !== 'CONSULTED' && (
                  <span className="text-xs text-slate-500 italic">
                    Status actively managed via hospital clinical workflow.
                  </span>
                )}
              </div>

              {/* Optional Clinician Note Input when changing status */}
              {showNoteInput && targetStatus && (
                <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-teal-900">
                      Confirm Transition to <strong className="uppercase">{targetStatus}</strong>
                    </span>
                    <button
                      onClick={() => setShowNoteInput(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Optional clinical or operational note (e.g. Bed 12 assigned, vitals stable)..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      onClick={() => setShowNoteInput(false)}
                      className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(targetStatus)}
                      disabled={updating}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      {updating ? (
                        <span>Updating...</span>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Confirm Update</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium font-mono">
            ID: {referral.id || referral.localId || 'N/A'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
