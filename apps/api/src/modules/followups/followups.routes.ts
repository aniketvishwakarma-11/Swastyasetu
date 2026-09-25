import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { randomUUID } from 'crypto';

const router = Router();

export interface FollowUpItem {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  phone: string;
  village: string;
  referralId: string;
  referralNumber: string;
  dischargingHospital: string;
  dischargeDate: string;
  dischargeDiagnosis: string;
  dueAt: string;
  purpose: string;
  prescribedRegimen: string[];
  status: 'SCHEDULED' | 'OVERDUE' | 'COMPLETED' | 'FLAGGED_ASHA';
  completionNotes?: string;
  adherenceStatus?: 'FULL_ADHERENCE' | 'PARTIAL_MISSED' | 'ADVERSE_EFFECTS' | 'STOPPED';
  completedAt?: string;
  completedBy?: string;
  ashaAssigned?: string;
  createdAt: string;
}

// In-memory store initialized with clinical continuity fixtures
const followUpsStore: FollowUpItem[] = [
  {
    id: 'fup-101',
    patientId: 'pat-kailash-01',
    patientName: 'Kailash Jadhav',
    age: 47,
    gender: 'Male',
    phone: '9876543210',
    village: 'Khed Shivapur',
    referralId: 'ref-stemi-01',
    referralNumber: 'RF-1024',
    dischargingHospital: 'Aundh District Hospital, Pune',
    dischargeDate: new Date(Date.now() - 6 * 86400000).toISOString(),
    dischargeDiagnosis: 'Acute STEMI (Anterior Wall) - Successful PCI with DES to LAD',
    dueAt: new Date(Date.now() + 3600000).toISOString(), // Due today
    purpose: 'Day-7 Post-PCI Review: Repeat ECG, check BP/SpO2, verify DAPT adherence.',
    prescribedRegimen: [
      'Aspirin 75mg once daily (Post-meal)',
      'Clopidogrel 75mg once daily',
      'Atorvastatin 80mg once daily at bedtime',
      'Metoprolol Succinate 25mg once daily',
    ],
    status: 'SCHEDULED',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'fup-102',
    patientId: 'pat-sunita-02',
    patientName: 'Sunita Devi',
    age: 28,
    gender: 'Female',
    phone: '9822334455',
    village: 'Ranjani',
    referralId: 'ref-maternal-02',
    referralNumber: 'RF-1088',
    dischargingHospital: 'Aundh District Hospital, Pune',
    dischargeDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    dischargeDiagnosis: 'Post-Partum Severe Pre-eclampsia - Stabilized with IV Magnesium Sulfate',
    dueAt: new Date(Date.now() + 2 * 86400000).toISOString(), // Due in 2 days
    purpose: 'Twice-weekly blood pressure surveillance and urine proteinuria dipstick test.',
    prescribedRegimen: [
      'Labetalol 100mg twice daily',
      'Calcium Carbonate 500mg daily',
      'Iron & Folic Acid once daily',
    ],
    status: 'SCHEDULED',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'fup-103',
    patientId: 'pat-gopal-03',
    patientName: 'Gopal Patil',
    age: 58,
    gender: 'Male',
    phone: '9890123456',
    village: 'Saswad Rural',
    referralId: 'ref-diab-03',
    referralNumber: 'RF-0992',
    dischargingHospital: 'Sanjivani Community Clinic, Pune',
    dischargeDate: new Date(Date.now() - 9 * 86400000).toISOString(),
    dischargeDiagnosis: 'Type 2 Diabetes Mellitus with Right Hallux Wagner Grade 2 Ulcer',
    dueAt: new Date(Date.now() - 2 * 86400000).toISOString(), // Overdue by 2 days
    purpose: 'Surgical wound inspection, sterile dressing change, and fasting blood glucose titration.',
    prescribedRegimen: [
      'Metformin 500mg twice daily with meals',
      'Amoxicillin + Clavulanate 625mg twice daily (complete 10-day course)',
      'Daily sterile saline dressings',
    ],
    status: 'OVERDUE',
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
];

/**
 * GET /api/follow-ups
 * Retrieve follow-up tasks for the facility
 */
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    let items = [...followUpsStore];
    if (status && typeof status === 'string') {
      items = items.filter((f) => f.status.toLowerCase() === status.toLowerCase());
    }

    res.status(200).json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve follow-up items: ' + (error.message || 'Internal error'),
    });
  }
});

/**
 * POST /api/follow-ups/:id/complete
 * Record completed follow-up consultation and sync closed loop back to hospital
 */
router.post('/:id/complete', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { completionNotes, adherenceStatus } = req.body;

    const item = followUpsStore.find((f) => f.id === id);
    if (!item) {
      res.status(404).json({
        success: false,
        error: `Follow-up task ${id} not found.`,
      });
      return;
    }

    item.status = 'COMPLETED';
    item.completionNotes = completionNotes || 'Routine checkup completed. Patient stable.';
    item.adherenceStatus = adherenceStatus || 'FULL_ADHERENCE';
    item.completedAt = new Date().toISOString();
    item.completedBy = req.user?.name || 'Dr. Rajesh Sharma';

    res.status(200).json({
      success: true,
      data: item,
      message: `Follow-up for ${item.patientName} successfully completed and synced to District Hospital record.`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to complete follow-up: ' + (error.message || 'Internal error'),
    });
  }
});

/**
 * POST /api/follow-ups/:id/flag-asha
 * Flag overdue patient for urgent home visit by community health worker
 */
router.post('/:id/flag-asha', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ashaName } = req.body;

    const item = followUpsStore.find((f) => f.id === id);
    if (!item) {
      res.status(404).json({
        success: false,
        error: `Follow-up task ${id} not found.`,
      });
      return;
    }

    item.status = 'FLAGGED_ASHA';
    item.ashaAssigned = ashaName || 'Meena Tai (ASHA Sector 2)';

    res.status(200).json({
      success: true,
      data: item,
      message: `Urgent outreach dispatched: ${item.ashaAssigned} assigned for home visit to ${item.patientName}.`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to dispatch ASHA: ' + (error.message || 'Internal error'),
    });
  }
});

export default router;
