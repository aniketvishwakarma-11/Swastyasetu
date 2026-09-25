import React from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, Stethoscope, AlertTriangle, Scale, ArrowLeft, ShieldAlert } from 'lucide-react';

export const TermsPage: React.FC = () => {
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
            <Scale className="w-4 h-4 text-teal-600" />
            <span>CLINICAL PROTOCOL &amp; TERMS OF SERVICE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Terms of Clinical Service &amp; Tele-Triage Protocols
          </h1>
          <p className="text-xs text-slate-500">
            Governing Directive: Maharashtra Public Health Clinical Continuity Norms • Version 2.0
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs text-slate-700 leading-relaxed bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>1. Professional Clinical Authority (Hard Rule 3 Enforced)</span>
            </h2>
            <p>
              SwasthyaSetu is designed as an infrastructure continuity and administrative tracking layer; it is
              <strong> strictly NOT an autonomous diagnostic or prescribing intelligence</strong>. All clinical decision-making,
              including emergency triage tiering, pre-referral drug administration, surgical procedures, and take-home
              medication orders, remains the sole and undelegable legal responsibility of the licensed medical practitioner.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>2. AI Document OCR Verification Mandate (Hard Rule 1)</span>
            </h2>
            <p>
              Medical staff utilizing the AI Clinical Document &amp; Prescription OCR Scanner acknowledge that machine
              recognition of cursive handwriting or damaged paper slips is inherently probabilistic. In accordance with
              <strong> Hard Rule 1 (No Silent Guessing)</strong>, clinicians are required to manually inspect the scan in
              the split-screen review window and verify any dosage or medicine marked with confidence &lt; 90% before
              committing the data to the electronic health record.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>3. Emergency Protocols &amp; 108 Ambulance Dispatch</span>
            </h2>
            <p>
              In life-threatening situations (STEMI, eclampsia, acute polytrauma), the digital referral must run parallel
              to standard verbal and radio dispatch protocols. Frontline workers should use the <strong>2G SMS Fallback</strong> or
              direct phone contact with the 108 Emergency Control Room without delaying immediate patient transit.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-teal-600" />
              <span>4. Acceptable Institutional Use &amp; Role-Based Access</span>
            </h2>
            <p>
              Access to SwasthyaSetu is restricted to verified healthcare professionals, Community Health Officers,
              108 ambulance dispatchers, and health system administrators accredited by government health authorities.
              Sharing credentials, bypassing RBAC security challenges, or recording falsified clinical events constitutes
              a breach of medical ethics and government service regulations.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
