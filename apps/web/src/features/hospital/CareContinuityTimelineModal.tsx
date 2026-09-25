import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Building,
  ShieldCheck,
  Activity,
  Ambulance,
  Calendar,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';

interface TimelineEvent {
  id: string;
  eventType: string;
  category: 'PHC_INTAKE' | 'AMBULANCE_TRANSIT' | 'HOSPITAL_ARRIVAL' | 'IDENTITY_RECONCILIATION' | 'OCR_DOCUMENT' | 'FOLLOWUP_CARE' | 'STATUS_CHANGE';
  title: string;
  facility: string;
  actor: string;
  actorRole: string;
  timestamp: string;
  status?: string;
  details: string;
  metadata?: Record<string, any>;
  icon: 'stethoscope' | 'ambulance' | 'building' | 'shield-check' | 'scan' | 'calendar' | 'activity';
  badgeColor: 'teal' | 'emerald' | 'amber' | 'rose' | 'blue' | 'purple';
}

interface TimelineResponse {
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone?: string;
    village: string;
    localId?: string;
  };
  summary: {
    totalEvents: number;
    referralsCount: number;
    documentsCount: number;
    followUpsCount: number;
    continuityStatus: string;
  };
  events: TimelineEvent[];
}

interface CareContinuityTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  availablePatients?: Array<{ id: string; name: string }>;
  onSwitchPatient?: (patient: { id: string; name: string }) => void;
}

export const CareContinuityTimelineModal: React.FC<CareContinuityTimelineModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  availablePatients,
  onSwitchPatient,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Load patient care timeline - React to patientId change
  useEffect(() => {
    if (isOpen && patientId) {
      loadTimeline(patientId);
    }
  }, [isOpen, patientId]);

  const loadTimeline = async (id: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest(`/patients/${id}/timeline`);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setErrorMsg(res.error?.message || 'Failed to retrieve timeline data.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error retrieving clinical timeline.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderEventIcon = (iconName: TimelineEvent['icon']) => {
    switch (iconName) {
      case 'stethoscope':
        return <Activity className="w-4 h-4 text-teal-600" />;
      case 'ambulance':
        return <Ambulance className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'building':
        return <Building className="w-4 h-4 text-purple-600" />;
      case 'shield-check':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'calendar':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'activity':
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getBadgeColorClasses = (color: TimelineEvent['badgeColor']) => {
    switch (color) {
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'teal':
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Unified Patient Care Continuity Timeline (EHR)</h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  SYNCED LEDGER
                </span>
                <span className="text-[11px] font-bold text-teal-800 bg-white border border-teal-200 px-2 py-0.5 rounded-md shadow-xs">
                  Active Patient: {patientName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Chronological clinical journey connecting primary, transit, emergency, and follow-up healthcare tiers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info & Outbreak Alert Banner */}
        <div className="bg-teal-50/60 border-b border-teal-100 px-6 py-2.5 flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>
              <strong>Care Loop Integrity Status:</strong>{' '}
              {data?.summary.continuityStatus === 'CLOSED_LOOP_ACHIEVED' ? (
                <span className="text-emerald-700 font-bold">Closed-Loop Continuity Achieved ✓</span>
              ) : (
                <span className="text-amber-800 font-bold">Active Care Handoff in Progress</span>
              )}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {availablePatients && availablePatients.length > 1 && onSwitchPatient && (
              <select
                value={patientId}
                onChange={(e) => {
                  const selected = availablePatients.find(p => p.id === e.target.value);
                  if (selected) onSwitchPatient(selected);
                }}
                className="px-2.5 py-1 bg-white border border-teal-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                {availablePatients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => loadTimeline(patientId)}
              className="text-teal-700 hover:text-teal-900 flex items-center space-x-1 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Journey</span>
            </button>
          </div>
        </div>

        {/* Modal Work area */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-teal-500" />
              <p className="text-xs font-medium">Reconstructing patient care journey ledger chronologically...</p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              
              {/* Patient Core Summary Pill Card */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient full name</span>
                  <span className="font-bold text-slate-900 text-sm">{data.patient.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Age &amp; Gender</span>
                  <span className="font-semibold text-slate-800 text-xs">{data.patient.age} yrs • {data.patient.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Origin Village</span>
                  <span className="font-semibold text-slate-800 text-xs">{data.patient.village}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Unified Registry ID</span>
                  <span className="font-mono text-slate-700 text-xs block truncate" title={data.patient.id}>
                    {data.patient.id.slice(0, 8)}... (Verified)
                  </span>
                </div>
              </div>

              {/* Vertical Timeline Path */}
              <div className="relative pl-6 border-l-2 border-slate-200 ml-4 space-y-6">
                {data.events.map((evt) => {
                  const isExpanded = expandedEvent === evt.id;
                  const eventDate = new Date(evt.timestamp);
                  
                  return (
                    <div key={evt.id} className="relative group">
                      
                      {/* Timeline Dot with Icon */}
                      <div className="absolute -left-11 top-0.5 w-8 h-8 rounded-full bg-white border border-slate-300 shadow-2xs flex items-center justify-center z-10 group-hover:border-teal-400 transition-colors">
                        {renderEventIcon(evt.icon)}
                      </div>

                      {/* Event Main Block */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        isExpanded ? 'bg-slate-50/50 border-teal-200' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}>
                        
                        {/* Event Title & Timestamp Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                          <div>
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getBadgeColorClasses(evt.badgeColor)}`}>
                              {evt.eventType.replace(/_/g, ' ')}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 mt-1.5">{evt.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {evt.facility} • <span className="font-semibold text-slate-700">{evt.actor}</span> ({evt.actorRole})
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              {eventDate.toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Event Brief Detail snippet */}
                        <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {evt.details}
                        </p>

                        {/* Metadata Toggle */}
                        {evt.metadata && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => setExpandedEvent(isExpanded ? null : evt.id)}
                              className="inline-flex items-center space-x-1 text-[11px] text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                            >
                              <span>{isExpanded ? 'Hide Technical Metadata' : 'View Extracted Clinical Specs'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            {isExpanded && (
                              <div className="mt-3 p-3 bg-slate-950 text-slate-300 rounded-lg font-mono text-[11px] space-y-2 border border-slate-800 overflow-x-auto">
                                <div className="text-[10px] text-slate-500 font-bold border-b border-slate-800 pb-1 mb-1 flex items-center justify-between">
                                  <span>IMMUTABLE SCHEMATIC DATA (AUDIT)</span>
                                  <span>RULE 4 VERIFIED</span>
                                </div>
                                {evt.metadata.referralNumber && (
                                  <div>
                                    <span className="text-teal-400">Referral Number: </span>{evt.metadata.referralNumber}
                                  </div>
                                )}
                                {evt.metadata.urgency && (
                                  <div>
                                    <span className="text-teal-400">Triage Tier: </span>{evt.metadata.urgency}
                                  </div>
                                )}
                                {evt.metadata.clinicalSummary && (
                                  <div className="whitespace-pre-wrap">
                                    <span className="text-teal-400">Pre-Referral Intake: </span>
                                    {evt.metadata.clinicalSummary}
                                  </div>
                                )}
                                {evt.metadata.fields && (
                                  <div>
                                    <div className="text-teal-400 font-bold mb-1">Extracted Medication / Dosage Elements:</div>
                                    <div className="space-y-1 pl-2">
                                      {evt.metadata.fields.map((f: any) => (
                                        <div key={f.field} className="flex justify-between border-b border-slate-900 pb-0.5">
                                          <span>• {f.field}: <span className="text-white font-bold">{f.value}</span></span>
                                          <span className={f.status === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'}>
                                            {f.confidence}% Conf ({f.status})
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {evt.metadata.originalFileUrl && (
                                  <div className="pt-1 text-[10px]">
                                    <a 
                                      href={evt.metadata.originalFileUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="inline-flex items-center text-teal-400 hover:text-teal-300 space-x-1"
                                    >
                                      <span>View original document attachment</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">Journey Ledger Empty</p>
              <p className="text-xs text-slate-400 mt-1">No clinical activities recorded on network sync logs yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-semibold flex items-center space-x-1">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Facility Access context: {data?.patient.village ? `${data.patient.village} Catchment` : 'District Health Network'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            Close Timeline
          </button>
        </div>

      </div>
    </div>
  );
};
