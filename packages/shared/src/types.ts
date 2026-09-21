/**
 * SwasthyaSetu Shared Domain Types
 */

export type UserRole = 'PHC_USER' | 'CLINICIAN' | 'REFERRAL_COORDINATOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  facilityId?: string;
  createdAt: string;
}

export type FacilityType = 'PHC' | 'DISTRICT_HOSPITAL' | 'PRIVATE_CLINIC';

export interface Facility {
  id: string;
  code: string;
  name: string;
  type: FacilityType;
  district: string;
  state: string;
  phone?: string;
}

export type Gender = 'Male' | 'Female' | 'Other';

export interface Patient {
  id: string;
  localId?: string;
  name: string;
  age: number;
  gender: Gender;
  phone?: string;
  village: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export type UrgencyLevel = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export type ReferralStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'QUEUED'
  | 'SYNCING'
  | 'SENT'
  | 'RECEIVED'
  | 'IDENTITY_PENDING'
  | 'IDENTITY_CONFIRMED'
  | 'CONSULTED'
  | 'DISCHARGE_PROCESSING'
  | 'DOCUMENT_REVIEW'
  | 'CARE_RECORD_UPDATED'
  | 'FOLLOW_UP_DUE'
  | 'FOLLOW_UP_COMPLETED'
  | 'SYNC_FAILED'
  | 'CONFLICT';

export interface Referral {
  id: string;
  referralNumber: string; // e.g. RF-1024
  patientId: string;
  patient?: Patient;
  sourceFacilityId: string;
  sourceFacility?: Facility;
  destinationFacilityId: string;
  destinationFacility?: Facility;
  urgency: UrgencyLevel;
  reason: string;
  clinicalSummary: string;
  status: ReferralStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';

export interface SyncEvent<T = any> {
  id: string;
  eventId: string; // EVT-01J... Unique for idempotency
  entityType: 'PATIENT' | 'REFERRAL' | 'CLINICAL_DOCUMENT' | 'FOLLOW_UP' | 'IDENTITY_MATCH';
  entityId: string;
  operation: SyncOperation;
  payload: T;
  status: SyncStatus;
  retryCount: number;
  createdAt: string;
  syncedAt?: string;
  lastError?: string;
}

export type IdentityMatchStatus = 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED';

export interface FieldScoreEvidence {
  nameScore: number;
  ageScore: number;
  genderScore: number;
  villageScore: number;
  phoneScore: number;
  contextScore: number;
  totalScore: number;
  breakdown: Record<string, string>;
}

export interface IdentityMatch {
  id: string;
  referralId: string;
  incomingPatientId: string;
  incomingPatient?: Patient;
  candidatePatientId: string;
  candidatePatient?: Patient;
  score: number; // 0.00 to 1.00
  fieldScores: FieldScoreEvidence;
  status: IdentityMatchStatus;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type DocumentProcessingStatus = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

export interface ClinicalDocument {
  id: string;
  patientId: string;
  referralId?: string;
  documentType: 'DISCHARGE_SUMMARY' | 'PRESCRIPTION' | 'LAB_REPORT' | 'OTHER';
  originalFileUrl: string;
  ocrText?: string;
  processingStatus: DocumentProcessingStatus;
  createdAt: string;
}

export type FieldReviewStatus = 'AUTO_ACCEPTED' | 'NEEDS_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface ClinicalField {
  id: string;
  documentId: string;
  fieldName: string; // diagnosis, medicine, dosage, frequency, duration, etc.
  rawValue: string;
  normalizedValue?: string;
  confidence: number; // 0.00 to 1.00
  reviewStatus: FieldReviewStatus;
  reviewedValue?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type FollowUpStatus = 'SCHEDULED' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED';

export interface FollowUp {
  id: string;
  patientId: string;
  referralId?: string;
  dueAt: string;
  purpose: string;
  assignedProvider: string;
  status: FollowUpStatus;
  completedAt?: string;
  notes?: string;
}

export type AuditEventType =
  | 'REFERRAL_CREATED'
  | 'REFERRAL_QUEUED'
  | 'REFERRAL_SYNC_STARTED'
  | 'REFERRAL_SYNCED'
  | 'REFERRAL_RECEIVED'
  | 'IDENTITY_MATCH_SUGGESTED'
  | 'IDENTITY_CONFIRMED'
  | 'IDENTITY_REJECTED'
  | 'DOCUMENT_UPLOADED'
  | 'OCR_COMPLETED'
  | 'CLINICAL_FIELDS_EXTRACTED'
  | 'FIELD_REVIEWED'
  | 'CARE_RECORD_UPDATED'
  | 'FOLLOWUP_CREATED'
  | 'FOLLOWUP_COMPLETED';

export interface AuditEvent {
  id: string;
  eventId: string;
  actorId: string;
  actorRole: UserRole | 'SYSTEM';
  facilityId?: string;
  eventType: AuditEventType;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface SMSPayload {
  header: 'SWASTHYASETU';
  referralNumber: string;
  patientName: string;
  age: number;
  gender: string;
  fromFacilityCode: string;
  toFacilityCode: string;
  urgency: UrgencyLevel;
  timestamp: string;
  rawSms: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
