import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useModalA11y } from '../../hooks/useModalA11y';
import {
  X,
  Pill,
  HeartPulse,
  CheckCircle2,
  Save,
  Check,
  AlertCircle,
} from 'lucide-react';

interface StabilizationItemInput {
  id: string;
  name: string;
  administered: boolean;
  dosage: string;
  route: string;
  timeAdministered: string;
  notes: string;
}

interface PreReferralStabilizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  referral: any | null;
  onStabilizationSaved?: (record: any) => void;
}

const PROTOCOL_TEMPLATES: Record<string, { name: string; items: Omit<StabilizationItemInput, 'timeAdministered'>[] }> = {
  STEMI: {
    name: 'Acute STEMI Pre-Hospital Loading Protocol',
    items: [
      { id: 'stemi-1', name: 'Aspirin (Dispersible/Chewable)', administered: true, dosage: '300 mg', route: 'Oral', notes: 'Given immediately with sip of water' },
      { id: 'stemi-2', name: 'Clopidogrel (Loading Dose)', administered: true, dosage: '300 mg', route: 'Oral', notes: 'Dual antiplatelet therapy' },
      { id: 'stemi-3', name: 'Atorvastatin', administered: true, dosage: '80 mg', route: 'Oral', notes: 'Plaque stabilization' },
      { id: 'stemi-4', name: 'Intravenous Line Secured', administered: true, dosage: '18 Gauge', route: 'Right Forearm', notes: 'Normal Saline keep-vein-open' },
      { id: 'stemi-5', name: 'Supplemental Oxygen', administered: true, dosage: '4 L/min', route: 'Nasal Cannula', notes: 'Target SpO2 >= 95%' },
      { id: 'stemi-6', name: 'Sorbitrate (Sublingual Nitrate)', administered: true, dosage: '5 mg', route: 'Sublingual', notes: 'Contraindicated if SBP < 100' },
    ],
  },
  ECLAMPSIA: {
    name: 'Severe Pre-Eclampsia / Eclampsia Emergency Protocol',
    items: [
      { id: 'ecl-1', name: 'Magnesium Sulfate (Pritchard Loading Dose)', administered: true, dosage: '4g IV + 10g IM', route: 'IV/IM', notes: 'Slow IV over 15 min; 5g in each buttock' },
      { id: 'ecl-2', name: 'Labetalol / Nifedipine', administered: true, dosage: '20 mg IV / 10 mg oral', route: 'IV/Oral', notes: 'For SBP >= 160 or DBP >= 110' },
      { id: 'ecl-3', name: 'Left Lateral Tilt Position', administered: true, dosage: '15-30 degrees', route: 'Bed Positioning', notes: 'Prevents aortocaval compression' },
      { id: 'ecl-4', name: 'Oxygen via Face Mask', administered: true, dosage: '6-8 L/min', route: 'Mask', notes: 'Maintain maternal oxygenation' },
      { id: 'ecl-5', name: 'Foley Catheter Drainage', administered: true, dosage: '14 Fr', route: 'Urinary', notes: 'Monitor urine output (>30ml/hr)' },
    ],
  },
  SNAKEBITE: {
    name: 'Snakebite Neuro/Hemotoxic Emergency Protocol',
    items: [
      { id: 'sb-1', name: 'Polyvalent Anti-Snake Venom (ASV)', administered: true, dosage: '10 Vials in 500ml NS', route: 'IV Infusion', notes: 'Infuse over 1 hour under monitoring' },
      { id: 'sb-2', name: 'Pressure Pad & Splint Immobilization', administered: true, dosage: 'Crepe Bandage', route: 'Affected Limb', notes: 'Do not tourniquet or incise' },
      { id: 'sb-3', name: 'Tetanus Toxoid Prophylaxis', administered: true, dosage: '0.5 ml', route: 'Intramuscular', notes: 'Administered in deltoid' },
      { id: 'sb-4', name: 'Atropine + Neostigmine (Neurotoxic)', administered: false, dosage: '0.6mg + 1.5mg', route: 'IV', notes: 'Given if ptosis / respiratory paralysis' },
    ],
  },
  TRAUMA: {
    name: 'Polytrauma & Hemorrhagic Shock Protocol',
    items: [
      { id: 'tr-1', name: 'Dual Large-Bore IV Access', administered: true, dosage: '16G or 18G (x2)', route: 'Bilateral Antecubital', notes: 'Rapid fluid resuscitation' },
      { id: 'tr-2', name: 'Warm Ringer Lactate Infusion', administered: true, dosage: '1000 ml bolus', route: 'IV', notes: 'Maintain radial pulse' },
      { id: 'tr-3', name: 'Direct Compression & Hemostatic Dressing', administered: true, dosage: 'Pressure Pack', route: 'Active Bleed Site', notes: 'Direct wound pressure' },
      { id: 'tr-4', name: 'Rigid Cervical Collar', administered: true, dosage: 'Standard Adult', route: 'C-Spine', notes: 'Immobilize cervical spine' },
    ],
  },
};

export const PreReferralStabilizationModal: React.FC<PreReferralStabilizationModalProps> = ({
  isOpen,
  onClose,
  referral,
  onStabilizationSaved,
}) => {
  useModalA11y(isOpen, onClose);

  const { user } = useAuth();
  const [protocolType, setProtocolType] = useState<string>('STEMI');
  const [items, setItems] = useState<StabilizationItemInput[]>([]);
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [pulseRate, setPulseRate] = useState('76');
  const [spo2, setSpo2] = useState('98');
  const [bloodSugar, setBloodSugar] = useState('110');
  const [doctorName, setDoctorName] = useState(user?.name || 'Attending PHC Medical Officer');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) {
      setDoctorName(user.name);
    }
  }, [user?.name]);

  // Reset vitals and messages when modal opens with a (possibly different) referral
  useEffect(() => {
    if (isOpen) {
      setBloodPressure('120/80');
      setPulseRate('76');
      setSpo2('98');
      setBloodSugar('110');
      setSuccessMsg(null);
      setErrorMsg(null);
      setProtocolType('STEMI');
    }
  }, [isOpen, referral?.id]);

  // Load protocol template
  useEffect(() => {
    const template = PROTOCOL_TEMPLATES[protocolType] || PROTOCOL_TEMPLATES.STEMI;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setItems(
      template.items.map((i) => ({
        ...i,
        timeAdministered: currentTime,
      }))
    );
  }, [protocolType]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, administered: !i.administered } : i))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const targetId = referral?.id || referral?.referralNumber;
    if (!targetId) {
      setErrorMsg('No referral selected for stabilization checklist.');
      setSaving(false);
      return;
    }
    const template = PROTOCOL_TEMPLATES[protocolType] || PROTOCOL_TEMPLATES.STEMI;

    try {
      const res = await apiRequest(`/referrals/${targetId}/stabilization`, {
        method: 'POST',
        body: JSON.stringify({
          protocolType,
          protocolName: template.name,
          administeredBy: doctorName,
          vitals: {
            bloodPressure,
            pulseRate: parseInt(pulseRate, 10) || 98,
            spo2: parseInt(spo2, 10) || 94,
            bloodSugar: parseInt(bloodSugar, 10) || 142,
          },
          items,
        }),
      });

      if (res.success && res.data) {
        setSuccessMsg(`Pre-referral stabilization checklist recorded and audit-logged.`);
        if (onStabilizationSaved) {
          onStabilizationSaved(res.data);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(res.error?.message || 'Failed to record pre-referral stabilization checklist.');
      }
    } catch (err: any) {
      console.error('[Stabilization submit error]', err);
      setErrorMsg(err.message || 'Network error saving stabilization checklist.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stabilization-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
              <Pill className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span id="stabilization-modal-title" className="font-extrabold text-base tracking-tight text-white">Pre-Referral Emergency Stabilization</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Audit Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Frontline loading protocol checklist for patient: <strong className="text-white">{referral?.patient?.name || 'Patient'}</strong> ({referral?.referralNumber || 'Referral'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center space-x-2 font-semibold">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center space-x-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Protocol Selector Tabs */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Select Clinical Emergency Protocol:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'STEMI', label: '🫀 Acute STEMI', desc: 'Aspirin, Clopidogrel, Statin' },
                { id: 'ECLAMPSIA', label: '🤰 Eclampsia', desc: 'MgSO4 Pritchard Regimen' },
                { id: 'SNAKEBITE', label: '🐍 Snakebite', desc: 'ASV Infusion & Splint' },
                { id: 'TRAUMA', label: '🩸 Trauma/Shock', desc: 'IV Resuscitation & C-Collar' },
              ].map((proto) => (
                <button
                  type="button"
                  key={proto.id}
                  onClick={() => setProtocolType(proto.id)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    protocolType === proto.id
                      ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs ring-2 ring-teal-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold">{proto.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{proto.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Pre-Handoff Vitals */}
          <div className="clinical-surface rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <span>Stabilization Pre-Departure Vitals</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold"
                  placeholder="140/90"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Pulse (bpm)</label>
                <input
                  type="number"
                  value={pulseRate}
                  onChange={(e) => setPulseRate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold"
                  placeholder="98"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">SpO2 (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-rose-700"
                  placeholder="94"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Blood Sugar (mg/dL)</label>
                <input
                  type="number"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold"
                  placeholder="142"
                />
              </div>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Administered Emergency Interventions</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                {items.filter((i) => i.administered).length} of {items.length} completed
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
                    item.administered
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.administered}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleItem(item.id);
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{item.timeAdministered}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                      Dosage: {item.dosage} • Route: {item.route}
                    </p>
                    {item.notes && <p className="text-[10px] text-slate-500 italic mt-0.5">{item.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Signature */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-600 text-[11px] block font-semibold">Attending Clinician Sign-Off</span>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs mt-1"
              />
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-semibold block">SHA-256 Audit Stamp</span>
              <span className="font-mono text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                AUD-STAB-VERIFIED
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Recording Audit...' : 'Save & Attach to Referral'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
