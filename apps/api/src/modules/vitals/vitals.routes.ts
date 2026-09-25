import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { randomUUID } from 'crypto';

const router = Router();

export interface VitalsRecord {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  phone?: string;
  village?: string;
  systolicBp: number;
  diastolicBp: number;
  spo2: number;
  heartRate: number;
  bloodSugar?: number;
  temperature?: number;
  respiratoryRate?: number;
  gestationalWeeks?: number;
  ewsScore: number;
  ewsCategory: 'LOW_RISK' | 'MODERATE_RISK' | 'CRITICAL';
  safetyAlerts: string[];
  requiresReferral: boolean;
  facilityId?: string;
  createdById?: string;
  createdAt: string;
}

// In-memory store for rapid vitals session resilience
const vitalsStore: VitalsRecord[] = [
  {
    id: 'vit-demo-01',
    patientName: 'Santosh Shinde',
    age: 47,
    gender: 'Male',
    phone: '9876543210',
    village: 'Khed Shivapur',
    systolicBp: 175,
    diastolicBp: 105,
    spo2: 89,
    heartRate: 118,
    bloodSugar: 210,
    temperature: 99.1,
    respiratoryRate: 26,
    ewsScore: 9,
    ewsCategory: 'CRITICAL',
    safetyAlerts: [
      'HYPERTENSIVE CRISIS: Systolic BP > 160 mmHg (175 mmHg)',
      'HYPOXIA WARNING: SpO2 < 92% (89%)',
      'TACHYPNEA: Respiratory Rate > 24/min (26/min)',
    ],
    requiresReferral: true,
    facilityId: 'PHC-KHED',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'vit-demo-02',
    patientName: 'Sunita Devi',
    age: 28,
    gender: 'Female',
    phone: '9822334455',
    village: 'Ranjani',
    systolicBp: 142,
    diastolicBp: 92,
    spo2: 97,
    heartRate: 84,
    bloodSugar: 130,
    temperature: 98.4,
    respiratoryRate: 18,
    gestationalWeeks: 32,
    ewsScore: 2,
    ewsCategory: 'MODERATE_RISK',
    safetyAlerts: ['ELEVATED BP IN 3rd TRIMESTER: Requires Maternal Monitoring'],
    requiresReferral: false,
    facilityId: 'PHC-KHED',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

/**
 * Calculate Early Warning Score (EWS) and Safety Directives
 */
export function evaluateVitals(data: {
  systolicBp: number;
  diastolicBp: number;
  spo2: number;
  heartRate: number;
  bloodSugar?: number;
  respiratoryRate?: number;
  temperature?: number;
  gestationalWeeks?: number;
}) {
  let score = 0;
  const alerts: string[] = [];

  // SpO2 Scoring
  if (data.spo2 < 92) {
    score += 3;
    alerts.push(`HYPOXIA WARNING: SpO2 is ${data.spo2}% (< 92%). High risk of acute respiratory distress.`);
  } else if (data.spo2 <= 95) {
    score += 1;
  }

  // Blood Pressure Scoring
  if (data.systolicBp > 160 || data.diastolicBp > 100) {
    score += 3;
    alerts.push(`HYPERTENSIVE CRISIS: BP is ${data.systolicBp}/${data.diastolicBp} mmHg (Systolic > 160 or Diastolic > 100).`);
  } else if (data.systolicBp >= 140 || data.diastolicBp >= 90) {
    score += 1;
  } else if (data.systolicBp < 90) {
    score += 3;
    alerts.push(`HYPOTENSION: Systolic BP is ${data.systolicBp} mmHg (< 90). Risk of shock.`);
  }

  // Heart Rate Scoring
  if (data.heartRate > 120) {
    score += 3;
    alerts.push(`SEVERE TACHYCARDIA: Pulse is ${data.heartRate} bpm (> 120).`);
  } else if (data.heartRate > 100) {
    score += 1;
  } else if (data.heartRate < 50) {
    score += 3;
    alerts.push(`SEVERE BRADYCARDIA: Pulse is ${data.heartRate} bpm (< 50).`);
  }

  // Respiratory Rate
  if (data.respiratoryRate) {
    if (data.respiratoryRate > 24) {
      score += 3;
      alerts.push(`TACHYPNEA: Respiratory rate is ${data.respiratoryRate}/min (> 24).`);
    } else if (data.respiratoryRate < 10) {
      score += 3;
      alerts.push(`BRADYPNEA: Respiratory rate is ${data.respiratoryRate}/min (< 10).`);
    }
  }

  // Blood Sugar
  if (data.bloodSugar) {
    if (data.bloodSugar < 60) {
      score += 3;
      alerts.push(`HYPOGLYCEMIA: Blood glucose is ${data.bloodSugar} mg/dL (< 60 mg/dL). Immediate dextrose required.`);
    } else if (data.bloodSugar > 250) {
      score += 2;
      alerts.push(`SEVERE HYPERGLYCEMIA: Blood glucose is ${data.bloodSugar} mg/dL (> 250 mg/dL).`);
    }
  }

  // Maternal risk check
  if (data.gestationalWeeks && data.gestationalWeeks > 20 && (data.systolicBp >= 140 || data.diastolicBp >= 90)) {
    alerts.push(`PRE-ECLAMPSIA ALERT: Gestational age ${data.gestationalWeeks} weeks with BP ${data.systolicBp}/${data.diastolicBp}. Urgent obstetric review indicated.`);
  }

  let category: 'LOW_RISK' | 'MODERATE_RISK' | 'CRITICAL' = 'LOW_RISK';
  if (score >= 4 || alerts.some((a) => a.includes('CRISIS') || a.includes('HYPOXIA'))) {
    category = 'CRITICAL';
  } else if (score >= 2) {
    category = 'MODERATE_RISK';
  }

  return {
    score,
    category,
    alerts,
    requiresReferral: category === 'CRITICAL',
  };
}

/**
 * POST /api/vitals
 * Submit frontline vitals with instant EWS score and safety evaluation
 */
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patientName,
      age,
      gender,
      phone,
      village,
      systolicBp,
      diastolicBp,
      spo2,
      heartRate,
      bloodSugar,
      temperature,
      respiratoryRate,
      gestationalWeeks,
    } = req.body;

    if (!patientName || !systolicBp || !diastolicBp || !spo2 || !heartRate) {
      res.status(400).json({
        success: false,
        error: 'Missing required vitals: patientName, systolicBp, diastolicBp, spo2, heartRate are required.',
      });
      return;
    }

    const evaluation = evaluateVitals({
      systolicBp: Number(systolicBp),
      diastolicBp: Number(diastolicBp),
      spo2: Number(spo2),
      heartRate: Number(heartRate),
      bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
      temperature: temperature ? Number(temperature) : undefined,
      respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
      gestationalWeeks: gestationalWeeks ? Number(gestationalWeeks) : undefined,
    });

    const record: VitalsRecord = {
      id: `vit-${randomUUID().slice(0, 8)}`,
      patientName,
      age: Number(age) || 40,
      gender: gender || 'Male',
      phone,
      village,
      systolicBp: Number(systolicBp),
      diastolicBp: Number(diastolicBp),
      spo2: Number(spo2),
      heartRate: Number(heartRate),
      bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
      temperature: temperature ? Number(temperature) : undefined,
      respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
      gestationalWeeks: gestationalWeeks ? Number(gestationalWeeks) : undefined,
      ewsScore: evaluation.score,
      ewsCategory: evaluation.category,
      safetyAlerts: evaluation.alerts,
      requiresReferral: evaluation.requiresReferral,
      facilityId: req.user?.facilityId || 'PHC-LOCAL',
      createdById: req.user?.id,
      createdAt: new Date().toISOString(),
    };

    vitalsStore.unshift(record);

    res.status(201).json({
      success: true,
      data: record,
      message:
        evaluation.category === 'CRITICAL'
          ? 'CRITICAL ALERT: Early Warning Score exceeds safety threshold. Urgent referral recommended.'
          : 'Vitals successfully recorded and evaluated.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to record vitals: ' + (error.message || 'Internal error'),
    });
  }
});

/**
 * GET /api/vitals
 * Get recently screened vitals records
 */
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: vitalsStore,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to load vitals: ' + (error.message || 'Internal error'),
    });
  }
});

export default router;
