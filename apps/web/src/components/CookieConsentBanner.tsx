import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Database, X, Check } from 'lucide-react';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('swasthyasetu_consent_v1');
    if (!consent) {
      // Small timeout for smooth entry animation
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('swasthyasetu_consent_v1', 'ALL_ACCEPTED');
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem('swasthyasetu_consent_v1', 'ESSENTIAL_ONLY');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="clinical-surface rounded-2xl p-4 sm:p-5 shadow-2xl border-2 border-teal-200/80 bg-white/95 backdrop-blur-md space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <span>Clinical Storage &amp; Cookies</span>
                <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 rounded">
                  DPDP 2023
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Offline continuity cache &amp; session tokens</p>
            </div>
          </div>

          <button
            onClick={handleEssentialOnly}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          SwasthyaSetu utilizes browser <strong>IndexedDB (Dexie.js)</strong> to ensure patient emergency referrals are never lost during rural network outages. We do not use advertising trackers or sell health records.{' '}
          <Link to="/privacy" className="text-teal-700 hover:underline font-semibold">
            Read Clinical Privacy Policy
          </Link>
          .
        </p>

        <div className="flex items-center space-x-2 pt-1">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept All &amp; Enable Sync</span>
          </button>

          <button
            type="button"
            onClick={handleEssentialOnly}
            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
};
