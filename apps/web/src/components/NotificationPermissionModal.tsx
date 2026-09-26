import React from 'react';
import { Bell, CheckCircle2, X } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onSubscribe: () => Promise<boolean>;
  onClose: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  isOpen,
  isLoading,
  onSubscribe,
  onClose,
}) => {
  useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const handleEnable = async () => {
    const success = await onSubscribe();
    if (success) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-permission-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 id="notif-permission-title" className="text-sm font-bold text-slate-900">Enable Emergency Triage Alerts</h3>
              <p className="text-xs text-slate-500 mt-0.5">District Referral Continuity Network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Allow SwasthyaSetu to notify you when a rural PHC sends a <strong>critical emergency patient</strong>. 
          Alerts will reach your device even when your screen is locked or the browser is minimized.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs text-slate-700">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Instant lock-screen alert with patient vitals & reason</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>1-tap acknowledgment to notify the rural doctor</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Audible hospital chime for incoming trauma transfers</span>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Not Now
          </button>
          <button
            onClick={handleEnable}
            disabled={isLoading}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Enabling...' : 'Enable Emergency Alerts'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
