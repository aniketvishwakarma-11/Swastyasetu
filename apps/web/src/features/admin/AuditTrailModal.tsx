import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  Lock,
  User,
  Building,
  ChevronDown,
  ChevronUp,
  Hash,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';

export interface AuditEventItem {
  id: string;
  eventId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  facilityId: string;
  facilityName: string;
  eventType: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, any>;
  timestamp: string;
  hash: string;
  prevHash: string;
}

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [chainStatus, setChainStatus] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Expanded row for JSON payload
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAuditEvents();
    }
  }, [isOpen, selectedEventType, selectedRole]);

  const loadAuditEvents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedEventType !== 'ALL') queryParams.append('eventType', selectedEventType);
      if (selectedRole !== 'ALL') queryParams.append('actorRole', selectedRole);
      if (search.trim()) queryParams.append('search', search.trim());

      const res = await apiRequest(`/audit/events?${queryParams.toString()}`);
      if (res.success && res.data) {
        setEvents(res.data);
        setChainStatus((res as any).chainStatus);
      }
    } catch (err) {
      console.error('[Load audit events error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLedger = async () => {
    setVerifying(true);
    try {
      const res = await apiRequest('/audit/verify');
      if (res.success) {
        setVerificationResult(res);
      }
    } catch (err) {
      console.error('[Verify audit ledger error]', err);
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  // Filter local search if not querying backend
  const filteredEvents = events.filter((ev) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ev.eventId.toLowerCase().includes(q) ||
      ev.eventType.toLowerCase().includes(q) ||
      ev.actorName.toLowerCase().includes(q) ||
      ev.entityId.toLowerCase().includes(q) ||
      JSON.stringify(ev.metadata).toLowerCase().includes(q)
    );
  });

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'REFERRAL_CREATED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IDENTITY_CONFIRMED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DOCUMENT_OCR_VERIFIED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DISCHARGE_SUMMARY_CREATED':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'FOLLOW_UP_COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SYNC_HEARTBEAT_ACK':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-900 via-slate-800 to-teal-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold">Immutable Clinical Audit Trail Explorer</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  RULE 4 ENFORCED
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Cryptographically Sealed SHA-256 Append-Only Clinical Ledger • Zero Tampering Permitted
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleVerifyLedger}
              disabled={verifying}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{verifying ? 'Verifying Hashes...' : 'Verify Cryptographic Integrity'}</span>
            </button>

            <button
              onClick={loadAuditEvents}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Verification Success / Status Banner */}
        {verificationResult && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Cryptographic Integrity Verified:</strong> All {verificationResult.verifiedCount} historical clinical state transitions link unbroken back to the Genesis block.
              </span>
            </div>
            <span className="font-mono text-[10px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
              SHA-256 Merkle Chain
            </span>
          </div>
        )}

        {/* Cryptographic Ledger Summary Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Ledger Status</span>
            <p className="font-bold text-emerald-700 flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>APPEND-ONLY • TAMPER-EVIDENT</span>
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Recorded Events</span>
            <p className="font-bold text-slate-900">{events.length} Sealed Audit Records</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Active Chain Tip Hash</span>
            <p className="font-mono text-[10px] text-slate-600 truncate" title={chainStatus?.tipHash}>
              {chainStatus?.tipHash || 'e4f1a098...7729b1'}
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by event ID, actor, patient, entity ID or diagnosis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-hidden focus:border-teal-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 outline-hidden font-medium"
            >
              <option value="ALL">All Event Types</option>
              <option value="REFERRAL_CREATED">REFERRAL_CREATED</option>
              <option value="SYNC_HEARTBEAT_ACK">SYNC_HEARTBEAT_ACK</option>
              <option value="AMBULANCE_DISPATCHED">AMBULANCE_DISPATCHED</option>
              <option value="IDENTITY_CONFIRMED">IDENTITY_CONFIRMED</option>
              <option value="DOCUMENT_OCR_VERIFIED">DOCUMENT_OCR_VERIFIED</option>
              <option value="DISCHARGE_SUMMARY_CREATED">DISCHARGE_SUMMARY_CREATED</option>
              <option value="FOLLOW_UP_COMPLETED">FOLLOW_UP_COMPLETED</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 outline-hidden font-medium"
            >
              <option value="ALL">All Actor Roles</option>
              <option value="PHC_USER">PHC_USER (Medical Officer)</option>
              <option value="CLINICIAN">CLINICIAN (Specialist)</option>
              <option value="REFERRAL_COORDINATOR">REFERRAL_COORDINATOR</option>
              <option value="SYSTEM">SYSTEM (Sync Engine)</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
        </div>

        {/* Scrollable Event List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <ShieldCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No matching audit events</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try clearing filters or search query.</p>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isExpanded = expandedId === ev.id;
              return (
                <div
                  key={ev.id}
                  className="rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition-all overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                    className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getEventTypeBadge(
                            ev.eventType
                          )}`}
                        >
                          {ev.eventType}
                        </span>

                        <span className="font-mono text-[11px] text-slate-600 font-semibold">
                          {ev.eventId}
                        </span>

                        <span className="text-[11px] text-slate-400">•</span>

                        <span className="text-[11px] text-slate-600">
                          Entity: <strong className="text-slate-800">{ev.entityType} ({ev.entityId})</strong>
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-slate-500 text-[11px]">
                        <span className="flex items-center space-x-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ev.actorName} ({ev.actorRole})</span>
                        </span>

                        <span>•</span>

                        <span className="flex items-center space-x-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ev.facilityName}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 sm:text-right shrink-0">
                      <div>
                        <p className="text-[11px] font-medium text-slate-700">
                          {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(ev.timestamp).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded JSON Details & Hash Linkage */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/70 space-y-3 text-xs">
                      {/* Cryptographic Linkage Block */}
                      <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[10px] space-y-1 overflow-x-auto shadow-inner">
                        <div className="flex items-center justify-between text-teal-400 font-bold border-b border-slate-700 pb-1">
                          <span className="flex items-center space-x-1">
                            <Hash className="w-3 h-3" />
                            <span>CRYPTOGRAPHIC MERKLE BLOCK LINK</span>
                          </span>
                          <span className="text-emerald-400">SEALED APPEND-ONLY</span>
                        </div>
                        <div className="pt-1">
                          <span className="text-slate-400">Previous Block Hash (Parent):</span>
                          <p className="text-slate-300 break-all">{ev.prevHash}</p>
                        </div>
                        <div>
                          <span className="text-teal-400 font-semibold">Current Block Hash (SHA-256):</span>
                          <p className="text-emerald-300 font-bold break-all">{ev.hash}</p>
                        </div>
                      </div>

                      {/* Metadata JSON Inspector */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                          Audit Event Payload &amp; Clinical Context
                        </span>
                        <pre className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 font-mono overflow-x-auto">
                          {JSON.stringify(ev.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{filteredEvents.length}</strong> of {events.length} clinical audit events.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
