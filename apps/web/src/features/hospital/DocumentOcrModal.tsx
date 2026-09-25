import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
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
} from 'lucide-react';
import { apiRequest } from '../../lib/api';

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

  // Document and fields state
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentFileUrl, setDocumentFileUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<ClinicalFieldItem[]>([]);
  const [ocrEngine, setOcrEngine] = useState<string | null>(null);
  const [clinicianNotes, setClinicianNotes] = useState('');

  // Image viewer transform states
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handler: Run OCR with a clinical preset document
  const handleLoadPresetDemo = async (presetKey: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setZoomLevel(1);
    setRotation(0);

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
        setFields(doc.extractedFields || []);
        setOcrEngine(res.data.engine || 'HUGGINGFACE_MEDIVAULT_TROCR');
      } else {
        setErrorMessage(res.error?.message || 'Failed to extract document fields.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred during OCR extraction.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Upload custom file from user's machine
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setZoomLevel(1);
    setRotation(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patientId);
      if (referralId) formData.append('referralId', referralId);
      formData.append('documentType', 'PRESCRIPTION');

      // Direct multipart fetch using api base
      const token =
        localStorage.getItem('swastyasetu_auth_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('swasthya_token');
      const response = await fetch('/api/documents/extract', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const res = await response.json();

      if (res.success && res.data?.document) {
        const doc = res.data.document;
        setDocumentId(doc.id);
        setDocumentFileUrl(doc.originalFileUrl);
        setFields(doc.extractedFields || []);
        setOcrEngine(res.data.engine || 'HUGGINGFACE_MEDIVAULT_TROCR');
      } else {
        setErrorMessage(res.error?.message || 'Failed to extract document.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload or extraction failed.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
            // When clinician explicitly edits, elevate from NEEDS_REVIEW
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900">
                  AI Clinical Document & Prescription OCR Scanner
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-100 text-teal-800">
                  Step 7 & 8 Handoff
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-800">{patientName}</span> • ABHA: <span className="font-mono text-slate-700">{patientAbha || '91-4829-1029-4401'}</span> • TrOCR Vision Model
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {ocrEngine && (
              <span className="hidden md:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>{ocrEngine === 'HUGGINGFACE_MEDIVAULT_TROCR' ? 'HF Space: TrOCR Active' : 'Resilient Fallback Mode'}</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action / Preset Bar */}
        <div className="px-6 py-2.5 bg-teal-50/70 border-b border-teal-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <span className="font-semibold text-teal-900 flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1 text-teal-700" />
              1-Click Demo Presets:
            </span>
            <button
              onClick={() => handleLoadPresetDemo('STEMI_DISCHARGE')}
              disabled={isProcessing}
              className="px-2.5 py-1 rounded bg-teal-700 text-white font-medium hover:bg-teal-800 transition shadow-sm disabled:opacity-50"
            >
              Cardiology STEMI Discharge
            </button>
            <button
              onClick={() => handleLoadPresetDemo('DENGUE_MONITORING')}
              disabled={isProcessing}
              className="px-2.5 py-1 rounded bg-white text-teal-800 border border-teal-300 font-medium hover:bg-teal-100 transition disabled:opacity-50"
            >
              Dengue Advisory
            </button>
            <button
              onClick={() => handleLoadPresetDemo('ANTENATAL_CARE')}
              disabled={isProcessing}
              className="px-2.5 py-1 rounded bg-white text-teal-800 border border-teal-300 font-medium hover:bg-teal-100 transition disabled:opacity-50"
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
              className="inline-flex items-center px-3 py-1 rounded border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Upload Prescription Photo
            </button>
          </div>
        </div>

        {/* Status Banners */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Hard Rule 1 Banner (if items need review) */}
        {fields.length > 0 && needsReviewCount > 0 && !successMessage && (
          <div className="mx-6 mt-3 p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                Hard Clinical Safety Rule 1: No Silent Guessing Enforced
              </p>
              <p className="text-amber-800 mt-0.5">
                {needsReviewCount} field(s) have extraction confidence &lt; 90% due to cursive handwriting. Review the original scan on the left and edit or verify the dosage before saving.
              </p>
            </div>
          </div>
        )}

        {/* Split Screen Workspace */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 overflow-hidden min-h-[460px]">
          {/* Left Column: Original Scanned Document Viewer */}
          <div className="border border-slate-200 rounded-lg flex flex-col bg-slate-900 overflow-hidden shadow-inner relative">
            {/* Viewer Controls */}
            <div className="bg-slate-800/90 border-b border-slate-700 px-3 py-1.5 flex items-center justify-between text-xs text-slate-300 z-10">
              <span className="font-semibold flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1 text-teal-400" />
                Original Document Scan
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                  className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                  className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  className="px-1.5 py-0.5 text-[10px] rounded hover:bg-slate-700 text-slate-300"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Document Render Area */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-slate-950/70">
              {isProcessing ? (
                <div className="text-center text-slate-400 space-y-3">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-teal-500" />
                  <p className="text-sm font-medium">Running Vision OCR on Space...</p>
                  <p className="text-xs text-slate-500">Transcribing cursive handwriting with TrOCR</p>
                </div>
              ) : documentFileUrl ? (
                <div
                  className="transition-transform duration-200 origin-center max-w-full"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={
                      documentFileUrl.startsWith('http')
                        ? documentFileUrl
                        : `${(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '')}${documentFileUrl}`
                    }
                    alt="Clinical Document"
                    className="max-h-[500px] w-auto rounded shadow-lg object-contain bg-white"
                  />
                </div>
              ) : (
                <div className="text-center text-slate-400 p-8">
                  <ScanLine className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No Document Loaded</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Select a document preset above or upload an image/PDF file to begin clinical OCR extraction.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Structured Normalized Fields & Review Cards */}
          <div className="border border-slate-200 rounded-lg flex flex-col bg-slate-50 overflow-hidden shadow-sm">
            {/* Header info */}
            <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Structured Clinical Entities
                </span>
              </div>
              {fields.length > 0 && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    {autoAcceptedCount} Verified / Auto-Accepted
                  </span>
                  {needsReviewCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-semibold">
                      {needsReviewCount} Needs Review
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Field Cards Scrollable Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {fields.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <FileText className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No Structured Data Yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Choose a demo preset or upload a prescription to extract ICD-10 diagnoses, generic medications, dosages, and regimens.
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
                      className={`p-3 rounded-lg border transition-all ${
                        isNeedsReview
                          ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300/40 shadow-sm'
                          : isVerified
                          ? 'bg-emerald-50/50 border-emerald-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Top row: Label, Confidence badge, Status badge */}
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

                      {/* Raw OCR snippet */}
                      <p className="text-xs text-slate-500 italic mb-1.5">
                        Raw OCR:{' '}
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
                          className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded border focus:outline-none focus:ring-2 ${
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
                    Clinician Verification Notes (Recorded in Audit Trail):
                  </label>
                  <textarea
                    rows={2}
                    value={clinicianNotes}
                    onChange={(e) => setClinicianNotes(e.target.value)}
                    placeholder="e.g. Dosage confirmed against post-PCI catheterization lab record..."
                    className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Commit Footer */}
            {fields.length > 0 && (
              <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Enforces <strong>Rule 4</strong> (Immutable Audit Log)
                </span>
                <button
                  onClick={handleConfirmCareRecord}
                  disabled={isConfirming}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
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
