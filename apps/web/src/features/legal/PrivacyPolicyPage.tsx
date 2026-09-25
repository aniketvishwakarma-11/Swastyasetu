import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, EyeOff, Database, FileText, ArrowLeft, Building, Mail, Phone } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to SwasthyaSetu Portal</span>
        </Link>

        {/* Header */}
        <div className="space-y-3 border-b border-slate-200 pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>DPDP 2023 &amp; DISHA COMPLIANT PROTOCOL</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Privacy &amp; Clinical Data Governance Policy
          </h1>
          <p className="text-xs text-slate-500">
            Last Updated: September 25, 2026 • Effective Date: January 1, 2026 • Version 2.4-IND
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-xs text-slate-700 leading-relaxed bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-teal-600" />
              <span>1. Regulatory Foundation &amp; Scope</span>
            </h2>
            <p>
              SwasthyaSetu is operated as a state-accredited healthcare continuity layer under the oversight of the
              Public Health Department, Government of Maharashtra. This policy establishes the privacy protections
              governing electronic protected health information (ePHI), ABHA (Ayushman Bharat Health Account) identifiers,
              and emergency inter-facility referral handoffs in strict compliance with the
              <strong> Digital Personal Data Protection Act (DPDP Act 2023)</strong> and the
              <strong> Digital Information Security in Healthcare Act (DISHA)</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Database className="w-4 h-4 text-teal-600" />
              <span>2. Offline IndexedDB &amp; Local Persistence Security</span>
            </h2>
            <p>
              To ensure patient care continuity survives weak or absent connectivity in rural talukas:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                Clinical referral notes, rapid vitals, and triage metadata are cached client-side in the browser’s
                isolated <strong>Dexie.js IndexedDB</strong> sandbox.
              </li>
              <li>
                Data stored offline is restricted strictly to the authenticated device and practitioner session.
              </li>
              <li>
                Upon reconnecting to 2G/4G or broadband, queued sync packets are cryptographically authenticated via
                deterministic <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">eventId</code> tokens to ensure
                zero duplicate records and prevent unauthorized interception.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <EyeOff className="w-4 h-4 text-teal-600" />
              <span>3. Zero Commercialization &amp; Absolute Non-Disclosure</span>
            </h2>
            <p>
              SwasthyaSetu maintains an uncompromising policy against data commercialization. We do not sell, rent, monetize,
              or license patient demographic or medical data to insurance underwriters, pharmaceutical corporations, or third-party
              advertising networks. Diagnostic scans processed by our local AI OCR service are analyzed solely to extract clinical
              dosages and are never fed into public foundation models without explicit institutional de-identification.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>4. Immutable Auditability (Hard Rule 4)</span>
            </h2>
            <p>
              Every access, identity reconciliation confirmation, dosage verification, and referral status transition generates
              an append-only, tamper-evident <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">AuditEvent</code> with an
              unbroken SHA-256 cryptographic hash chain. This guarantees that medical records cannot be altered, forged, or quietly
              purged.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Building className="w-4 h-4 text-teal-600" />
              <span>5. Grievance Officer &amp; Institutional Contacts</span>
            </h2>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <p className="font-semibold text-slate-800">
                Data Protection Officer (DPO) — District Health Office
              </p>
              <p className="text-slate-600">
                Public Health Department, Government of Maharashtra<br />
                Aundh District Hospital Campus, Pune - 411027, Maharashtra, India
              </p>
              <div className="flex flex-wrap gap-4 pt-1 text-slate-600">
                <span className="flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                  <span>dpo.swasthyasetu@maharashtra.gov.in</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span>+91 20 2728 0000 / Toll-Free 104</span>
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
