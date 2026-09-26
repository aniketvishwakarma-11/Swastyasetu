import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Volume2,
  VolumeX,
  X,
  FileText,
  Building2,
} from 'lucide-react';
import {
  playEmergencyAlertSound,
  isEmergencyAudioEnabled,
  setEmergencyAudioEnabled,
} from '../lib/audioAlert';
import { apiRequest } from '../lib/api';

export interface EmergencyAlertItem {
  id: string;
  referralNumber: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  sourceFacilityName: string;
  reason: string;
  clinicalSummary?: string;
  timestamp: string;
  urgency: 'EMERGENCY';
  status?: string;
}

interface EmergencyAlertBannerProps {
  alert: EmergencyAlertItem | null;
  onDismiss: () => void;
  onViewDetails: (referralId: string) => void;
  onAcknowledged?: (referralId: string) => void;
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({
  alert,
  onDismiss,
  onViewDetails,
  onAcknowledged,
}) => {
  const [audioEnabled, setAudioEnabled] = useState<boolean>(isEmergencyAudioEnabled);
  const [isAcknowledging, setIsAcknowledging] = useState<boolean>(false);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

  useEffect(() => {
    if (alert) {
      setAcknowledged(alert.status === 'RECEIVED');
      // Play high-priority clinical chime on incoming alert
      playEmergencyAlertSound();
    }
  }, [alert]);

  if (!alert) return null;

  const toggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    setEmergencyAudioEnabled(nextState);
    if (nextState) {
      playEmergencyAlertSound();
    }
  };

  const handleAcknowledge = async () => {
    try {
      setIsAcknowledging(true);
      const res = await apiRequest(`/referrals/${alert.id}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({
          notes: 'Emergency transfer acknowledged from Hospital Dashboard triage banner.',
        }),
      });

      if (res.success) {
        setAcknowledged(true);
        if (onAcknowledged) {
          onAcknowledged(alert.id);
        }
      }
    } catch (err) {
      console.error('[EmergencyAlertBanner] Acknowledge error:', err);
    } finally {
      setIsAcknowledging(false);
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full bg-rose-50/90 border-2 border-rose-300 rounded-2xl shadow-md animate-in slide-in-from-top-4 duration-300 overflow-hidden"
    >
      <div className="px-4 py-3 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Left: Urgent indicator & Clinical summary */}
          <div className="flex items-start space-x-3 min-w-0">
            <div className="relative mt-0.5 shrink-0">
              <span className="flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-rose-600 text-white shadow-2xs">
                  CRITICAL EMERGENCY REFERRAL
                </span>
                <span className="text-xs font-bold text-rose-950 font-mono">
                  {alert.referralNumber}
                </span>
                <span className="text-xs text-rose-700 flex items-center space-x-1">
                  <Building2 className="w-3 h-3" />
                  <span className="font-semibold">{alert.sourceFacilityName}</span>
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xs">
                <span className="font-bold text-slate-900">
                  {alert.patientName}{' '}
                  {alert.patientAge
                    ? `(${alert.patientAge}${alert.patientGender ? alert.patientGender.charAt(0) : ''})`
                    : ''}
                </span>
                <span className="text-rose-900 font-medium">— {alert.reason}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
            {/* Audio chime toggle */}
            <button
              onClick={toggleAudio}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                audioEnabled
                  ? 'border-rose-200 bg-white text-rose-700 hover:bg-rose-100'
                  : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              title={audioEnabled ? 'Mute alert chime' : 'Enable alert chime'}
              aria-label={audioEnabled ? 'Mute alert chime' : 'Enable alert chime'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* View Details Button */}
            <button
              onClick={() => onViewDetails(alert.id)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-rose-100/70 border border-rose-300 text-rose-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Vitals</span>
            </button>

            {/* Acknowledge Button / Badge */}
            {acknowledged ? (
              <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bed Ready</span>
              </span>
            ) : (
              <button
                onClick={handleAcknowledge}
                disabled={isAcknowledging}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAcknowledging ? 'Acknowledging...' : 'Acknowledge & Prepare Bed'}</span>
              </button>
            )}

            {/* Close banner button */}
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-100/60 transition-colors cursor-pointer"
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
