import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { evaluateIdentityMatch } from './identityMatcher';
import { IdentityMatchStatus, ReferralStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

const router = Router();

/**
 * GET /api/identity/matches
 * Retrieve all pending identity reconciliation matches for clinicians
 */
router.get(
  '/matches',
  requireAuth,
  requireRole('CLINICIAN', 'ADMIN'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const matches = await prisma.identityMatch.findMany({
        where: {
          status: IdentityMatchStatus.PENDING_REVIEW,
        },
        include: {
          referral: {
            include: {
              sourceFacility: true,
              destinationFacility: true,
            },
          },
          incomingPatient: true,
          candidatePatient: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: matches,
      });
    } catch (error: any) {
      console.error('[Identity Matches GET Error]', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve identity matches.', details: error.message },
      });
    }
  }
);

/**
 * GET /api/identity/evaluate/:referralId
 * Run on-demand multi-field scoring for a referral's incoming patient against database records
 */
router.get(
  '/evaluate/:referralId',
  requireAuth,
  requireRole('CLINICIAN', 'ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { referralId } = req.params;

      const referral = await prisma.referral.findUnique({
        where: { id: referralId },
        include: {
          patient: true,
          sourceFacility: true,
          destinationFacility: true,
        },
      });

      if (!referral || !referral.patient) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Referral or patient not found.' },
        });
        return;
      }

      // Find other patients in DB (excluding incoming patient itself)
      const existingPatients = await prisma.patient.findMany({
        where: {
          id: { not: referral.patientId },
        },
        take: 50,
      });

      const evaluations: Array<{
        candidatePatient: any;
        evaluation: ReturnType<typeof evaluateIdentityMatch>;
      }> = [];

      for (const candidate of existingPatients) {
        const evalResult = evaluateIdentityMatch(
          {
            name: referral.patient.name,
            age: referral.patient.age,
            gender: referral.patient.gender,
            phone: referral.patient.phone,
            village: referral.patient.village,
            address: referral.patient.address,
          },
          {
            name: candidate.name,
            age: candidate.age,
            gender: candidate.gender,
            phone: candidate.phone,
            village: candidate.village,
            address: candidate.address,
          },
          true,
          `${referral.sourceFacility?.name || 'PHC'} Inbound Referral`,
          `${referral.destinationFacility?.name || 'District Hospital'} Registry`
        );

        if (evalResult.compositeScore >= 0.5) {
          evaluations.push({
            candidatePatient: candidate,
            evaluation: evalResult,
          });
        }
      }

      // Sort by highest composite score
      evaluations.sort((a, b) => b.evaluation.compositeScore - a.evaluation.compositeScore);

      res.status(200).json({
        success: true,
        data: {
          incomingPatient: referral.patient,
          referral,
          topCandidates: evaluations,
        },
      });
    } catch (error: any) {
      console.error('[Identity Evaluate Error]', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to evaluate identity matches.', details: error.message },
      });
    }
  }
);

/**
 * POST /api/identity/confirm
 * Explicit clinician confirmation of identity match.
 * Hard Rule 2: NEVER MERGE SILENTLY. Requires clinician user confirmation.
 * Hard Rule 4: Append-only AuditEvent logged.
 */
router.post(
  '/confirm',
  requireAuth,
  requireRole('CLINICIAN', 'ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { matchId, referralId, canonicalPatientId, notes } = req.body;

      if (!referralId || !canonicalPatientId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing referralId or canonicalPatientId.' },
        });
        return;
      }

      const result = await prisma.$transaction(
        async (tx) => {
          const currentReferral = await tx.referral.findUnique({
            where: { id: referralId },
            select: { patientId: true },
          });
          const incomingPatientId = currentReferral?.patientId;

          // 1. Update match record if matchId provided
          let matchRecord = null;
          if (matchId) {
            matchRecord = await tx.identityMatch.update({
              where: { id: matchId },
              data: {
                status: IdentityMatchStatus.CONFIRMED,
                reviewedById: req.user!.id,
                reviewedAt: new Date(),
              },
            });
          }

          // 2. Update referral record: status -> IDENTITY_CONFIRMED & link to canonical patient
          const updatedReferral = await tx.referral.update({
            where: { id: referralId },
            data: {
              status: ReferralStatus.IDENTITY_CONFIRMED,
              patientId: canonicalPatientId,
            },
            include: {
              patient: true,
              sourceFacility: true,
            },
          });

          // 3. Clean up transient incoming patient if distinct and unreferenced elsewhere
          if (incomingPatientId && incomingPatientId !== canonicalPatientId) {
            const otherReferrals = await tx.referral.count({
              where: { patientId: incomingPatientId },
            });
            const otherDocs = await tx.clinicalDocument.count({
              where: { patientId: incomingPatientId },
            });
            const otherFollowUps = await tx.followUp.count({
              where: { patientId: incomingPatientId },
            });

            if (otherReferrals === 0 && otherDocs === 0 && otherFollowUps === 0) {
              await tx.identityMatch.deleteMany({
                where: {
                  OR: [
                    { incomingPatientId },
                    { candidatePatientId: incomingPatientId },
                  ],
                },
              });
              await tx.patient.delete({
                where: { id: incomingPatientId },
              });
            }
          }

          // 4. Log AuditEvent (Hard Clinical Safety Rule 4: Auditability)
          await tx.auditEvent.create({
            data: {
              eventId: `EVT-${randomUUID()}`,
              actorId: req.user!.id,
              actorRole: req.user!.role,
              facilityId: req.user!.facilityId,
              eventType: 'IDENTITY_CONFIRMED',
              entityType: 'PATIENT',
              entityId: canonicalPatientId,
              metadata: {
                referralId,
                referralNumber: updatedReferral.referralNumber,
                matchId,
                clinicianName: req.user!.name,
                confirmedPatientName: updatedReferral.patient.name,
                notes: notes || 'Clinician confirmed patient identity match.',
              },
            },
          });

          return updatedReferral;
        },
        {
          maxWait: 15000,
          timeout: 30000,
        }
      );

      res.status(200).json({
        success: true,
        message: 'Patient identity match confirmed successfully. Referral linked to master medical record.',
        data: result,
      });
    } catch (error: any) {
      console.error('[Identity Confirm Error]', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to confirm identity match.', details: error.message },
      });
    }
  }
);

/**
 * POST /api/identity/reject
 * Clinician determines incoming patient is a new distinct person.
 */
router.post(
  '/reject',
  requireAuth,
  requireRole('CLINICIAN', 'ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { matchId, referralId, notes } = req.body;

      if (!referralId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing referralId.' },
        });
        return;
      }

      await prisma.$transaction(
        async (tx) => {
          if (matchId) {
            await tx.identityMatch.update({
              where: { id: matchId },
              data: {
                status: IdentityMatchStatus.REJECTED,
                reviewedById: req.user!.id,
                reviewedAt: new Date(),
              },
            });
          }

          // Referral status updated to RECEIVED (registered as new patient)
          await tx.referral.update({
            where: { id: referralId },
            data: { status: ReferralStatus.RECEIVED },
          });

          // Log AuditEvent
          await tx.auditEvent.create({
            data: {
              eventId: `EVT-${randomUUID()}`,
              actorId: req.user!.id,
              actorRole: req.user!.role,
              facilityId: req.user!.facilityId,
              eventType: 'IDENTITY_REJECTED_REGISTERED_NEW',
              entityType: 'REFERRAL',
              entityId: referralId,
              metadata: {
                matchId,
                clinicianName: req.user!.name,
                notes: notes || 'Clinician rejected candidate match; patient registered as distinct new record.',
              },
            },
          });
        },
        {
          maxWait: 15000,
          timeout: 30000,
        }
      );

      res.status(200).json({
        success: true,
        message: 'Candidate match rejected. Patient preserved as distinct new registration.',
      });
    } catch (error: any) {
      console.error('[Identity Reject Error]', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to reject identity match.', details: error.message },
      });
    }
  }
);

export default router;
