import React from 'react';
import { Check, Circle } from 'lucide-react';

interface Stage {
  label: string;
  active: boolean;
  implemented: boolean;
}

// Hospital stage is NOT active: HospitalDashboard has no real receive-referral API.
// All later stages (Consultation, Discharge, Follow-up) are muted.
const STAGES: Stage[] = [
  { label: 'PHC',          active: true,  implemented: true  },
  { label: 'Referral',     active: true,  implemented: true  },
  { label: 'Hospital',     active: false, implemented: false },
  { label: 'Consultation', active: false, implemented: false },
  { label: 'Discharge',    active: false, implemented: false },
  { label: 'Follow-up',    active: false, implemented: false },
];

export const WorkflowStrip: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
      Patient Care Pathway
    </p>
    <ol className="flex items-center gap-0 overflow-x-auto" aria-label="Care pathway stages">
      {STAGES.map((stage, i) => {
        const isLast = i === STAGES.length - 1;
        return (
          <li key={stage.label} className="flex items-center">
            {/* Stage node */}
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                  stage.active
                    ? 'border-teal-500 bg-teal-500 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-300'
                }`}
                aria-label={`${stage.label}${stage.active ? ' (active)' : ' (not yet implemented)'}`}
              >
                {stage.active ? (
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Circle className="w-3 h-3" aria-hidden="true" />
                )}
              </div>
              <span
                className={`mt-1.5 text-[11px] font-semibold whitespace-nowrap ${
                  stage.active ? 'text-teal-700' : 'text-slate-300'
                }`}
              >
                {stage.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={`h-0.5 w-8 sm:w-12 mx-1 shrink-0 rounded-full ${
                  STAGES[i + 1].active ? 'bg-teal-400' : 'bg-slate-200'
                }`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  </div>
);
