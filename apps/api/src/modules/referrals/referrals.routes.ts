import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { requireAuth } from '../../middleware/auth.middleware';
import { ReferralUrgency, ReferralStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

const router = Router();

/**
 * GET /api/referrals
 * Retrieve list of referrals with optional filters (status, urgency, facilityId)
 */
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, urgency, facilityId } = req.query;

    const whereClause: any = {};

    if (status && typeof status === 'string') {
      whereClause.status = status as ReferralStatus;
    }

    if (urgency && typeof urgency === 'string') {
      whereClause.urgency = urgency as ReferralUrgency;
    }

    // Role-aware default filtering
    if (facilityId && typeof facilityId === 'string') {
      whereClause.OR = [
        { sourceFacilityId: facilityId },
        { destinationFacilityId: facilityId },
      ];
    } else if (req.user?.facilityId && req.user.role !== 'ADMIN') {
      // If user belongs to a facility, filter to referrals where their facility is source or destination
      whereClause.OR = [
        { sourceFacilityId: req.user.facilityId },
        { destinationFacilityId: req.user.facilityId },
      ];
    }

    const referrals = await prisma.referral.findMany({
      where: whereClause,
      include: {
        patient: true,
        sourceFacility: true,
        destinationFacility: true,
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.status(200).json({
      success: true,
      data: referrals,
    });
  } catch (error: any) {
    console.error('[Referrals GET Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve referrals.',
        details: error.message,
      },
    });
  }
});

/**
 * GET /api/referrals/:id
 * Retrieve single referral details
 */
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const referral = await prisma.referral.findUnique({
      where: { id },
      include: {
        patient: true,
        sourceFacility: true,
        destinationFacility: true,
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        identityMatches: true,
        clinicalDocuments: {
          include: { extractedFields: true },
        },
        followUps: true,
      },
    });

    if (!referral) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Referral not found.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: referral,
    });
  } catch (error: any) {
    console.error('[Referrals GET by ID Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve referral details.',
      },
    });
  }
});

/**
 * Helper to generate collision-resistant clinical referral number: e.g. RF-8204
 */
function generateReferralNumber(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `RF-${randomDigits}`;
}

/**
 * POST /api/referrals
 * Create a new digital referral + link/create patient + log AuditEvent
 */
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patient,
      destinationFacilityId,
      urgency = 'ROUTINE',
      reason,
      clinicalSummary,
      sourceFacilityId: providedSourceFacilityId,
      eventId: clientEventId,
    } = req.body;

    if (!patient?.name || !destinationFacilityId || !reason || !clinicalSummary) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required referral fields: patient (name, age, gender, village), destinationFacilityId, reason, clinicalSummary.',
        },
      });
      return;
    }

    const sourceFacilityId = providedSourceFacilityId || req.user?.facilityId;
    if (!sourceFacilityId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SOURCE_FACILITY_REQUIRED',
          message: 'User does not have an associated facility. Please provide sourceFacilityId explicitly.',
        },
      });
      return;
    }

    // Generate unique referral number
    let referralNumber = generateReferralNumber();
    // Verify uniqueness
    const existing = await prisma.referral.findUnique({ where: { referralNumber } });
    if (existing) {
      referralNumber = `RF-${Date.now().toString().slice(-5)}`;
    }

    // Prisma Transaction to ensure atomic patient + referral + audit event creation
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Create or Find Patient
        let patientRecord;
        if (patient.id) {
          patientRecord = await tx.patient.findUnique({ where: { id: patient.id } });
        }

        if (!patientRecord) {
          patientRecord = await tx.patient.create({
            data: {
              localId: patient.localId || `LOC-${randomUUID().slice(0, 8)}`,
              name: patient.name.trim(),
              age: Number(patient.age) || 0,
              gender: patient.gender || 'Other',
              phone: patient.phone?.trim() || null,
              village: patient.village?.trim() || 'Unknown',
              address: patient.address?.trim() || null,
            },
          });
        }

        // 2. Create Referral
        const newReferral = await tx.referral.create({
          data: {
            referralNumber,
            patientId: patientRecord.id,
            sourceFacilityId,
            destinationFacilityId,
            urgency: urgency as ReferralUrgency,
            reason: reason.trim(),
            clinicalSummary: clinicalSummary.trim(),
            status: ReferralStatus.SENT,
            createdById: req.user?.id,
          },
          include: {
            patient: true,
            sourceFacility: true,
            destinationFacility: true,
          },
        });

        // 3. Log AuditEvent (Hard Clinical Safety Rule 4: Auditability)
        const auditEventId = clientEventId || `EVT-${randomUUID()}`;
        await tx.auditEvent.create({
          data: {
            eventId: auditEventId,
            actorId: req.user!.id,
            actorRole: req.user!.role,
            facilityId: sourceFacilityId,
            eventType: 'REFERRAL_CREATED',
            entityType: 'REFERRAL',
            entityId: newReferral.id,
            metadata: {
              referralNumber: newReferral.referralNumber,
              urgency: newReferral.urgency,
              destinationFacilityId,
              patientName: patientRecord.name,
            },
          },
        });

        return newReferral;
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Referral successfully created and dispatched.',
      data: result,
    });
  } catch (error: any) {
    console.error('[Referrals POST Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create referral.',
        details: error.message,
      },
    });
  }
});

export default router;
