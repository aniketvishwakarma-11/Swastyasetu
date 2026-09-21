import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  ArrowRightLeft,
  Info,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';

interface FieldScore {
  field: string;
  score: number;
  weight: number;
  status: 'MATCH' | 'PARTIAL' | 'MISMATCH';
  incomingValue: string | number;
  candidateValue: string | number;
}

interface MatchCandidate {
  candidatePatient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone?: string | null;
    village: string;
    address?: string | null;
  };
  evaluation: {
    compositeScore: number;
    percentage: number;
    isCandidateMatch: boolean;
    fieldScores: Record<string, FieldScore>;
  };
}

interface IdentityReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSuccess: () => void;
  referral: any;
  candidateMatch: MatchCandidate | null;
}

export const IdentityReconciliationModal: React.FC<IdentityReconciliationModalProps> = ({
  isOpen,
  onClose,
  onConfirmSuccess,
  referral,
  candidateMatch,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');

  if (!isOpen || !referral || !candidateMatch) return null;

  const incoming = referral.patient;
  const candidate = candidateMatch.candidatePatient;
  const evaluation = candidateMatch.evaluation;

  // Confirm identity match: Merges incoming referral into the existing candidate's master chart
  const handleConfirmMatch = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await apiRequest('/identity/confirm', {
        method: 'POST',
        body: JSON.stringify({
          referralId: referral.id,
          canonicalPatientId: candidate.id,
          notes: clinicalNotes.trim() || 'Clinician reviewed and confirmed patient match side-by-side.',
        }),
      });

      if (res.success) {
        onConfirmSuccess();
        onClose();
      } else {
        setActionError(res.error?.message || 'Failed to confirm identity match.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Register as distinct new patient
  const handleRegisterAsNew = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await apiRequest('/identity/reject', {
        method: 'POST',
        body: JSON.stringify({
          referralId: referral.id,
          notes: clinicalNotes.trim() || 'Clinician confirmed incoming patient is a distinct new individual.',
        }),
      });

      if (res.success) {
        onConfirmSuccess();
        onClose();
      } else {
        setActionError(res.error?.message || 'Failed to register as new patient.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMatchBadge = (fieldKey: string) => {
    const fs = evaluation.fieldScores[fieldKey];
    if (!fs) return null;

    if (fs.status === 'MATCH') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
          Match (100%)
        </span>
      );
    }
    if (fs.status === 'PARTIAL') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 uppercase">
          Partial ({Math.round(fs.score * 100)}%)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
        Mismatch
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl my-8 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">Side-by-Side Identity Reconciliation</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                  {evaluation.percentage}% Similarity
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Referral <span className="font-mono font-semibold text-slate-700">{referral.referralNumber}</span> • Clinician confirmation required (No Silent Merging)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Banner */}
        <div className="bg-amber-50/70 border-b border-amber-200/80 px-6 py-2.5 flex items-center space-x-2 text-xs text-amber-900">
          <Info className="w-4 h-4 shrink-0 text-amber-700" />
          <span>
            <strong>Hard Safety Rule:</strong> High fuzzy similarity is never automatically merged. Review character differences below before confirming patient record linkage.
          </span>
        </div>

        {/* Modal Body: 50/50 Comparison */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* 2-Column Comparison Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Center Bridge Divider Badge */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-slate-300 shadow-sm items-center justify-center text-slate-400">
              <ArrowRightLeft className="w-4 h-4 text-teal-600" />
            </div>

            {/* Column 1: Incoming Patient */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Incoming Referral Patient
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {referral.sourceFacility?.name || 'PHC Khed'}
                </span>
              </div>

              {/* Demographics */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Full Name</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {incoming.name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Age & Gender</span>
                    <span className="font-semibold text-slate-800">{incoming.age} yrs • {incoming.gender}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Mobile Phone</span>
                    <span className="font-mono text-slate-800">{incoming.phone || 'None'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Village / Locality</span>
                  <span className="font-semibold text-slate-800">{incoming.village}</span>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Clinical Complaint</span>
                  <p className="text-xs text-slate-700 mt-0.5 italic">{referral.reason}</p>
                </div>
              </div>
            </div>

            {/* Column 2: Candidate Existing Patient */}
            <div className="bg-white rounded-2xl border-2 border-teal-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                    Hospital Registry Record
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  ID: {candidate.id.slice(0, 8)}...
                </span>
              </div>

              {/* Demographics */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</span>
                    {renderMatchBadge('name')}
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {candidate.name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Age & Gender</span>
                      {renderMatchBadge('age')}
                    </div>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {candidate.age} yrs • {candidate.gender}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone</span>
                      {renderMatchBadge('phone')}
                    </div>
                    <span className="font-mono text-slate-800 mt-0.5 block">{candidate.phone || 'None'}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Village</span>
                    {renderMatchBadge('village')}
                  </div>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{candidate.village}</span>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Address</span>
                  <p className="text-xs text-slate-600 mt-0.5">{candidate.address || 'Khed District, Pune'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Clinician Decision Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Clinician Verification Notes (Recorded in Immutable Audit Log)
            </label>
            <input
              type="text"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="e.g. Identity verified via Aadhaar last 4 digits and son's phone confirmation."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>
        </div>

        {/* Modal Footer with Explicit Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Selected Action will update master patient index & create an audit trail.
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRegisterAsNew}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-500" />
              <span>Register as New Patient</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmMatch}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Linking...' : 'Confirm Identity Match'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
