import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';

const router = Router();

// 1. PHC Only route
router.get(
  '/phc-only',
  requireAuth,
  requireRole('PHC_USER', 'ADMIN'),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: `Access granted to PHC resource for ${req.user!.name} (Role: ${req.user!.role})`,
      resource: 'PHC_DIGITAL_REFERRAL_QUEUE',
    });
  }
);

// 2. Clinician Only route
router.get(
  '/clinician-only',
  requireAuth,
  requireRole('CLINICIAN', 'ADMIN'),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: `Access granted to Clinician resource for ${req.user!.name} (Role: ${req.user!.role})`,
      resource: 'DISTRICT_HOSPITAL_TRIAGE_AND_IDENTITY_RECONCILIATION',
    });
  }
);

// 3. Coordinator Only route
router.get(
  '/coordinator-only',
  requireAuth,
  requireRole('REFERRAL_COORDINATOR', 'ADMIN'),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: `Access granted to Coordinator resource for ${req.user!.name} (Role: ${req.user!.role})`,
      resource: 'INTER_FACILITY_TRANSFER_BOARD',
    });
  }
);

// 4. Admin Only route
router.get(
  '/admin-only',
  requireAuth,
  requireRole('ADMIN'),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: `Access granted to Admin resource for ${req.user!.name} (Role: ${req.user!.role})`,
      resource: 'SYSTEM_AUDIT_LOGS_AND_FACILITY_CONFIGURATION',
    });
  }
);

export default router;
