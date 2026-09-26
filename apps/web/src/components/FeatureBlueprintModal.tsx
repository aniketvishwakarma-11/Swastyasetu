import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Code2,
  Database,
  ShieldAlert,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

export interface FeatureBlueprint {
  id: string;
  title: string;
  role: string;
  status: 'BUILT' | 'IN_PROGRESS' | 'NEXT_UP' | 'PLANNED';
  badgeLabel: string;
  clinicalPurpose: string;
  targetUsers: string;
  safetyRule?: string;
  technicalSpecs: {
    endpoints?: string[];
    models?: string[];
    aiServices?: string[];
  };
  acceptanceCriteria: string[];
}

interface FeatureBlueprintModalProps {
  blueprint: FeatureBlueprint | null;
  onClose: () => void;
  onStartBuilding?: (blueprint: FeatureBlueprint) => void;
}

export const FeatureBlueprintModal: React.FC<FeatureBlueprintModalProps> = ({
  blueprint,
  onClose,
  onStartBuilding,
}) => {
  useModalA11y({ isOpen: !!blueprint, onClose });

  if (!blueprint) return null;

  const getStatusBadge = (status: FeatureBlueprint['status']) => {
    switch (status) {
      case 'BUILT':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ● Active / Built
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            ◐ In Progress
          </span>
        );
      case 'NEXT_UP':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
            ○ Next Up
          </span>
        );
      case 'PLANNED':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            ◌ Roadmap
          </span>
        );
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="blueprint-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-950/55 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="clinical-surface my-8 flex w-full max-w-2xl flex-col overflow-hidden rounded-[24px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="blueprint-modal-title" className="text-base font-bold text-slate-900">{blueprint.title}</h2>
                {getStatusBadge(blueprint.status)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Role: <span className="font-semibold text-slate-700">{blueprint.role}</span> • Feature Specification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Clinical Purpose */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Clinical & Operational Purpose
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {blueprint.clinicalPurpose}
            </p>
          </div>

          {/* Clinical Safety Constraint */}
          {blueprint.safetyRule && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Hard Clinical Safety Directive:</strong>
                <p className="mt-0.5 text-amber-800">{blueprint.safetyRule}</p>
              </div>
            </div>
          )}

          {/* Technical Architecture Contracts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Endpoints */}
            {blueprint.technicalSpecs.endpoints && (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <Code2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>API Endpoints</span>
                </div>
                <div className="space-y-1">
                  {blueprint.technicalSpecs.endpoints.map((ep, i) => (
                    <div
                      key={i}
                      className="font-mono text-[11px] px-2 py-1 bg-slate-100 text-slate-800 rounded border border-slate-200 truncate"
                      title={ep}
                    >
                      {ep}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Models & AI */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                <Database className="w-3.5 h-3.5 text-teal-600" />
                <span>Prisma Entities & Services</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {blueprint.technicalSpecs.models?.map((mod, i) => (
                  <span
                    key={i}
                    className="font-mono text-[11px] px-2 py-0.5 bg-teal-50 text-teal-800 rounded border border-teal-200 font-semibold"
                  >
                    {mod}
                  </span>
                ))}
                {blueprint.technicalSpecs.aiServices?.map((ai, i) => (
                  <span
                    key={i}
                    className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-800"
                  >
                    {ai}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Acceptance & Verification Criteria
            </h3>
            <ul className="space-y-1.5">
              {blueprint.acceptanceCriteria.map((crit, i) => (
                <li key={i} className="flex items-start space-x-2 text-xs text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <span>{crit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/90 px-6 py-4">
          <div className="text-xs text-slate-500">
            Status: <span className="font-semibold text-slate-700">{blueprint.badgeLabel}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close Blueprint
            </button>

            {blueprint.status !== 'BUILT' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onStartBuilding) onStartBuilding(blueprint);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ready to Build Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
