import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { requireAuth } from '../../middleware/auth.middleware';
import { SyncStatus, ReferralUrgency, ReferralStatus, FacilityType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { resolveFacilityId } from '../referrals/referrals.routes';

const router = Router();

interface ClientSyncEvent {
  eventId: string;
  entityType: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
}

/**
 * POST /api/sync/events
 * Batch idempotent sync handler for offline queue.
 * Idempotency guaranteed via eventId.
 */
router.post('/events', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const rawEvents: ClientSyncEvent[] = Array.isArray(req.body)
      ? req.body
      : req.body.events || (req.body.eventId ? [req.body] : []);

    if (rawEvents.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'EMPTY_PAYLOAD', message: 'No sync events provided.' },
      });
      return;
    }

    const results: Array<{ eventId: string; status: SyncStatus; duplicate: boolean; error?: string; entityId?: string }> = [];

    for (const evt of rawEvents) {
      if (!evt.eventId) {
        results.push({
          eventId: 'UNKNOWN',
          status: SyncStatus.FAILED,
          duplicate: false,
          error: 'Missing eventId in sync event.',
        });
        continue;
      }

      // Check if this event has already been processed (Idempotency check)
      const existingEvent = await prisma.syncEvent.findUnique({
        where: { eventId: evt.eventId },
      });

      if (existingEvent && existingEvent.status === SyncStatus.SYNCED) {
        results.push({
          eventId: evt.eventId,
          status: SyncStatus.SYNCED,
          duplicate: true,
          entityId: existingEvent.entityId,
        });
        continue;
      }

      try {
        await prisma.$transaction(
          async (tx) => {
            let targetEntityId = evt.entityId;

            if (evt.entityType === 'REFERRAL' && evt.operation === 'CREATE') {
              const { patient, destinationFacilityId: rawDestinationFacilityId, urgency, reason, clinicalSummary, sourceFacilityId: providedSourceFacilityId } = evt.payload;
              const sourceFacilityId = await resolveFacilityId(providedSourceFacilityId || req.user?.facilityId, FacilityType.PHC);
              const destinationFacilityId = await resolveFacilityId(rawDestinationFacilityId, FacilityType.DISTRICT_HOSPITAL);

              // 1. Resolve or Create Patient
              let patientRecord = await tx.patient.create({
                data: {
                  localId: patient.localId || `LOC-${randomUUID().slice(0, 8)}`,
                  name: patient.name?.trim() || 'Unknown',
                  age: Number(patient.age) || 0,
                  gender: patient.gender || 'Other',
                  phone: patient.phone?.trim() || null,
                  village: patient.village?.trim() || 'Unknown',
                  address: patient.address?.trim() || null,
                },
              });

              // 2. Generate referral number
              const referralNumber = `RF-${Math.floor(100000 + Math.random() * 900000)}`;

              // 3. Create Referral
              const newReferral = await tx.referral.create({
                data: {
                  referralNumber,
                  patientId: patientRecord.id,
                  sourceFacilityId,
                  destinationFacilityId,
                  urgency: (urgency as ReferralUrgency) || ReferralUrgency.ROUTINE,
                  reason: reason || 'Offline Referral',
                  clinicalSummary: clinicalSummary || '',
                  status: ReferralStatus.SENT,
                  createdById: req.user?.id,
                },
              });

              targetEntityId = newReferral.id;

              // 4. Log AuditEvent
              await tx.auditEvent.create({
                data: {
                  eventId: `AUD-${evt.eventId}`,
                  actorId: req.user!.id,
                  actorRole: req.user!.role,
                  facilityId: sourceFacilityId,
                  eventType: 'REFERRAL_SYNCED_FROM_OFFLINE',
                  entityType: 'REFERRAL',
                  entityId: newReferral.id,
                  metadata: {
                    referralNumber,
                    urgency: newReferral.urgency,
                    clientEventId: evt.eventId,
                  },
                },
              });
            }

            // Record or update the SyncEvent row
            await tx.syncEvent.upsert({
              where: { eventId: evt.eventId },
              create: {
                eventId: evt.eventId,
                entityType: evt.entityType,
                entityId: targetEntityId,
                operation: evt.operation,
                payload: evt.payload,
                status: SyncStatus.SYNCED,
                syncedAt: new Date(),
              },
              update: {
                status: SyncStatus.SYNCED,
                syncedAt: new Date(),
                entityId: targetEntityId,
              },
            });

            results.push({
              eventId: evt.eventId,
              status: SyncStatus.SYNCED,
              duplicate: false,
              entityId: targetEntityId,
            });
          },
          {
            maxWait: 15000,
            timeout: 30000,
          }
        );
      } catch (err: any) {
        console.error(`[Sync Failed for event ${evt.eventId}]`, err);

        await prisma.syncEvent.upsert({
          where: { eventId: evt.eventId },
          create: {
            eventId: evt.eventId,
            entityType: evt.entityType,
            entityId: evt.entityId || 'UNKNOWN',
            operation: evt.operation,
            payload: evt.payload,
            status: SyncStatus.FAILED,
            lastError: err.message,
            retryCount: 1,
          },
          update: {
            status: SyncStatus.FAILED,
            lastError: err.message,
            retryCount: { increment: 1 },
          },
        });

        results.push({
          eventId: evt.eventId,
          status: SyncStatus.FAILED,
          duplicate: false,
          error: err.message,
        });
      }
    }

    const allSuccessful = results.every((r) => r.status === SyncStatus.SYNCED);

    res.status(allSuccessful ? 200 : 207).json({
      success: allSuccessful,
      processedCount: results.length,
      syncedCount: results.filter((r) => r.status === SyncStatus.SYNCED).length,
      failedCount: results.filter((r) => r.status === SyncStatus.FAILED).length,
      events: results,
    });
  } catch (error: any) {
    console.error('[Sync API Fatal Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'SYNC_ERROR', message: 'Failed to process sync events.', details: error.message },
    });
  }
});

/**
 * GET /api/sync/status
 * Check pending sync status
 */
router.get('/status', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const failedEvents = await prisma.syncEvent.count({
      where: { status: SyncStatus.FAILED },
    });
    const syncedEvents = await prisma.syncEvent.count({
      where: { status: SyncStatus.SYNCED },
    });

    res.status(200).json({
      success: true,
      data: {
        failedEvents,
        syncedEvents,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export default router;
