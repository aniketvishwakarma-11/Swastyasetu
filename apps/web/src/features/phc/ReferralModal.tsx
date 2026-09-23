import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, ShieldAlert, HeartPulse, MapPin, UserCheck, AlertTriangle } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { localDb } from '../../lib/db';
import { useAuth } from '../../context/AuthContext';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isOnline: boolean;
  initialData?: {
    patientName?: string;
    age?: string;
    gender?: 'Male' | 'Female' | 'Other';
    phone?: string;
    village?: string;
    urgency?: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
    reason?: string;
    clinicalSummary?: string;
  } | null;
}

interface FacilityOption {
  id: string;
  name: string;
  type: string;
  district: string;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isOnline,
  initialData,
}) => {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [destinationFacilityId, setDestinationFacilityId] = useState('');
  const [urgency, setUrgency] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('ROUTINE');
  const [reason, setReason] = useState('');
  const [clinicalSummary, setClinicalSummary] = useState('');

  // Sync initialData when provided (e.g. from Rapid Vitals escalation)
  useEffect(() => {
    if (initialData && isOpen) {
      if (initialData.patientName) setName(initialData.patientName);
      if (initialData.age) setAge(initialData.age);
      if (initialData.gender) setGender(initialData.gender);
      if (initialData.phone) setPhone(initialData.phone);
      if (initialData.village) setVillage(initialData.village);
      if (initialData.urgency) setUrgency(initialData.urgency);
      if (initialData.reason) setReason(initialData.reason);
      if (initialData.clinicalSummary) setClinicalSummary(initialData.clinicalSummary);
    }
  }, [initialData, isOpen]);

  // Fetch facilities for destination dropdown
  useEffect(() => {
    async function loadFacilities() {
      const res = await apiRequest('/facilities');
      if (res.success && res.data) {
        setFacilities(res.data);
        // Default to first district hospital if available
        const dh = res.data.find((f: any) => f.type === 'DISTRICT_HOSPITAL');
        if (dh) setDestinationFacilityId(dh.id);
        else if (res.data.length > 0) setDestinationFacilityId(res.data[0].id);
        // Fallback demo facilities if offline / API unreachable
        setFacilities([
          { id: '4bc1557c-065a-4d59-921d-34af559e2e54', name: 'Aundh District Hospital, Pune', type: 'DISTRICT_HOSPITAL', district: 'Pune' },
          { id: '7bc00d00-e0f3-4f8d-b0f3-31f99d33f1aa', name: 'Sanjivani Community Clinic, Pune', type: 'PRIVATE_CLINIC', district: 'Pune' },
        ]);
        setDestinationFacilityId('4bc1557c-065a-4d59-921d-34af559e2e54');
      }
    }

    if (isOpen) {
      loadFacilities();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1-Click Load Demo Scenario: "Ramesh Yadav" Emergency Case
  const handleLoadDemo = () => {
    setName('Ramesh Yadav');
    setAge('47');
    setGender('Male');
    setPhone('+91 98220 12345');
    setVillage('Khed, Pune');
    setUrgency('EMERGENCY');
    setReason('Acute Coronary Syndrome (Suspected STEMI)');
    setClinicalSummary(
      '47M presented with severe retrosternal crushing chest pain radiating to left arm for 2 hours, sweating, dyspnea. BP 160/100 mmHg, HR 102 bpm, SpO2 93% on room air. ECG shows ST elevation in leads V1-V4. Administered Aspirin 300mg, Clopidogrel 300mg, Atorvastatin 80mg orally. Oxygen initiated at 4L/min. Urgent Cath Lab evaluation requested.'
    );
    // Find Aundh or Sassoon hospital
    const targetFacility = facilities.find((f) => f.name.toLowerCase().includes('aundh') || f.type === 'DISTRICT_HOSPITAL');
    if (targetFacility) {
      setDestinationFacilityId(targetFacility.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !age || !village.trim() || !destinationFacilityId || !reason.trim() || !clinicalSummary.trim()) {
      setFormError('Please fill in all required patient and clinical fields.');
      return;
    }

    setIsSubmitting(true);

    const clientLocalId = `LOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const clientEventId = `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const referralNumber = `RF-${Math.floor(1000 + Math.random() * 9000)}`;

    const referralPayload = {
      patient: {
        localId: clientLocalId,
        name: name.trim(),
        age: Number(age),
        gender,
        phone: phone.trim() || undefined,
        village: village.trim(),
      },
      sourceFacilityId: user?.facilityId || '8ffa5608-7ed5-4853-9eb9-c06f995ce560',
      destinationFacilityId,
      urgency,
      reason: reason.trim(),
      clinicalSummary: clinicalSummary.trim(),
      eventId: clientEventId,
    };

    try {
      if (isOnline) {
        // Direct Online Submission
        const res = await apiRequest('/referrals', {
          method: 'POST',
          body: JSON.stringify(referralPayload),
        });

        if (res.success && res.data) {
          // Cache to IndexedDB as SYNCED
          await localDb.referrals.put({
            localId: clientEventId,
            id: res.data.id,
            referralNumber: res.data.referralNumber || referralNumber,
            patientId: res.data.patientId,
            patient: res.data.patient,
            sourceFacilityId: res.data.sourceFacilityId,
            destinationFacilityId: res.data.destinationFacilityId,
            urgency: res.data.urgency,
            reason: res.data.reason,
            clinicalSummary: res.data.clinicalSummary,
            status: res.data.status,
            createdBy: user?.id || 'doc',
            createdAt: res.data.createdAt,
            updatedAt: res.data.updatedAt,
            syncStatus: 'SYNCED',
            lastSyncedAt: new Date().toISOString(),
          });

          onSuccess();
          onClose();
          return;
        }
      }

      // Offline or network fallback: Save to Dexie IndexedDB Queue
      const localReferralRecord = {
        localId: clientEventId,
        referralNumber,
        patientId: clientLocalId,
        patient: {
          id: clientLocalId,
          localId: clientLocalId,
          name: name.trim(),
          age: Number(age),
          gender,
          phone: phone.trim(),
          village: village.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        sourceFacilityId: user?.facilityId || 'PHC-KHED',
        destinationFacilityId,
        urgency,
        reason: reason.trim(),
        clinicalSummary: clinicalSummary.trim(),
        status: 'QUEUED' as const,
        createdBy: user?.id || 'doc',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'QUEUED' as const,
      };

      await localDb.referrals.put(localReferralRecord);

      // Queue in syncQueue
      await localDb.syncQueue.put({
        id: clientEventId,
        eventId: clientEventId,
        entityType: 'REFERRAL',
        entityId: clientEventId,
        operation: 'CREATE',
        payload: referralPayload,
        status: 'PENDING',
        retryCount: 0,
        createdAt: new Date().toISOString(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[Referral submit error]', err);
      setFormError(err.message || 'Failed to dispatch referral. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create Digital Referral</h2>
              <p className="text-xs text-slate-500">
                Primary Health Centre: <span className="font-semibold text-slate-700">{user?.facility?.name || 'PHC Khed'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleLoadDemo}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
              title="Autofill emergency case for Ramesh Yadav"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Ramesh Yadav Demo</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Patient Demographics */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Patient Identification</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Yadav"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Age <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="47"
                  min="0"
                  max="125"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98220 12345"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Village / Locality <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Khed, Pune"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Details & Urgency */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Clinical Triage & Destination</span>
            </h3>

            <div className="space-y-4">
              {/* Urgency Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Referral Urgency <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setUrgency('ROUTINE')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                      urgency === 'ROUTINE'
                        ? 'bg-slate-100 border-slate-400 text-slate-900 ring-2 ring-slate-300'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Routine</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('URGENT')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                      urgency === 'URGENT'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-300'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-amber-50/50'
                    }`}
                  >
                    <span>Urgent (24-48h)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('EMERGENCY')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                      urgency === 'EMERGENCY'
                        ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-300'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-rose-50/50'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Emergency (Immediate)</span>
                  </button>
                </div>
              </div>

              {/* Destination Facility */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>Destination Healthcare Facility</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={destinationFacilityId}
                  onChange={(e) => setDestinationFacilityId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                  required
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.type.replace('_', ' ')}) - {fac.district}
                    </option>
                  ))}
                </select>
              </div>

              {/* Primary Complaint / Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Referral / Provisional Diagnosis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Acute Coronary Syndrome (Suspected STEMI)"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>

              {/* Clinical Summary & Treatments Administered */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Summary, Vitals & Emergency Treatment Administered <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={clinicalSummary}
                  onChange={(e) => setClinicalSummary(e.target.value)}
                  placeholder="Document vitals (BP, SpO2, Pulse), key observations, and pre-referral medication given..."
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}
              />
              <span className="text-xs text-slate-500 font-medium">
                {isOnline ? 'Direct Cloud Dispatch' : 'Offline Mode (Local Queue)'}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Referral'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
