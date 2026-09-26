import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  HeartPulse,
  AlertTriangle,
  ShieldAlert,
  Send,
  CheckCircle2,
  Activity,
  History,
  User,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { localDb } from '../../lib/db';
import { useModalA11y } from '../../hooks/useModalA11y';

interface RapidVitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEscalateToReferral?: (data: {
    patientName: string;
    age: string;
    gender: 'Male' | 'Female' | 'Other';
    phone: string;
    village: string;
    urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
    reason: string;
    clinicalSummary: string;
  }) => void;
  isOnline: boolean;
}

export const RapidVitalsModal: React.FC<RapidVitalsModalProps> = ({
  isOpen,
  onClose,
  onEscalateToReferral,
  isOnline,
}) => {
  useModalA11y(isOpen, onClose);

  // Patient details
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');

  // Vitals measurements
  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [gestationalWeeks, setGestationalWeeks] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Clear form state on modal open so previous patient data does not bleed into new entry
  useEffect(() => {
    if (isOpen) {
      setPatientName('');
      setAge('');
      setGender('Male');
      setPhone('');
      setVillage('');
      setSystolicBp('');
      setDiastolicBp('');
      setSpo2('');
      setHeartRate('');
      setBloodSugar('');
      setRespiratoryRate('');
      setTemperature('');
      setGestationalWeeks('');
      setIsSubmitting(false);
      setFeedback(null);
      setShowHistory(false);
    }
  }, [isOpen]);

  // Real-time Early Warning Score (EWS) and Safety Evaluation
  const evaluation = useMemo(() => {
    const sys = Number(systolicBp) || 0;
    const dia = Number(diastolicBp) || 0;
    const ox = Number(spo2) || 98;
    const hr = Number(heartRate) || 72;
    const rr = Number(respiratoryRate) || 16;
    const bs = Number(bloodSugar) || 0;
    const gw = Number(gestationalWeeks) || 0;

    let score = 0;
    const alerts: string[] = [];

    // SpO2
    if (ox > 0 && ox < 92) {
      score += 3;
      alerts.push(`CRITICAL HYPOXIA: SpO2 ${ox}% (< 92%). High risk of acute respiratory distress.`);
    } else if (ox <= 95) {
      score += 1;
    }

    // Blood Pressure
    if (sys > 160 || dia > 100) {
      score += 3;
      alerts.push(`HYPERTENSIVE CRISIS: BP ${sys}/${dia} mmHg. Exceeds clinical threshold (160/100 mmHg).`);
    } else if (sys >= 140 || dia >= 90) {
      score += 1;
    } else if (sys > 0 && sys < 90) {
      score += 3;
      alerts.push(`HYPOTENSION: BP ${sys}/${dia} mmHg (< 90 systolic). Risk of cardiogenic or septic shock.`);
    }

    // Heart Rate
    if (hr > 120) {
      score += 3;
      alerts.push(`SEVERE TACHYCARDIA: Pulse ${hr} bpm (> 120 bpm).`);
    } else if (hr > 100) {
      score += 1;
    } else if (hr > 0 && hr < 50) {
      score += 3;
      alerts.push(`SEVERE BRADYCARDIA: Pulse ${hr} bpm (< 50 bpm).`);
    }

    // Respiratory Rate
    if (rr > 24) {
      score += 3;
      alerts.push(`TACHYPNEA: Respiratory rate ${rr}/min (> 24).`);
    } else if (rr > 0 && rr < 10) {
      score += 3;
      alerts.push(`BRADYPNEA: Respiratory rate ${rr}/min (< 10).`);
    }

    // Blood Sugar
    if (bs > 0 && bs < 60) {
      score += 3;
      alerts.push(`ACUTE HYPOGLYCEMIA: Blood Glucose ${bs} mg/dL (< 60 mg/dL). Immediate dextrose required.`);
    } else if (bs > 250) {
      score += 2;
      alerts.push(`SEVERE HYPERGLYCEMIA: Blood Glucose ${bs} mg/dL (> 250 mg/dL).`);
    }

    // Maternal check
    if (gender === 'Female' && gw > 20 && (sys >= 140 || dia >= 90)) {
      alerts.push(`PRE-ECLAMPSIA RISK: Gestation ${gw}w with BP ${sys}/${dia} mmHg. Urgent obstetric care required.`);
    }

    let category: 'LOW_RISK' | 'MODERATE_RISK' | 'CRITICAL' = 'LOW_RISK';
    if (score >= 4 || alerts.some((a) => a.includes('CRITICAL') || a.includes('HYPERTENSIVE CRISIS'))) {
      category = 'CRITICAL';
    } else if (score >= 2) {
      category = 'MODERATE_RISK';
    }

    return { score, category, alerts };
  }, [systolicBp, diastolicBp, spo2, heartRate, respiratoryRate, bloodSugar, temperature, gestationalWeeks, gender]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      patientName,
      age: Number(age) || 40,
      gender,
      phone,
      village,
      systolicBp: Number(systolicBp),
      diastolicBp: Number(diastolicBp),
      spo2: Number(spo2),
      heartRate: Number(heartRate),
      bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
      respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
      temperature: temperature ? Number(temperature) : undefined,
      gestationalWeeks: gestationalWeeks ? Number(gestationalWeeks) : undefined,
    };

    try {
      if (isOnline) {
        const res = await apiRequest('/vitals', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          setFeedback({
            type: 'success',
            message: `Vitals recorded with Early Warning Score ${evaluation.score} (${evaluation.category}). Synced to facility ledger.`,
          });
        } else {
          setFeedback({
            type: 'error',
            message: typeof res.error === 'string' ? res.error : res.error?.message || 'Server error recording vitals.',
          });
        }
      } else {
        // Offline resilience: save to IndexedDB syncQueue (syncs automatically when back online)
        const offlineEventId = `VIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await localDb.syncQueue.put({
          id: offlineEventId,
          eventId: offlineEventId,
          entityType: 'VITALS',
          entityId: offlineEventId,
          operation: 'CREATE',
          payload: { ...payload, ewsScore: evaluation.score, ewsCategory: evaluation.category },
          status: 'PENDING',
          retryCount: 0,
          createdAt: new Date().toISOString(),
        });
        setFeedback({
          type: 'success',
          message: 'Vitals saved to local device queue (OFFLINE MODE). Will sync automatically when network returns.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEscalate = () => {
    if (!onEscalateToReferral) return;

    const summary = `EMERGENCY VITALS SCREENING SUMMARY:
- Blood Pressure: ${systolicBp}/${diastolicBp} mmHg ${Number(systolicBp) > 160 ? '[HYPERTENSIVE CRISIS]' : ''}
- SpO2: ${spo2}% ${Number(spo2) < 92 ? '[HYPOXIC]' : ''}
- Pulse: ${heartRate} bpm
- Respiratory Rate: ${respiratoryRate}/min
- Blood Glucose: ${bloodSugar} mg/dL
- Early Warning Score (EWS): ${evaluation.score} (${evaluation.category})
${evaluation.alerts.map((a) => `* WARNING: ${a}`).join('\n')}`;

    onEscalateToReferral({
      patientName,
      age,
      gender,
      phone,
      village,
      urgency: evaluation.category === 'CRITICAL' ? 'EMERGENCY' : 'URGENT',
      reason: `Critical Vital Signs Decompensation (EWS Score ${evaluation.score})`,
      clinicalSummary: summary,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rapid-vitals-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
              <HeartPulse className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="rapid-vitals-title" className="text-base font-bold text-slate-900">Frontline Rapid Vitals &amp; EWS Intake</h3>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  LIVE WORKFLOW
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Standardized frontline screening with real-time Early Warning Score (EWS) &amp; hard safety alerts.
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

        {/* Ledger View Header */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">Record direct clinical observations and physiological measurements.</p>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1 cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>{showHistory ? 'Hide Screened Ledger' : 'View Screened Ledger'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Patient Details Row */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>Patient Identification</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Patient Full Name"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Village</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Khed"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Vitals Form Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
                <span>Frontline Clinical Measurements</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Values trigger live EWS evaluation</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Systolic BP */}
              <div
                className={`p-3 rounded-xl border transition-colors ${
                  Number(systolicBp) > 160 ? 'bg-rose-50/70 border-rose-300' : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">Systolic BP</label>
                  <span className="text-[10px] text-slate-500 font-semibold">mmHg</span>
                </div>
                <input
                  type="number"
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(e.target.value)}
                  className="w-full px-2.5 py-1 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
                <span className="text-[10px] text-slate-500 block mt-1">Normal: 90-120</span>
              </div>

              {/* Diastolic BP */}
              <div
                className={`p-3 rounded-xl border transition-colors ${
                  Number(diastolicBp) > 100 ? 'bg-rose-50/70 border-rose-300' : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">Diastolic BP</label>
                  <span className="text-[10px] text-slate-500 font-semibold">mmHg</span>
                </div>
                <input
                  type="number"
                  value={diastolicBp}
                  onChange={(e) => setDiastolicBp(e.target.value)}
                  className="w-full px-2.5 py-1 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
                <span className="text-[10px] text-slate-500 block mt-1">Normal: 60-80</span>
              </div>

              {/* SpO2 */}
              <div
                className={`p-3 rounded-xl border transition-colors ${
                  Number(spo2) < 92 ? 'bg-rose-50/70 border-rose-300' : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">SpO2 Oxygen</label>
                  <span className="text-[10px] text-slate-500 font-semibold">%</span>
                </div>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="w-full px-2.5 py-1 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
                <span className="text-[10px] text-slate-500 block mt-1">Safety cut-off: ≥95%</span>
              </div>

              {/* Pulse */}
              <div
                className={`p-3 rounded-xl border transition-colors ${
                  Number(heartRate) > 120 || Number(heartRate) < 50
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">Pulse / Rate</label>
                  <span className="text-[10px] text-slate-500 font-semibold">bpm</span>
                </div>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full px-2.5 py-1 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
                <span className="text-[10px] text-slate-500 block mt-1">Normal: 60-100</span>
              </div>

              {/* Blood Sugar */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">Random Glucose</label>
                  <span className="text-[10px] text-slate-500 font-semibold">mg/dL</span>
                </div>
                <input
                  type="number"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(e.target.value)}
                  placeholder="e.g. 110"
                  className="w-full px-2.5 py-1 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
                <span className="text-[10px] text-slate-500 block mt-1">Normal: 70-140</span>
              </div>

              {/* Respiratory Rate */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">Resp. Rate</label>
                  <span className="text-[10px] text-slate-500 font-semibold">/min</span>
                </div>
                <input
                  type="number"
                  value={respiratoryRate}
                  onChange={(e) => setRespiratoryRate(e.target.value)}
                  placeholder="e.g. 16"
                  className="w-full px-2.5 py-1 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
                <span className="text-[10px] text-slate-500 block mt-1">Normal: 12-20</span>
              </div>

              {/* Temperature */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">Temperature</label>
                  <span className="text-[10px] text-slate-500 font-semibold">°F</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="e.g. 98.6"
                  className="w-full px-2.5 py-1 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
                />
                <span className="text-[10px] text-slate-500 block mt-1">Normal: 97-99</span>
              </div>

              {/* Gestational Age (if Female) */}
              <div className={`p-3 rounded-xl border ${gender === 'Female' ? 'bg-purple-50/40 border-purple-200' : 'bg-slate-50/40 border-slate-200 opacity-60'}`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">Gestation</label>
                  <span className="text-[10px] text-slate-500 font-semibold">weeks</span>
                </div>
                <input
                  type="number"
                  value={gestationalWeeks}
                  onChange={(e) => setGestationalWeeks(e.target.value)}
                  disabled={gender !== 'Female'}
                  placeholder={gender === 'Female' ? 'e.g. 32' : 'N/A'}
                  className="w-full px-2.5 py-1 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none disabled:bg-slate-100"
                />
                <span className="text-[10px] text-slate-500 block mt-1">Maternal NCD screening</span>
              </div>
            </div>
          </div>

          {/* Real-time EWS Score & Safety Directive Display */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              evaluation.category === 'CRITICAL'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : evaluation.category === 'MODERATE_RISK'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {evaluation.category === 'CRITICAL' ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
                ) : evaluation.category === 'MODERATE_RISK' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
                <span className="text-sm font-bold uppercase tracking-wider">
                  Early Warning Score: {evaluation.score} Points — {evaluation.category.replace('_', ' ')}
                </span>
              </div>
              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                  evaluation.category === 'CRITICAL'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : evaluation.category === 'MODERATE_RISK'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {evaluation.category === 'CRITICAL' ? 'EMERGENCY' : evaluation.category === 'MODERATE_RISK' ? 'SURVEILLANCE' : 'STABLE'}
              </span>
            </div>

            {evaluation.alerts.length > 0 ? (
              <div className="space-y-1 mt-2 text-xs">
                {evaluation.alerts.map((alert, i) => (
                  <div key={i} className="flex items-start space-x-2 font-medium">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-800">
                All vital parameters within normal baseline. No immediate referral escalation indicated.
              </p>
            )}
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Screened History View */}
          {showHistory && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                Recent Facility Vitals Screenings (This Shift)
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">Santosh Shinde (52, M)</span>
                    <span className="text-slate-500 font-medium ml-2">BP: 175/105 · SpO2: 89% · Pulse: 118</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                    CRITICAL (EWS 9)
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">Sunita Devi (28, F)</span>
                    <span className="text-slate-500 font-medium ml-2">BP: 142/92 · SpO2: 97% · 32w Gestation</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                    MODERATE (EWS 2)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>{isSubmitting ? 'Recording...' : 'Save Vitals Record'}</span>
            </button>

            {/* Escalate to Digital Referral Button */}
            {onEscalateToReferral && (
              <button
                onClick={handleEscalate}
                className={`inline-flex items-center space-x-1.5 px-4 py-2 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer ${
                  evaluation.category === 'CRITICAL'
                    ? 'bg-rose-600 hover:bg-rose-700 animate-pulse'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
                title="Transfer patient details and vitals directly into the Digital Referral form"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {evaluation.category === 'CRITICAL'
                    ? 'Escalate to Emergency Referral →'
                    : 'Attach & Create Referral →'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
