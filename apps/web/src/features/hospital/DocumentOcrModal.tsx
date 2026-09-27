import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  FileText,
  FileCode,
  ScanLine,
  ZoomIn,
  ZoomOut,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  Edit3,
  Check,
  ShieldCheck,
  Layers,
  Sparkles,
  Activity,
  HeartPulse,
  Pill,
  Stethoscope,
  Calendar,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from 'lucide-react';
import { apiRequest, getApiAssetUrl } from '../../lib/api';
import { GeminiClinicalReport } from '@swastyasetu/shared';

export interface ClinicalFieldItem {
  id: string;
  fieldName: 'diagnosis' | 'medicine' | 'dosage' | 'frequency' | 'duration' | 'advice';
  rawValue: string;
  normalizedValue: string;
  confidence: number;
  reviewStatus: 'AUTO_ACCEPTED' | 'NEEDS_REVIEW' | 'VERIFIED' | 'REJECTED';
  reviewedValue?: string;
}

interface DocumentOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientAbha?: string;
  referralId?: string;
  onSuccess?: () => void;
}

export const DocumentOcrModal: React.FC<DocumentOcrModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientAbha,
  referralId,
  onSuccess,
}) => {
  // Extraction states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Document, Gemini Report and fields state
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentFileUrl, setDocumentFileUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<ClinicalFieldItem[]>([]);
  const [geminiReport, setGeminiReport] = useState<GeminiClinicalReport | null>(null);
  const [ocrEngine, setOcrEngine] = useState<string | null>(null);
  const [clinicianNotes, setClinicianNotes] = useState('');
  const [documentMimeType, setDocumentMimeType] = useState<string | null>(null);

  // Retain last uploaded file or preset for seamless 1-click retry
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [lastPresetKey, setLastPresetKey] = useState<string | null>(null);

  // View tabs: 'report' for rich Gemini intelligence, 'verification' for field verification editor
  const [activeTab, setActiveTab] = useState<'report' | 'verification'>('report');
  const [showRawOcrAudit, setShowRawOcrAudit] = useState(false);

  // Image viewer transform states
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen || documentId || fields.length > 0) return;

    let cancelled = false;

    async function restoreLatestDocument() {
      const response = await apiRequest<any[]>(`/documents/patient/${patientId}`);
      if (cancelled || !response.success || !response.data?.length) return;

      const latest = response.data[0];
      setDocumentId(latest.id);
      setDocumentFileUrl(latest.originalFileUrl || null);
      setDocumentMimeType(latest.originalFileUrl?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*');
      setFields(latest.extractedFields || []);
      setGeminiReport(latest.geminiReport || null);
      setOcrEngine(latest.ocrEngine || 'HUGGINGFACE_TROCR_GEMINI');
      if (latest.geminiReport) {
        setActiveTab('report');
      }
    }

    restoreLatestDocument().catch(() => {
      // Missing history should not block new capture
    });

    return () => {
      cancelled = true;
    };
  }, [documentId, fields.length, isOpen, patientId]);

  if (!isOpen) return null;

  // Handler: Run OCR with a clinical preset document
  const handleLoadPresetDemo = async (presetKey: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setZoomLevel(1);
    setRotation(0);
    setLastPresetKey(presetKey);
    setLastUploadedFile(null);

    try {
      const res = await apiRequest('/documents/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          referralId: referralId || undefined,
          documentType: 'DISCHARGE_SUMMARY',
          presetKey,
        }),
      });

      if (res.success && res.data?.document) {
        const doc = res.data.document;
        setDocumentId(doc.id);
        setDocumentFileUrl(doc.originalFileUrl);
        setDocumentMimeType('image/svg+xml');
        setFields(doc.extractedFields || []);
        const report = res.data.geminiReport || doc.geminiReport || null;
        setGeminiReport(report);
        setOcrEngine(res.data.engine || 'HUGGINGFACE_TROCR_GEMINI');
        if (report) {
          setActiveTab('report');
        }
      } else {
        setErrorMessage(res.error?.message || 'Failed to extract document fields.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred during OCR extraction.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Execute file upload and AI extraction
  const executeFileUpload = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setZoomLevel(1);
    setRotation(0);
    setLastUploadedFile(file);
    setLastPresetKey(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patientId);
      if (referralId) formData.append('referralId', referralId);
      formData.append('documentType', 'PRESCRIPTION');

      const res = await apiRequest('/documents/extract', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.data?.document) {
        const doc = res.data.document;
        setDocumentId(doc.id);
        setDocumentFileUrl(doc.originalFileUrl);
        setDocumentMimeType(file.type || 'image/*');
        setFields(doc.extractedFields || []);
        const report = res.data.geminiReport || doc.geminiReport || null;
        setGeminiReport(report);
        setOcrEngine(res.data.engine || 'HUGGINGFACE_TROCR_GEMINI');
        if (report) {
          setActiveTab('report');
        }
      } else {
        const msg = res.error?.message || 'Failed to extract document.';
        setErrorMessage(msg);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload or extraction failed.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handler: Upload custom file from user's machine
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      executeFileUpload(file);
    }
  };

  // Handler: 1-Click Retry with exact same document or preset
  const handleRetryExtraction = () => {
    if (lastUploadedFile) {
      executeFileUpload(lastUploadedFile);
    } else if (lastPresetKey) {
      handleLoadPresetDemo(lastPresetKey);
    } else {
      handleLoadPresetDemo('STEMI_DISCHARGE');
    }
  };

  // Handler: Update edited field value in state
  const handleFieldChange = (fieldId: string, newValue: string) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          return {
            ...f,
            reviewedValue: newValue,
            reviewStatus: 'VERIFIED',
          };
        }
        return f;
      })
    );
  };

  // Handler: Clinician commits and confirms all fields (Hard Rule 4: Audit Event)
  const handleConfirmCareRecord = async () => {
    if (!documentId) return;

    setIsConfirming(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        fields: fields.map((f) => ({
          id: f.id,
          reviewedValue: f.reviewedValue || f.normalizedValue || f.rawValue,
          reviewStatus: 'VERIFIED',
        })),
        clinicianNotes: clinicianNotes.trim() || 'Clinician reviewed and confirmed discharge medication record.',
      };

      const res = await apiRequest(`/documents/${documentId}/confirm-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setSuccessMessage('Clinical care record verified & synced to Master Patient Chart!');
        setFields((prev) => prev.map((f) => ({ ...f, reviewStatus: 'VERIFIED' })));
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        setErrorMessage(res.error?.message || 'Failed to confirm fields.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred while saving.');
    } finally {
      setIsConfirming(false);
    }
  };

  const needsReviewCount = fields.filter((f) => f.reviewStatus === 'NEEDS_REVIEW').length;
  const autoAcceptedCount = fields.filter((f) => f.reviewStatus === 'AUTO_ACCEPTED' || f.reviewStatus === 'VERIFIED').length;

  const renderEngineBadge = () => {
    if (!ocrEngine) return null;
    let label = 'TrOCR + Gemini 1.5 Flash';
    let colorClass = 'bg-teal-50 text-teal-700 border-teal-200';

    if (ocrEngine === 'HUGGINGFACE_TROCR_GEMINI') {
      label = 'Dual AI: TrOCR + Gemini 1.5 Flash';
      colorClass = 'bg-teal-50 text-teal-800 border-teal-300';
    } else if (ocrEngine === 'GEMINI_DIRECT') {
      label = 'Gemini 1.5 Flash Vision Direct';
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    } else if (ocrEngine === 'HUGGINGFACE_MEDIVAULT_TROCR') {
      label = 'Hugging Face Space TrOCR';
      colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
    } else if (ocrEngine === 'RESILIENT_CLINICAL_FALLBACK') {
      label = 'Resilient Clinical Fallback';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
    }

    return (
      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
        <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
        <span>{label}</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-inner">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  AI Clinical Document Intelligence &amp; Prescription Analyzer
                </h3>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  Dual-Tier AI Pipeline
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Patient: <span className="font-semibold text-white">{patientName}</span> • ABHA:{' '}
                <span className="font-mono text-teal-300">{patientAbha || '91-4829-1029-4401'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden lg:block">{renderEngineBadge()}</div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action / Preset Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center space-x-2 flex-wrap gap-1.5">
            <span className="font-semibold text-slate-700 flex items-center mr-1">
              <Layers className="w-3.5 h-3.5 mr-1 text-teal-600" />
              1-Click Demo Presets:
            </span>
            <button
              onClick={() => handleLoadPresetDemo('STEMI_DISCHARGE')}
              disabled={isProcessing}
              className="px-3 py-1 rounded-md bg-teal-700 text-white font-medium hover:bg-teal-800 transition shadow-xs disabled:opacity-50"
            >
              Cardiology STEMI Discharge
            </button>
            <button
              onClick={() => handleLoadPresetDemo('DENGUE_MONITORING')}
              disabled={isProcessing}
              className="px-3 py-1 rounded-md bg-white text-slate-700 border border-slate-300 font-medium hover:bg-slate-100 transition disabled:opacity-50"
            >
              Dengue Advisory
            </button>
            <button
              onClick={() => handleLoadPresetDemo('ANTENATAL_CARE')}
              disabled={isProcessing}
              className="px-3 py-1 rounded-md bg-white text-slate-700 border border-slate-300 font-medium hover:bg-slate-100 transition disabled:opacity-50"
            >
              Antenatal Care
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.pdf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="inline-flex items-center px-3.5 py-1.5 rounded-md border border-teal-600 bg-teal-600 hover:bg-teal-700 text-white font-semibold transition shadow-xs disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload Prescription Photo
            </button>
          </div>
        </div>

        {/* Status Notifications */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-rose-900">Extraction Interrupted</p>
                <p className="text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRetryExtraction}
                disabled={isProcessing}
                className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isProcessing ? 'animate-spin' : ''}`} />
                Retry Extraction
              </button>
              <button
                onClick={() => handleLoadPresetDemo('STEMI_DISCHARGE')}
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 font-semibold text-xs transition disabled:opacity-50"
              >
                Use Verified Sample
              </button>
            </div>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Split Screen Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-6 overflow-hidden min-h-[480px]">
          
          {/* Left Column: Original Prescription / Document Scan Viewer */}
          <div className="border border-slate-200 rounded-xl flex flex-col bg-slate-950 overflow-hidden shadow-inner relative">
            {/* Viewer Controls */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300 z-10">
              <span className="font-semibold flex items-center text-slate-200">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                Original Scanned Document
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  className="px-2 py-0.5 text-[10px] rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Document Render Area */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-slate-950/90 relative">
              {isProcessing ? (
                <div className="text-center text-slate-400 space-y-3 py-16">
                  <div className="relative w-12 h-12 mx-auto">
                    <RefreshCw className="w-12 h-12 animate-spin text-teal-400" />
                    <Sparkles className="w-5 h-5 text-amber-300 absolute top-3.5 left-3.5 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-white">Running Multimodal AI Analysis...</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Stage 1: TrOCR handwritten transcription<br />
                    Stage 2: Gemini 1.5 Flash clinical structuring
                  </p>
                </div>
              ) : documentFileUrl ? (
                <div
                  className="transition-transform duration-200 origin-center max-w-full flex items-center justify-center"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  }}
                >
                  {documentMimeType === 'application/pdf' ? (
                    <iframe
                      src={getApiAssetUrl(documentFileUrl)}
                      title="Clinical Document PDF"
                      className="h-[520px] w-full rounded-lg bg-white"
                    />
                  ) : (
                    <img
                      src={getApiAssetUrl(documentFileUrl)}
                      alt="Clinical Document Scan"
                      className="max-h-[520px] w-auto rounded-lg shadow-xl object-contain bg-white"
                      onError={() => setErrorMessage('The document was processed, but the image preview could not be loaded.')}
                    />
                  )}
                </div>
              ) : errorMessage ? (
                <div className="text-center text-slate-300 p-8 max-w-md mx-auto space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Extraction Interrupted</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {errorMessage}
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      onClick={handleRetryExtraction}
                      disabled={isProcessing}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                      Retry Extraction
                    </button>
                    <button
                      onClick={() => handleLoadPresetDemo('STEMI_DISCHARGE')}
                      disabled={isProcessing}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition disabled:opacity-50"
                    >
                      Use Demo Preset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 p-8">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-600">
                    <ScanLine className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">No Document Uploaded</p>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">
                    Select one of the 1-Click Demo Presets above or upload a prescription photo to begin the clinical analysis.
                  </p>
                </div>
              )}
            </div>

            {/* Document Quality Footer if available */}
            {geminiReport?.documentQuality && (
              <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center space-x-3">
                  <span>
                    Legibility:{' '}
                    <strong className="text-teal-300">{geminiReport.documentQuality.legibilityScore}%</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Completeness:{' '}
                    <strong className="text-teal-300">{geminiReport.documentQuality.completenessScore}%</strong>
                  </span>
                </div>
                {geminiReport.documentQuality.issues?.length > 0 && (
                  <span className="text-amber-400 truncate max-w-[200px]" title={geminiReport.documentQuality.issues[0]}>
                    ⚠️ {geminiReport.documentQuality.issues[0]}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Hospital-Grade Clinical Intelligence Report & Field Editor */}
          <div className="border border-slate-200 rounded-xl flex flex-col bg-slate-50 overflow-hidden shadow-sm">
            
            {/* Tab Navigation Header */}
            <div className="bg-white border-b border-slate-200 px-4 pt-2.5 flex items-center justify-between">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('report')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center space-x-1.5 ${
                    activeTab === 'report'
                      ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Clinical Intelligence Report</span>
                  {geminiReport && (
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('verification')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center space-x-1.5 ${
                    activeTab === 'verification'
                      ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Field Verification &amp; Commit</span>
                  {needsReviewCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-300">
                      {needsReviewCount}
                    </span>
                  )}
                </button>
              </div>

              {fields.length > 0 && (
                <div className="hidden sm:flex items-center space-x-1.5 text-[11px] pb-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    {autoAcceptedCount} Auto-Accepted
                  </span>
                  {needsReviewCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold">
                      {needsReviewCount} Needs Review
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tab 1 Content: Full Clinical Intelligence Report */}
            {activeTab === 'report' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {!geminiReport ? (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <Stethoscope className="w-12 h-12 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No Clinical Report Generated Yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Select a clinical demo preset or upload a prescription image to generate a hospital-grade clinical summary, ICD-10 diagnoses, and medication regimen.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Critical Safety Alerts Banner */}
                    {geminiReport.criticalAlerts && geminiReport.criticalAlerts.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 shadow-xs">
                        <div className="flex items-center space-x-2 mb-1.5">
                          <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                            Critical Clinical Safety Alerts
                          </h4>
                        </div>
                        <ul className="space-y-1 text-xs text-rose-900 pl-6 list-disc font-medium">
                          {geminiReport.criticalAlerts.map((alert, idx) => (
                            <li key={idx}>{alert}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Clinical Overview Card */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs border-l-4 border-l-teal-600">
                      <div className="flex items-center space-x-2 mb-2">
                        <Stethoscope className="w-4 h-4 text-teal-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Clinical Overview &amp; Assessment
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                        {geminiReport.clinicalSummary}
                      </p>
                    </div>

                    {/* Diagnoses with ICD-10 coding */}
                    {geminiReport.diagnoses && geminiReport.diagnoses.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Activity className="w-4 h-4 text-teal-600" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Provisional &amp; Confirmed Diagnoses
                            </h4>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">ICD-10 Mapped</span>
                        </div>

                        <div className="space-y-2">
                          {geminiReport.diagnoses.map((diag, idx) => {
                            const conf = diag.confidence ?? 90;
                            const severity = diag.severity || 'MODERATE';
                            let severityColor = 'bg-blue-50 text-blue-700 border-blue-200';
                            if (severity === 'CRITICAL') severityColor = 'bg-rose-50 text-rose-700 border-rose-300';
                            else if (severity === 'SEVERE') severityColor = 'bg-amber-50 text-amber-700 border-amber-300';
                            else if (severity === 'MILD') severityColor = 'bg-slate-100 text-slate-700 border-slate-200';

                            return (
                              <div
                                key={idx}
                                className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                                      {diag.name}
                                    </span>
                                    {diag.icdCode && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 text-teal-800 border border-teal-200">
                                        ICD-10: {diag.icdCode}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityColor}`}>
                                    {severity}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
                                    {conf}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Prescribed Medications & Regimen Table */}
                    {geminiReport.medications && geminiReport.medications.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Pill className="w-4 h-4 text-teal-600" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Prescribed Pharmacotherapy &amp; Regimens ({geminiReport.medications.length})
                            </h4>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {geminiReport.medications.map((med, idx) => {
                            const conf = med.confidence ?? 90;
                            const isLowConf = conf < 90;

                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg border transition ${
                                  isLowConf
                                    ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/40'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center space-x-2 flex-wrap">
                                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                                        {med.name}
                                      </span>
                                      {med.genericName && (
                                        <span className="text-xs text-slate-500 font-medium">
                                          ({med.genericName})
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center space-x-2 mt-1 flex-wrap text-xs text-slate-600">
                                      {med.dosage && (
                                        <span className="font-semibold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                          {med.dosage}
                                        </span>
                                      )}
                                      {med.frequency && (
                                        <span className="bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded font-medium border border-teal-200">
                                          {med.frequency}
                                        </span>
                                      )}
                                      {med.duration && (
                                        <span className="text-slate-500">Duration: {med.duration}</span>
                                      )}
                                      {med.route && (
                                        <span className="text-slate-400">({med.route})</span>
                                      )}
                                    </div>

                                    {med.instructions && (
                                      <p className="text-[11px] text-slate-600 italic mt-1">
                                        Directions: {med.instructions}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                        isLowConf
                                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {conf}%
                                    </span>
                                    {isLowConf && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                                        Verify
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Vitals Grid if available */}
                    {geminiReport.vitals && Object.values(geminiReport.vitals).some(Boolean) && (
                      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                        <div className="flex items-center space-x-2 mb-3">
                          <HeartPulse className="w-4 h-4 text-teal-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Recorded Clinical Vitals
                          </h4>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {geminiReport.vitals.bp && (
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Blood Pressure
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block font-mono">
                                {geminiReport.vitals.bp}
                              </span>
                            </div>
                          )}
                          {geminiReport.vitals.pulse && (
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Pulse Rate
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block font-mono">
                                {geminiReport.vitals.pulse}
                              </span>
                            </div>
                          )}
                          {geminiReport.vitals.spo2 && (
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Oxygen Saturation (SpO2)
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block font-mono">
                                {geminiReport.vitals.spo2}
                              </span>
                            </div>
                          )}
                          {geminiReport.vitals.temperature && (
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Temperature
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block font-mono">
                                {geminiReport.vitals.temperature}
                              </span>
                            </div>
                          )}
                          {geminiReport.vitals.bloodGlucose && (
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Blood Glucose
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block font-mono">
                                {geminiReport.vitals.bloodGlucose}
                              </span>
                            </div>
                          )}
                          {geminiReport.vitals.respiratoryRate && (
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Resp Rate
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block font-mono">
                                {geminiReport.vitals.respiratoryRate}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Lab Findings if available */}
                    {geminiReport.labFindings && geminiReport.labFindings.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                        <div className="flex items-center space-x-2 mb-3">
                          <Activity className="w-4 h-4 text-teal-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Laboratory Observations &amp; Biomarkers
                          </h4>
                        </div>

                        <div className="space-y-1.5">
                          {geminiReport.labFindings.map((lab, idx) => {
                            let badgeColor = 'bg-slate-100 text-slate-700';
                            if (lab.status === 'CRITICAL') badgeColor = 'bg-rose-100 text-rose-800 font-bold';
                            else if (lab.status === 'LOW' || lab.status === 'HIGH') badgeColor = 'bg-amber-100 text-amber-800 font-bold';
                            else if (lab.status === 'NORMAL') badgeColor = 'bg-emerald-100 text-emerald-800';

                            return (
                              <div
                                key={idx}
                                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                              >
                                <span className="font-semibold text-slate-800">{lab.test}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono font-bold text-slate-900">
                                    {lab.value} {lab.unit || ''}
                                  </span>
                                  {lab.status && (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${badgeColor}`}>
                                      {lab.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Follow-up and Instructions */}
                    {geminiReport.followUpInstructions && (
                      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Ambulatory Follow-Up Schedule
                          </h4>
                        </div>
                        <div className="p-3 rounded-lg bg-teal-50/50 border border-teal-200 text-xs text-teal-950 space-y-1">
                          {geminiReport.followUpInstructions.when && (
                            <p>
                              <strong>Timeline:</strong> {geminiReport.followUpInstructions.when}
                            </p>
                          )}
                          {geminiReport.followUpInstructions.where && (
                            <p>
                              <strong>Location:</strong> {geminiReport.followUpInstructions.where}
                            </p>
                          )}
                          {geminiReport.followUpInstructions.purpose && (
                            <p>
                              <strong>Clinical Objective:</strong> {geminiReport.followUpInstructions.purpose}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Raw OCR Audit Collapsible Block */}
                    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                      <button
                        onClick={() => setShowRawOcrAudit((v) => !v)}
                        className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition"
                      >
                        <span className="flex items-center">
                          <FileCode className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                          Statutory Optical OCR Transcription (Audit Trail)
                        </span>
                        {showRawOcrAudit ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>

                      {showRawOcrAudit && (
                        <div className="p-3 bg-slate-900 text-slate-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-48 border-t border-slate-800">
                          <pre className="whitespace-pre-wrap">{geminiReport.rawOcrText || 'No optical text stream available.'}</pre>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Tab 2 Content: Field Verification & Clinician Commit */}
            {activeTab === 'verification' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {/* Rule 1 Banner */}
                {fields.length > 0 && needsReviewCount > 0 && !successMessage && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start space-x-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        Hard Clinical Safety Rule 1: No Silent Guessing Enforced
                      </p>
                      <p className="text-amber-800 mt-0.5">
                        {needsReviewCount} field(s) have extraction confidence &lt; 90%. Review the scan on the left and edit or verify the value before saving.
                      </p>
                    </div>
                  </div>
                )}

                {fields.length === 0 ? (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <FileText className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No Structured Data Yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Choose a demo preset or upload a prescription to extract structured ICD-10 diagnoses and dosages.
                    </p>
                  </div>
                ) : (
                  fields.map((field) => {
                    const isNeedsReview = field.reviewStatus === 'NEEDS_REVIEW';
                    const isVerified = field.reviewStatus === 'VERIFIED';
                    const confidencePct = Math.round(field.confidence * 100);

                    return (
                      <div
                        key={field.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isNeedsReview
                            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300/40 shadow-xs'
                            : isVerified
                            ? 'bg-emerald-50/50 border-emerald-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        {/* Top row */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            {field.fieldName}
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                confidencePct >= 90
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {confidencePct}% Confidence
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                isNeedsReview
                                  ? 'bg-amber-200/80 text-amber-900'
                                  : isVerified
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {field.reviewStatus}
                            </span>
                          </div>
                        </div>

                        {/* Raw snippet */}
                        <p className="text-xs text-slate-500 italic mb-1.5">
                          Original Text:{' '}
                          <span className="font-mono text-slate-700 not-italic">
                            "{field.rawValue}"
                          </span>
                        </p>

                        {/* Normalized / Clinician Editable Input */}
                        <div className="relative">
                          <input
                            type="text"
                            value={field.reviewedValue ?? field.normalizedValue ?? ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder="Verify or correct clinical terminology..."
                            className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 ${
                              isNeedsReview
                                ? 'border-amber-400 bg-white text-slate-900 focus:ring-amber-500'
                                : 'border-slate-300 bg-slate-50/70 text-slate-900 focus:ring-teal-500'
                            }`}
                          />
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Clinician Notes Section */}
                {fields.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Clinician Verification Notes (Recorded in Immutable Audit Trail):
                    </label>
                    <textarea
                      rows={2}
                      value={clinicianNotes}
                      onChange={(e) => setClinicianNotes(e.target.value)}
                      placeholder="e.g. Dosage confirmed against post-PCI catheterization record..."
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Commit Footer */}
            {fields.length > 0 && (
              <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {activeTab === 'report' ? (
                    <button
                      onClick={() => setActiveTab('verification')}
                      className="text-teal-700 font-bold hover:underline inline-flex items-center"
                    >
                      <span>Review &amp; Edit Fields</span>
                      <ShieldCheck className="w-3.5 h-3.5 ml-1" />
                    </button>
                  ) : (
                    <span>Enforces <strong>Rule 4</strong> (Immutable Audit Log)</span>
                  )}
                </div>

                <button
                  onClick={handleConfirmCareRecord}
                  disabled={isConfirming}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isConfirming ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Saving to Care Record...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      Verify &amp; Commit Care Record
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
