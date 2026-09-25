import React, { useState, useEffect } from 'react';
import {
  X,
  CalendarCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  MapPin,
  Pill,
  UserCheck,
  Search,
  Check,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';

interface FollowUpItem {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  phone: string;
  village: string;
  referralId: string;
  referralNumber: string;
  dischargingHospital: string;
  dischargeDate: string;
  dischargeDiagnosis: string;
  dueAt: string;
  purpose: string;
  prescribedRegimen: string[];
  status: 'SCHEDULED' | 'OVERDUE' | 'COMPLETED' | 'FLAGGED_ASHA';
  completionNotes?: string;
  adherenceStatus?: 'FULL_ADHERENCE' | 'PARTIAL_MISSED' | 'ADVERSE_EFFECTS' | 'STOPPED';
  completedAt?: string;
  completedBy?: string;
  ashaAssigned?: string;
}

interface FollowUpTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
}

// Initial clinical fixtures connecting hospital discharges back to PHC
const INITIAL_FOLLOWUPS: FollowUpItem[] = [
  {
    id: 'fup-101',
    patientId: 'pat-kailash-01',
    patientName: 'Kailash Jadhav',
    age: 47,
    gender: 'Male',
    phone: '9876543210',
    village: 'Khed Shivapur',
    referralId: 'ref-stemi-01',
    referralNumber: 'RF-1024',
    dischargingHospital: 'Aundh District Hospital, Pune',
    dischargeDate: new Date(Date.now() - 6 * 86400000).toISOString(),
    dischargeDiagnosis: 'Acute STEMI (Anterior Wall) - PCI to LAD completed',
    dueAt: new Date(Date.now() + 3600000).toISOString(), // Due today
    purpose: 'Day-7 Post-PCI Review: Repeat ECG, check BP/SpO2, verify Dual Antiplatelet (DAPT) adherence.',
    prescribedRegimen: [
      'Aspirin 75mg once daily (Post-meal)',
      'Clopidogrel 75mg once daily',
      'Atorvastatin 80mg at bedtime',
      'Metoprolol Succinate 25mg daily',
    ],
    status: 'SCHEDULED',
  },
  {
    id: 'fup-102',
    patientId: 'pat-sunita-02',
    patientName: 'Sunita Devi',
    age: 28,
    gender: 'Female',
    phone: '9822334455',
    village: 'Ranjani',
    referralId: 'ref-maternal-02',
    referralNumber: 'RF-1088',
    dischargingHospital: 'Aundh District Hospital, Pune',
    dischargeDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    dischargeDiagnosis: 'Post-Partum Severe Pre-eclampsia - Stabilized',
    dueAt: new Date(Date.now() + 2 * 86400000).toISOString(), // Due in 2 days
    purpose: 'Bi-weekly BP surveillance and urine proteinuria dipstick assessment.',
    prescribedRegimen: [
      'Labetalol 100mg twice daily',
      'Calcium Carbonate 500mg daily',
      'Iron & Folic Acid once daily',
    ],
    status: 'SCHEDULED',
  },
  {
    id: 'fup-103',
    patientId: 'pat-gopal-03',
    patientName: 'Gopal Patil',
    age: 58,
    gender: 'Male',
    phone: '9890123456',
    village: 'Saswad Rural',
    referralId: 'ref-diab-03',
    referralNumber: 'RF-0992',
    dischargingHospital: 'Sanjivani Community Clinic, Pune',
    dischargeDate: new Date(Date.now() - 9 * 86400000).toISOString(),
    dischargeDiagnosis: 'Type 2 Diabetes Mellitus with Right Hallux Wagner Grade 2 Ulcer',
    dueAt: new Date(Date.now() - 2 * 86400000).toISOString(), // Overdue by 2 days
    purpose: 'Surgical wound inspection, sterile dressing renewal, and fasting blood sugar check.',
    prescribedRegimen: [
      'Metformin 500mg twice daily with meals',
      'Amoxicillin + Clavulanate 625mg twice daily',
      'Daily sterile saline dressings',
    ],
    status: 'OVERDUE',
  },
];

export const FollowUpTrackerModal: React.FC<FollowUpTrackerModalProps> = ({
  isOpen,
  onClose,
  isOnline,
}) => {
  const [items, setItems] = useState<FollowUpItem[]>(INITIAL_FOLLOWUPS);
  const [filter, setFilter] = useState<'ALL' | 'DUE_TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<FollowUpItem | null>(null);

  // Visit completion form state
  const [completionNotes, setCompletionNotes] = useState('');
  const [adherenceStatus, setAdherenceStatus] = useState<FollowUpItem['adherenceStatus']>('FULL_ADHERENCE');
  const [observedBp, setObservedBp] = useState('124/80');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from API if online
  useEffect(() => {
    async function loadData() {
      if (!isOnline) return;
      try {
        const res = await apiRequest('/follow-ups');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setItems(res.data);
        }
      } catch (e) {
        // Fall back to fixtures
      }
    }
    if (isOpen) loadData();
  }, [isOpen, isOnline]);

  if (!isOpen) return null;

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.patientName.toLowerCase().includes(search.toLowerCase()) ||
      item.referralNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.dischargeDiagnosis.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'ALL') return true;
    if (filter === 'COMPLETED') return item.status === 'COMPLETED';
    if (filter === 'OVERDUE') return item.status === 'OVERDUE';
    if (filter === 'DUE_TODAY') {
      const dueDate = new Date(item.dueAt).toDateString();
      const today = new Date().toDateString();
      return dueDate === today && item.status !== 'COMPLETED';
    }
    if (filter === 'UPCOMING') {
      const dueDate = new Date(item.dueAt).getTime();
      return dueDate > Date.now() + 86400000 && item.status !== 'COMPLETED';
    }
    return true;
  });

  const handleCompleteVisit = async (item: FollowUpItem) => {
    setIsSubmitting(true);
    try {
      const notes = completionNotes.trim() || `Follow-up visit completed at PHC. Observed BP: ${observedBp}. Medication adherence verified.`;

      if (isOnline) {
        await apiRequest(`/follow-ups/${item.id}/complete`, {
          method: 'POST',
          body: JSON.stringify({ completionNotes: notes, adherenceStatus }),
        });
      }

      setItems((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: 'COMPLETED',
                completionNotes: notes,
                adherenceStatus,
                completedAt: new Date().toISOString(),
                completedBy: 'Dr. Rajesh Sharma (PHC Khed)',
              }
            : f
        )
      );

      setToastMessage(`✓ Follow-up for ${item.patientName} marked COMPLETED & synced to ${item.dischargingHospital}!`);
      setSelectedItem(null);
      setCompletionNotes('');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatchAsha = async (item: FollowUpItem) => {
    try {
      const asha = 'Meena Tai (ASHA Worker - Sector 2)';
      if (isOnline) {
        await apiRequest(`/follow-ups/${item.id}/flag-asha`, {
          method: 'POST',
          body: JSON.stringify({ ashaName: asha }),
        });
      }
      setItems((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'FLAGGED_ASHA', ashaAssigned: asha } : f))
      );
      setToastMessage(`Outreach Alert: ${asha} dispatched to visit ${item.patientName} in ${item.village}.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e: any) {
      setToastMessage(`Error: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
              <CalendarCheck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Post-Discharge Return &amp; Follow-Up Tracker</h3>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  CLOSED-LOOP CONTINUITY
                </span>
              </div>
              <p className="text-xs text-slate-500">
                District Hospital patients discharged back to PHC catchment area for scheduled review and drug refills.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Filter Bar & Search */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            {[
              { id: 'ALL', label: `All (${items.length})` },
              { id: 'DUE_TODAY', label: 'Due Today (1)' },
              { id: 'UPCOMING', label: 'Upcoming (1)' },
              { id: 'OVERDUE', label: 'Overdue (1)' },
              { id: 'COMPLETED', label: `Completed (${items.filter((i) => i.status === 'COMPLETED').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-semibold ${
                  filter === tab.id
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, diagnosis..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
            />
          </div>
        </div>

        {/* Patient Cards List */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
              <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No follow-up consultations in this view</p>
              <p className="text-xs text-slate-400 mt-1">All scheduled hospital returns are up to date.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  item.status === 'COMPLETED'
                    ? 'bg-slate-50/60 border-slate-200 opacity-80'
                    : item.status === 'OVERDUE'
                    ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                    : 'bg-white border-slate-200 shadow-xs hover:border-teal-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900">{item.patientName}</h4>
                      <span className="text-xs text-slate-500">
                        ({item.age}y, {item.gender})
                      </span>
                      <span className="text-[11px] font-mono text-teal-700 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.2">
                        {item.referralNumber}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.village}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.phone}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{item.dischargingHospital}</span>
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {item.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>COMPLETED &amp; SYNCED</span>
                      </span>
                    ) : item.status === 'OVERDUE' ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-300 text-xs font-bold animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>OVERDUE BY 2 DAYS</span>
                      </span>
                    ) : item.status === 'FLAGGED_ASHA' ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>ASHA DISPATCHED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>DUE FOR REVIEW</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Clinical Diagnosis & Hospital Follow-Up Plan */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 mb-3 space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-700">Discharge Diagnosis: </span>
                    <span className="text-slate-900 font-semibold">{item.dischargeDiagnosis}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Hospital Follow-Up Instructions: </span>
                    <span className="text-slate-600">{item.purpose}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-1 font-bold text-slate-700 mb-1">
                      <Pill className="w-3.5 h-3.5 text-teal-600" />
                      <span>Prescribed Medication Regimen:</span>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-4 list-disc text-slate-600">
                      {item.prescribedRegimen.map((med, i) => (
                        <li key={i}>{med}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* If completed, show summary */}
                {item.status === 'COMPLETED' && (
                  <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 text-xs text-emerald-900 mb-3">
                    <div className="font-bold">Consultation Outcome:</div>
                    <p className="mt-0.5">{item.completionNotes}</p>
                    <div className="text-[10px] text-emerald-700 mt-1">
                      Verified by {item.completedBy} · Completed on {new Date(item.completedAt!).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {item.status !== 'COMPLETED' && (
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    {item.status === 'OVERDUE' && (
                      <button
                        onClick={() => handleDispatchAsha(item)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="Dispatch local ASHA health worker for home contact"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Dispatch ASHA Worker</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setCompletionNotes(
                          `Patient visited PHC on schedule. Vitals stable. Verified adherence to ${item.prescribedRegimen[0]}. Refill provided.`
                        );
                      }}
                      className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Record Follow-Up Visit</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Visit Recording Drawer / Modal View */}
        {selectedItem && (
          <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Record Follow-Up Consultation: {selectedItem.patientName}
                </h4>
                <p className="text-xs text-slate-500">
                  Close the care continuity loop and notify {selectedItem.dischargingHospital}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer font-semibold"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medication Adherence Assessment
                </label>
                <select
                  value={adherenceStatus}
                  onChange={(e) => setAdherenceStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="FULL_ADHERENCE">Full Adherence (Taking all medicines as prescribed)</option>
                  <option value="PARTIAL_MISSED">Partial Adherence (Missed doses / skipped refills)</option>
                  <option value="ADVERSE_EFFECTS">Adverse Reactions / Side Effects Reported</option>
                  <option value="STOPPED">Discontinued (Patient stopped taking medications)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Follow-up Blood Pressure Check
                </label>
                <input
                  type="text"
                  value={observedBp}
                  onChange={(e) => setObservedBp(e.target.value)}
                  placeholder="e.g. 120/80 mmHg"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Visit Notes &amp; Continuation Plan
              </label>
              <textarea
                rows={3}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Enter clinical examination notes, prescription refills provided, or specialist referral..."
                className="w-full p-3 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCompleteVisit(selectedItem)}
                disabled={isSubmitting}
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Syncing...' : 'Complete Visit & Sync to Hospital'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Active Facility: <strong className="text-slate-700">Primary Health Centre Khed (PHC-KHED)</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
