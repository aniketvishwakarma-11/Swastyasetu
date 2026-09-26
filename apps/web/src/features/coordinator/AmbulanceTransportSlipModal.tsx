import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { useModalA11y } from '../../hooks/useModalA11y';
import {
  X,
  Ambulance,
  Printer,
  Copy,
  Check,
  MapPin,
  HeartPulse,
  Pill,
  AlertTriangle,
  Radio,
  User,
  CheckCircle2,
} from 'lucide-react';

interface AmbulanceTransportSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralId?: string | null;
  referralNumber?: string | null;
  onStatusUpdated?: (updated: any) => void;
}

export const AmbulanceTransportSlipModal: React.FC<AmbulanceTransportSlipModalProps> = ({
  isOpen,
  onClose,
  referralId,
  referralNumber,
  onStatusUpdated,
}) => {
  useModalA11y(isOpen, onClose);

  const [slipData, setSlipData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedSms, setCopiedSms] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchSlip = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const targetId = referralId || referralNumber;
      if (!targetId) {
        setErrorMsg('No active referral selected. Please select a patient transfer from the triage pipeline.');
        setLoading(false);
        return;
      }
      const res = await apiRequest(`/referrals/${targetId}/transport-slip`);
      if (res.success && res.data) {
        setSlipData(res.data);
      } else {
        setErrorMsg(res.error?.message || 'Failed to generate 108 ambulance transport slip.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with ambulance dispatch gateway.');
    } finally {
      setLoading(false);
    }
  }, [referralId, referralNumber]);

  useEffect(() => {
    if (isOpen) {
      fetchSlip();
    }
  }, [isOpen, fetchSlip]);

  const handleCopySms = () => {
    if (!slipData?.offlineSmsPayload) return;
    navigator.clipboard.writeText(slipData.offlineSmsPayload);
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleQuickStatus = async (newStatus: string, notes: string) => {
    if (!slipData?.referralId) return;
    setUpdatingStatus(true);
    try {
      const res = await apiRequest(`/referrals/${slipData.referralId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, notes }),
      });
      if (res.success && res.data) {
        setSlipData((prev: any) => ({ ...prev, status: newStatus }));
        if (onStatusUpdated) onStatusUpdated(res.data);
      }
    } catch (err) {
      console.error('[Transport slip status update error]', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transport-slip-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center">
              <Ambulance className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span id="transport-slip-title" className="font-extrabold text-base tracking-tight text-white">108 EMRI Transport Slip</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase animate-pulse">
                  Emergency Transit
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Government of Maharashtra • Public Health Department • Inter-Facility Transfer Handoff
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Print Physical Transport Slip"
            >
              <Printer className="w-3.5 h-3.5 text-teal-400" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Generating digital 108 transport slip...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2 text-xs text-rose-800">
              <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
              <p className="font-semibold">{errorMsg}</p>
            </div>
          ) : slipData ? (
            <div className="space-y-6 print:space-y-4">
              
              {/* Top Meta Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Transport Slip Code</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{slipData.transportSlipCode}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Referral Master ID</span>
                  <span className="font-mono font-bold text-teal-700 text-sm">{slipData.referralNumber}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Corridor Distance &amp; ETA</span>
                  <span className="font-bold text-slate-800 text-sm">{slipData.distanceKm} km • ~{slipData.estimatedTransitMinutes} mins</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Security Gate Token</span>
                  <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-xs">
                    {slipData.securityVerificationHash}
                  </span>
                </div>
              </div>

              {/* Patient & Dispatch Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Patient Information */}
                <div className="clinical-surface rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-teal-600" />
                    <span>Patient Identification &amp; Demographics</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Full Name</span>
                      <p className="font-bold text-slate-900">{slipData.patient.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Age &amp; Gender</span>
                      <p className="font-semibold text-slate-800">{slipData.patient.age} yrs • {slipData.patient.gender}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Village / Taluka</span>
                      <p className="font-semibold text-slate-800">{slipData.patient.village}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Emergency Contact</span>
                      <p className="font-semibold text-slate-800">{slipData.patient.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 text-[11px]">Ayushman Bharat Health Account (ABHA)</span>
                      <p className="font-mono text-teal-700 font-semibold">{slipData.patient.abhaId}</p>
                    </div>
                  </div>
                </div>

                {/* 108 Ambulance Unit */}
                <div className="clinical-surface rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                    <Ambulance className="w-4 h-4 text-rose-600" />
                    <span>Assigned 108 Emergency Ambulance Unit</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Vehicle Callsign</span>
                      <p className="font-mono font-bold text-slate-900">{slipData.ambulance.callsign}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Paramedic On-Duty</span>
                      <p className="font-semibold text-slate-800">{slipData.ambulance.paramedicName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Pilot / Driver</span>
                      <p className="font-semibold text-slate-800">{slipData.ambulance.driverName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Direct Contact Phone</span>
                      <p className="font-semibold text-slate-800">{slipData.ambulance.driverPhone}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 text-[11px]">Ambulance Base Location</span>
                      <p className="font-semibold text-slate-700">{slipData.ambulance.baseLocation}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transit Corridor: Pickup & Destination */}
              <div className="p-4 bg-teal-50/50 border border-teal-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                  <span className="flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-teal-700" />
                    <span>Corridor Routing: Rural PHC to District Casualty</span>
                  </span>
                  <span className="text-teal-700">Departed: {slipData.pickup.departureTime}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-teal-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pickup Facility (Origin)</span>
                    <p className="font-bold text-slate-900">{slipData.pickup.facilityName}</p>
                    <p className="text-[11px] text-slate-500">Ref Doctor: {slipData.pickup.doctorName} ({slipData.pickup.doctorPhone})</p>
                    <p className="text-[10px] text-slate-400 font-mono">GPS: {slipData.pickup.gpsCoordinates.lat}, {slipData.pickup.gpsCoordinates.lng}</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-teal-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receiving Casualty (Destination)</span>
                    <p className="font-bold text-slate-900">{slipData.destination.facilityName}</p>
                    <p className="text-[11px] text-slate-500 font-semibold text-rose-700">
                      Reserved: {slipData.destination.reservedBedType.replace('_', ' ')} • Desk: {slipData.destination.casualtyDeskPhone}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">GPS: {slipData.destination.gpsCoordinates.lat}, {slipData.destination.gpsCoordinates.lng}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Vitals Banner */}
              <div className="clinical-surface rounded-2xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  <span>Departure Emergency Vitals</span>
                  <span className="text-[10px] font-normal text-slate-400">({new Date(slipData.initialVitals.recordedAt).toLocaleTimeString()})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Blood Pressure</span>
                    <span className="font-bold text-slate-900 text-sm">{slipData.initialVitals.bloodPressure}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Pulse Rate</span>
                    <span className="font-bold text-slate-900 text-sm">{slipData.initialVitals.pulseRate} bpm</span>
                  </div>
                  <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                    <span className="text-[10px] text-rose-700 block font-semibold">SpO2 Level</span>
                    <span className="font-extrabold text-rose-800 text-sm">{slipData.initialVitals.spo2}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Resp Rate</span>
                    <span className="font-bold text-slate-900 text-sm">{slipData.initialVitals.respiratoryRate} /min</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Random Glucose</span>
                    <span className="font-bold text-slate-900 text-sm">{slipData.initialVitals.bloodSugar} mg/dL</span>
                  </div>
                </div>
              </div>

              {/* Pre-Referral Stabilization Verification Checklist */}
              <div className="clinical-surface rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    <span>Pre-Hospital Emergency Drug Administration Record</span>
                  </h3>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Verified by {slipData.stabilizationProtocol.administeredBy}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {slipData.stabilizationProtocol.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-[11px]">{item.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {item.dosage} • {item.route} {item.timeAdministered && `• At ${item.timeAdministered}`}
                        </p>
                        {item.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">{item.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paramedic En-Route Directives */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-xs">
                <h4 className="font-bold text-amber-900 flex items-center space-x-1.5">
                  <Radio className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Active En-Route Paramedic Directives</span>
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-amber-950 text-[11px]">
                  {slipData.enRouteInstructions.map((inst: string, idx: number) => (
                    <li key={idx}>{inst}</li>
                  ))}
                </ul>
              </div>

              {/* 2G Offline SMS Handoff Payload */}
              <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-teal-400">Offline 2G GSM SMS Payload</span>
                    <span className="text-[10px] font-mono text-slate-400">(&lt; 160 chars)</span>
                  </div>
                  <button
                    onClick={handleCopySms}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-teal-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedSms ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy SMS</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-slate-950 font-mono text-[11px] text-teal-200 rounded-xl break-all select-all border border-slate-800">
                  {slipData.offlineSmsPayload}
                </div>
                <p className="text-[10px] text-slate-400">
                  Copy and send via standard SMS to <strong>108 Control Room</strong> if ambulance enters zero-data ghat or forest terrain.
                </p>
              </div>

              {/* Status Actions */}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-slate-500 font-medium">
                  Current Transfer Status: <span className="font-bold text-slate-800">{slipData.status.replace('_', ' ')}</span>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  {slipData.status !== 'RECEIVED' && (
                    <button
                      onClick={() => handleQuickStatus('RECEIVED', 'Ambulance arrived at Casualty Gate with patient')}
                      disabled={updatingStatus}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Casualty ER Arrival</span>
                    </button>
                  )}

                  <button
                    onClick={handlePrint}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <span>Print Handoff</span>
                  </button>
                </div>
              </div>

            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};
