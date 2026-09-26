import React, { useState } from 'react';
import { usePWA } from '../hooks/usePWA';
import { Download, X, Share, PlusSquare } from 'lucide-react';

const DISMISS_KEY = 'swasthya_pwa_banner_dismissed_v1';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // If already installed or user dismissed it previously, don't show
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only display if install prompt is captured or on iOS Safari outside standalone mode
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // ignore storage error
    }
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      const outcome = await installApp();
      if (outcome) {
        handleDismiss();
      }
    }
  };

  return (
    <>
      {/* Discreet, Professional Clinical Floating Toast */}
      <aside
        aria-label="Install SwasthyaSetu Application"
        className="fixed bottom-20 md:bottom-6 right-4 z-40 max-w-sm w-[calc(100vw-2rem)] md:w-auto animate-in fade-in slide-in-from-bottom-3 duration-200"
      >
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xl shadow-slate-900/8 text-slate-800 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              <img
                src="/icons/pwa-192x192.png"
                alt="SwasthyaSetu"
                className="w-10 h-10 rounded-xl border border-slate-200 shadow-2xs shrink-0"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 leading-tight">Install SwasthyaSetu</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Fast 1-tap clinical referral access and offline continuity on your device.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-100">
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Not now
            </button>
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Clean iOS Safari Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img src="/icons/pwa-192x192.png" alt="App Icon" className="w-7 h-7 rounded-lg border border-slate-200" />
                <h3 className="font-bold text-xs text-slate-900">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-600 leading-normal">
              In Safari, follow these two quick steps to add SwasthyaSetu to your home screen:
            </p>

            <ol className="text-xs space-y-2.5 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <li className="flex items-start space-x-2">
                <span className="font-bold text-teal-800 bg-teal-100/80 rounded-full w-4 h-4 flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span className="text-[11px]">
                  Tap the <strong className="text-slate-800 inline-flex items-center"><Share className="w-3 h-3 mx-1 text-teal-700" /> Share</strong> button in Safari's toolbar.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-teal-800 bg-teal-100/80 rounded-full w-4 h-4 flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span className="text-[11px]">
                  Select <strong className="text-slate-800 inline-flex items-center"><PlusSquare className="w-3 h-3 mx-1 text-teal-700" /> Add to Home Screen</strong>.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
