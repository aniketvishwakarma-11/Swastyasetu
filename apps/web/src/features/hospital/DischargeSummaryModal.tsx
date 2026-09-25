import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Stethoscope,
  HeartPulse,
  Pill,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Printer,
  Sparkles,
  Plus,
  Trash2,
  Send,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export interface DischargeMedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
  instructions: string;
}

interface DischargeSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  referral?: any;
  onDischargeComplete?: (summary: any) => void;
}

export const DischargeSummaryModal: React.FC<DischargeSummaryModalProps> = ({
  isOpen,
  onClose,
  referral,
  onDischargeComplete,
}) => {
  const { user } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState<number | string>(45);
  const [gender, setGender] = useState('Male');
  const [village, setVillage] = useState('Khed Rural');
  const [phone, setPhone] = useState('9876543210');
  const [referralNumber, setReferralNumber] = useState('RF-1024');

  // Clinical Summary Fields
  const [admissionDate, setAdmissionDate] = useState(
    new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0]
  );
  const [dischargeDate, setDischargeDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [lengthOfStay, setLengthOfStay] = useState(4);

  const [primaryDiagnosis, setPrimaryDiagnosis] = useState(
    'Acute Anterior Wall ST-Elevation Myocardial Infarction (STEMI)'
  );
  const [icd10Code, setIcd10Code] = useState('I21.0');
  const [secondaryDiagnoses, setSecondaryDiagnoses] = useState(
    'Essential Hypertension (I10), Dyslipidemia (E78.5)'
  );
  const [clinicalCourse, setClinicalCourse] = useState(
    'Patient admitted in cardiogenic shock via 108 ambulance from PHC Khed. Emergency coronary angiography revealed 99% proximal LAD occlusion. Successful primary PCI with drug-eluting stent achieved TIMI 3 flow. Uncomplicated CCU recovery. Patient is pain-free, hemodynamically stable, and ambulating independently.'
  );
  const [proceduresPerformed, setProceduresPerformed] = useState(
    'Primary Percutaneous Coronary Intervention (PCI), Coronary Angiography, 2D Echocardiography (LVEF: 48%)'
  );

  // Discharge Vitals
  const [bp, setBp] = useState('118/76 mmHg');
  const [pulse, setPulse] = useState(68);
  const [spo2, setSpo2] = useState(99);
  const [temp, setTemp] = useState(98.4);
  const [rr, setRr] = useState(14);
  const [condition, setCondition] = useState<'STABLE' | 'IMPROVED' | 'GUARDED'>('STABLE');

  // Take-Home Medications
  const [medications, setMedications] = useState<DischargeMedicationItem[]>([
    {
      name: 'Tab. Aspirin',
      dosage: '75 mg',
      frequency: 'OD (Once Daily)',
      timing: 'After breakfast',
      duration: 'Life-long',
      instructions: 'Antiplatelet - Take strictly after meals',
    },
    {
      name: 'Tab. Clopidogrel',
      dosage: '75 mg',
      frequency: 'OD (Once Daily)',
      timing: 'After breakfast',
      duration: '12 Months',
      instructions: 'Antiplatelet - Dual protection for drug-eluting stent',
    },
    {
      name: 'Tab. Atorvastatin',
      dosage: '80 mg',
      frequency: 'OD (Once Daily)',
      timing: 'At bedtime',
      duration: 'Life-long',
      instructions: 'High-intensity statin for plaque stabilization',
    },
    {
      name: 'Tab. Metoprolol Succinate',
      dosage: '25 mg',
      frequency: 'OD (Once Daily)',
      timing: 'Morning',
      duration: 'Ongoing',
      instructions: 'Beta-blocker - Monitor pulse',
    },
    {
      name: 'Tab. Ramipril',
      dosage: '2.5 mg',
      frequency: 'OD (Once Daily)',
      timing: 'Morning',
      duration: 'Ongoing',
      instructions: 'Cardioprotective ACE inhibitor',
    },
  ]);

  // Advice & Red Flags
  const [dietAdvice, setDietAdvice] = useState(
    'Strict low-salt cardiac diet (<2g sodium/day). Avoid deep-fried, oily, and processed foods. 20-min daily gentle walking. Avoid heavy physical lifting >5kg for 3 weeks. Complete tobacco/smoking cessation.'
  );
  const [redFlags, setRedFlags] = useState(
    'Return immediately to nearest emergency room if experiencing: 1) Recurrent chest tightness or burning lasting >5 mins, 2) Sudden breathlessness at rest, 3) Dizziness or fainting spells, 4) Unexplained bleeding or black stools.'
  );

  // Closed-Loop PHC Follow-Up
  const [followUpDays, setFollowUpDays] = useState(7);
  const [followUpFacility, setFollowUpFacility] = useState('Primary Health Centre Khed');
  const [followUpPurpose, setFollowUpPurpose] = useState(
    'Day-7 Post-PCI Review: Repeat 12-lead ECG, assess vitals & radial access site, verify DAPT medication adherence.'
  );

  // Clinician Sign-Off (Hard Rule 3)
  const [isSigned, setIsSigned] = useState(false);
  const [clinicianNotes, setClinicianNotes] = useState('');

  // Auto-fill from referral when opened
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);

      if (referral) {
        setPatientName(referral.patient?.name || 'Ramesh Yadav');
        setAge(referral.patient?.age || 52);
        setGender(referral.patient?.gender || 'Male');
        setVillage(referral.patient?.village || 'Khed Shivapur');
        setPhone(referral.patient?.phone || '9876543210');
        setReferralNumber(referral.referralNumber || 'RF-1024');
        if (referral.sourceFacility?.name) {
          setFollowUpFacility(referral.sourceFacility.name);
        }
      }
    }
  }, [isOpen, referral]);

  if (!isOpen) return null;

  // Handler: Add custom medication row
  const handleAddMedication = () => {
    setMedications([
      ...medications,
      {
        name: '',
        dosage: '',
        frequency: 'OD',
        timing: 'After food',
        duration: '14 days',
        instructions: '',
      },
    ]);
  };

  // Handler: Remove medication row
  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, idx) => idx !== index));
  };

  // Handler: Update medication row
  const handleMedChange = (index: number, field: keyof DischargeMedicationItem, val: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: val };
    setMedications(updated);
  };

  // Preset Loader: Instant high-fidelity demo
  const loadStemiPreset = () => {
    setPatientName('Ramesh Yadav');
    setAge(52);
    setGender('Male');
    setVillage('Khed Shivapur');
    setPhone('9876543210');
    setReferralNumber(referral?.referralNumber || 'RF-1024');
    setPrimaryDiagnosis('Acute Anterior Wall ST-Elevation Myocardial Infarction (STEMI)');
    setIcd10Code('I21.0');
    setSecondaryDiagnoses('Essential Hypertension (I10), Dyslipidemia (E78.5)');
    setClinicalCourse(
      'Patient arrived via 108 ambulance from PHC Khed with acute anterior STEMI. Emergent coronary angiography revealed 99% thrombotic stenosis of proximal LAD. Successfully deployed 3.0 x 28 mm drug-eluting stent (DES) with TIMI 3 distal flow. Peak serum Troponin I: 44.8 ng/mL. Uncomplicated CCU recovery. Stable and pain-free at discharge.'
    );
    setProceduresPerformed(
      'Emergency Coronary Angiography, Primary PCI to LAD with DES, 2D Echocardiogram (LVEF: 48%)'
    );
    setBp('118/76 mmHg');
    setPulse(68);
    setSpo2(99);
    setTemp(98.4);
    setRr(14);
    setCondition('STABLE');
    setFollowUpDays(7);
    setFollowUpFacility('Primary Health Centre Khed');
    setFollowUpPurpose(
      'Day-7 Post-PCI Review: Repeat 12-lead ECG, assess vitals & radial access site, verify DAPT medication adherence.'
    );
    setIsSigned(true);
  };

  // Submission Handler
  const handleSaveAndDispatch = async () => {
    if (!patientName.trim() || !primaryDiagnosis.trim()) {
      setErrorMsg('Patient name and primary diagnosis are required.');
      return;
    }

    if (!isSigned) {
      setErrorMsg('Attending clinician verification and sign-off is mandatory under Clinical Rule 3.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const dueAtDate = new Date(Date.now() + followUpDays * 86400000).toISOString();

    const payload = {
      patientId: referral?.patientId || referral?.patient?.id || 'pat-ramesh-demo',
      patientName,
      age: Number(age),
      gender,
      village,
      phone,
      referralId: referral?.id,
      referralNumber,
      dischargingFacilityId: user?.facilityId || 'fac-dist-01',
      dischargingFacilityName: user?.facility?.name || 'Aundh District Hospital, Pune',
      consultantName: user?.name || 'Dr. Vikram Deshmukh',
      admissionDate,
      dischargeDate,
      lengthOfStayDays: Number(lengthOfStay),
      primaryDiagnosis,
      icd10Code,
      secondaryDiagnoses: secondaryDiagnoses.split(',').map((s) => s.trim()).filter(Boolean),
      clinicalCourse,
      proceduresPerformed: proceduresPerformed.split(',').map((s) => s.trim()).filter(Boolean),
      dischargeVitals: {
        bloodPressure: bp,
        pulseRate: Number(pulse),
        spo2: Number(spo2),
        temperature: Number(temp),
        respiratoryRate: Number(rr),
      },
      conditionAtDischarge: condition,
      medications: medications.filter((m) => m.name.trim().length > 0),
      dietAndActivityAdvice: dietAdvice,
      redFlagSymptoms: redFlags.split('\n').map((s) => s.trim()).filter(Boolean),
      followUpSchedule: {
        dueDays: followUpDays,
        dueAt: dueAtDate,
        assignedFacility: followUpFacility,
        purpose: followUpPurpose,
      },
      notes: clinicianNotes,
    };

    try {
      const res = await apiRequest('/discharge-summaries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        setSuccessMsg(
          `Discharge Summary ${res.data.id} created successfully! Closed-loop follow-up dispatched to ${followUpFacility}.`
        );
        if (onDischargeComplete) {
          onDischargeComplete(res.data);
        }
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMsg(res.error?.message || 'Failed to create discharge summary.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error saving discharge summary.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold">Standardized Clinical Discharge Summary</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  CLOSING THE LOOP
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                District Hospital Specialist Handoff • Pre-populates PHC Follow-Up Task
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadStemiPreset}
              className="px-2.5 py-1 bg-teal-600/40 hover:bg-teal-600/60 border border-teal-400/40 rounded-lg text-xs font-semibold text-teal-100 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Auto-fill with Ramesh Yadav STEMI clinical trial data"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Load STEMI Preset</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-1.5 text-teal-200 hover:text-white hover:bg-teal-700/50 rounded-lg transition-colors cursor-pointer"
              title="Print Summary"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-teal-200 hover:text-white hover:bg-teal-700/50 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-xs text-rose-800 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-xs">
          {/* Patient Demographic Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Patient Name</span>
              <p className="font-bold text-slate-900 text-sm">{patientName}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Demographics</span>
              <p className="font-semibold text-slate-700">{age} Yrs • {gender}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Village / Residence</span>
              <p className="font-semibold text-slate-700">{village}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Referral Ref</span>
              <p className="font-bold text-teal-700">{referralNumber}</p>
            </div>
          </div>

          {/* Section 1: Inpatient Stay & Diagnosis */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white shadow-xs">
            <div className="flex items-center space-x-2 text-teal-800 font-bold border-b pb-2 border-slate-100">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>1. Diagnosis & Clinical Course</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Primary Confirmed Diagnosis *
                </label>
                <input
                  type="text"
                  value={primaryDiagnosis}
                  onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  ICD-10 Code
                </label>
                <input
                  type="text"
                  value={icd10Code}
                  onChange={(e) => setIcd10Code(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-hidden font-mono"
                  placeholder="e.g. I21.0"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Secondary / Co-Morbid Diagnoses
              </label>
              <input
                type="text"
                value={secondaryDiagnoses}
                onChange={(e) => setSecondaryDiagnoses(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-hidden"
                placeholder="Comma separated"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Major Procedures & Interventions Performed
              </label>
              <input
                type="text"
                value={proceduresPerformed}
                onChange={(e) => setProceduresPerformed(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Inpatient Course & Treatment Summary
              </label>
              <textarea
                rows={2}
                value={clinicalCourse}
                onChange={(e) => setClinicalCourse(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Admission Date</label>
                <input
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Discharge Date</label>
                <input
                  type="date"
                  value={dischargeDate}
                  onChange={(e) => setDischargeDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Length of Stay (Days)</label>
                <input
                  type="number"
                  value={lengthOfStay}
                  onChange={(e) => setLengthOfStay(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Discharge Vitals & Physical Status */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white shadow-xs">
            <div className="flex items-center space-x-2 text-teal-800 font-bold border-b pb-2 border-slate-100">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              <span>2. Discharge Vitals & Clinical Status</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">BP (mmHg)</label>
                <input
                  type="text"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pulse (bpm)</label>
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">SpO2 (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Resp Rate (/min)</label>
                <input
                  type="number"
                  value={rr}
                  onChange={(e) => setRr(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e: any) => setCondition(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-teal-700 bg-white"
                >
                  <option value="STABLE">STABLE</option>
                  <option value="IMPROVED">IMPROVED</option>
                  <option value="GUARDED">GUARDED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Take-Home Prescribed Medications */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100">
              <div className="flex items-center space-x-2 text-teal-800 font-bold">
                <Pill className="w-4 h-4 text-emerald-600" />
                <span>3. Take-Home Prescribed Regimen</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {medications.length} items
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddMedication}
                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medication</span>
              </button>
            </div>

            <div className="space-y-2">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Medication name (e.g. Tab. Aspirin)"
                      value={med.name}
                      onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Dose (e.g. 75 mg)"
                      value={med.dosage}
                      onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <select
                      value={med.frequency}
                      onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700"
                    >
                      <option value="OD (Once Daily)">OD (Once Daily)</option>
                      <option value="BD (Twice Daily)">BD (Twice Daily)</option>
                      <option value="TDS (Thrice Daily)">TDS (Thrice Daily)</option>
                      <option value="QID (4 times/day)">QID (4 times/day)</option>
                      <option value="SOS (As Needed)">SOS (As Needed)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Timing / Instructions (e.g. After food)"
                      value={med.instructions}
                      onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700"
                    />
                  </div>

                  <div className="sm:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove Medication"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Closed-Loop PHC Follow-Up Dispatch */}
          <div className="border-2 border-teal-200 bg-teal-50/40 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b pb-2 border-teal-200/60">
              <div className="flex items-center space-x-2 text-teal-900 font-bold">
                <Calendar className="w-4 h-4 text-teal-700" />
                <span>4. Closed-Loop Village PHC Follow-Up Dispatch</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white">
                AUTO-CREATES TASK AT PHC
              </span>
            </div>

            <p className="text-[11px] text-teal-800">
              Upon signing, an alert will be automatically routed to the Community Health Officer (CHO) and ASHA worker at the patient's local primary facility.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Follow-Up Review Interval
                </label>
                <select
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-teal-300 bg-white rounded-lg text-xs font-semibold text-teal-900"
                >
                  <option value={3}>In 3 Days (Critical Post-Op Review)</option>
                  <option value={7}>In 7 Days (Standard Post-PCI / Acute Care)</option>
                  <option value={14}>In 14 Days (Subacute Medication Titration)</option>
                  <option value={30}>In 30 Days (Chronic Stability Review)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Assigned Frontline Facility
                </label>
                <input
                  type="text"
                  value={followUpFacility}
                  onChange={(e) => setFollowUpFacility(e.target.value)}
                  className="w-full px-3 py-1.5 border border-teal-300 bg-white rounded-lg text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Specific Objective for CHO / ASHA
                </label>
                <input
                  type="text"
                  value={followUpPurpose}
                  onChange={(e) => setFollowUpPurpose(e.target.value)}
                  className="w-full px-3 py-1.5 border border-teal-300 bg-white rounded-lg text-xs font-medium text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Advice & Red Flag Emergency Warnings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-xs">
              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                Lifestyle & Dietary Instructions
              </label>
              <textarea
                rows={3}
                value={dietAdvice}
                onChange={(e) => setDietAdvice(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-700 outline-hidden"
              />
            </div>

            <div className="border border-rose-200 bg-rose-50/30 rounded-xl p-3 shadow-xs">
              <label className="block text-[11px] font-bold text-rose-900 mb-1 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Emergency Red Flag Warning Symptoms</span>
              </label>
              <textarea
                rows={3}
                value={redFlags}
                onChange={(e) => setRedFlags(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-rose-300 rounded text-xs text-rose-900 outline-hidden bg-white"
              />
            </div>
          </div>

          {/* Clinical Attestation & Safety Directive (Rule 1 & Rule 3) */}
          <div className="border border-slate-300 bg-slate-50 rounded-xl p-4 space-y-2">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isSigned}
                onChange={(e) => setIsSigned(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900">
                  Attending Clinician Certification &amp; Sign-Off (Hard Rule 3 Enforced)
                </span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  I certify that I have personally evaluated the patient, verified all take-home medication dosages, reviewed discharge vitals, and established the post-discharge village PHC care plan.
                </p>
              </div>
            </label>

            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Attending Clinician Handoff Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Patient counseled on emergency signs; CHO notified for Day-7 follow-up..."
                value={clinicianNotes}
                onChange={(e) => setClinicianNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Enforces <strong className="text-slate-700">Hard Rule 4</strong>: Generates an immutable <code className="text-teal-700 font-mono">DISCHARGE_SUMMARY_CREATED</code> audit event.
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveAndDispatch}
              disabled={submitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Generating & Dispatching...' : 'Sign & Dispatch Discharge Summary'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
