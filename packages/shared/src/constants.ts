/**
 * SwasthyaSetu Shared Constants & Configurations
 */

// Implementation default weights for multi-field fuzzy identity scoring
export const IDENTITY_WEIGHTS = {
  NAME: 0.35,
  PHONE: 0.25,
  VILLAGE: 0.15,
  AGE: 0.10,
  GENDER: 0.05,
  CONTEXT: 0.10,
} as const;

// Confidence thresholds for clinical document intelligence
export const CONFIDENCE_THRESHOLDS = {
  HIGH_CONFIDENCE: 0.90, // >= 0.90 -> Verified / Auto
  MEDIUM_CONFIDENCE: 0.70, // 0.70 - 0.89 -> Review depending on field
  LOW_CONFIDENCE: 0.70, // < 0.70 -> Mandatory review
} as const;

// Known medical abbreviations mapping
export const CLINICAL_ABBREVIATIONS: Record<string, string> = {
  OD: 'Once daily',
  BD: 'Twice daily',
  BID: 'Twice daily',
  TDS: 'Thrice daily',
  TID: 'Thrice daily',
  QID: 'Four times daily',
  QDS: 'Four times daily',
  SOS: 'As and when needed (emergencies/pain)',
  STAT: 'Immediately',
  HS: 'At bedtime',
  AC: 'Before meals',
  PC: 'After meals',
  TAB: 'Tablet',
  CAP: 'Capsule',
  SYP: 'Syrup',
  INJ: 'Injection',
  PO: 'By mouth',
  IV: 'Intravenous',
  IM: 'Intramuscular',
};

// Seed facilities
export const SEED_FACILITIES = [
  {
    code: 'PHC-KHED',
    name: 'Primary Health Centre Khed',
    type: 'PHC' as const,
    district: 'Pune',
    state: 'Maharashtra',
  },
  {
    code: 'DIST-HOSP',
    name: 'Aundh District Hospital',
    type: 'DISTRICT_HOSPITAL' as const,
    district: 'Pune',
    state: 'Maharashtra',
  },
  {
    code: 'NEXT-CLINIC',
    name: 'Sanjivani Community Clinic',
    type: 'PRIVATE_CLINIC' as const,
    district: 'Pune',
    state: 'Maharashtra',
  },
];

/**
 * Format minimal referral metadata into a compact SMS payload (< 160 characters)
 */
export function formatFallbackSMS(params: {
  referralNumber: string;
  patientName: string;
  age: number;
  gender: string;
  sourceFacilityCode: string;
  destinationFacilityCode: string;
  urgency: string;
  reason?: string;
}): string {
  const cleanName = params.patientName.toUpperCase().slice(0, 16);
  const sex = params.gender.toUpperCase().charAt(0);
  const reasonTag = params.reason ? `|DX:${params.reason.toUpperCase().slice(0, 20)}` : '';
  const sms = (
    `SWASTHYASETU|REF:${params.referralNumber}|PATIENT:${cleanName}|` +
    `AGE:${params.age}|SEX:${sex}|FROM:${params.sourceFacilityCode}|` +
    `TO:${params.destinationFacilityCode}|URG:${params.urgency.slice(0, 4)}${reasonTag}`
  );
  return sms.length > 160 ? sms.slice(0, 160) : sms;
}
