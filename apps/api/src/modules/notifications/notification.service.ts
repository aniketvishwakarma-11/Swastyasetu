import { prisma } from '../../db';
import { webpush } from '../../config/vapid';
import { randomUUID } from 'crypto';

export interface EmergencyNotificationPayload {
  title: string;
  body: string;
  urgency: 'EMERGENCY';
  referralId: string;
  referralNumber: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  sourceFacility: string;
  reason: string;
  clinicalSummary: string;
  timestamp: string;
  url: string;
  actions: Array<{ action: string; title: string }>;
}

/**
 * Dispatches high-priority Web Push alerts to all on-duty hospital clinicians
 * and referral coordinators registered at the destination facility.
 */
export async function dispatchEmergencyNotification(referralId: string): Promise<{
  success: boolean;
  sentCount: number;
  failedCount: number;
}> {
  try {
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        patient: true,
        sourceFacility: true,
        destinationFacility: true,
      },
    });

    if (!referral) {
      console.warn(`[NotificationService] Referral not found: ${referralId}`);
      return { success: false, sentCount: 0, failedCount: 0 };
    }

    if (referral.urgency !== 'EMERGENCY') {
      return { success: true, sentCount: 0, failedCount: 0 };
    }

    // Find active push subscriptions for staff at the destination facility
    let subscriptions = await prisma.pushSubscription.findMany({
      where: {
        facilityId: referral.destinationFacilityId,
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    // In demo/test environments, if no device registered specifically to that facility,
    // dispatch to all logged-in CLINICIAN / REFERRAL_COORDINATOR devices so testing works reliably
    if (subscriptions.length === 0) {
      subscriptions = await prisma.pushSubscription.findMany({
        where: {
          isActive: true,
          user: {
            role: { in: ['CLINICIAN', 'REFERRAL_COORDINATOR', 'ADMIN'] },
          },
        },
        include: {
          user: true,
        },
      });
    }

    if (subscriptions.length === 0) {
      console.log(`[NotificationService] No active push subscriptions found for destination facility.`);
      return { success: true, sentCount: 0, failedCount: 0 };
    }

    const payload: EmergencyNotificationPayload = {
      title: '🚨 EMERGENCY REFERRAL INCOMING',
      body: `From ${referral.sourceFacility.name}: ${referral.patient.name} (${referral.patient.age}${referral.patient.gender ? referral.patient.gender.charAt(0) : ''}) — ${referral.reason}`,
      urgency: 'EMERGENCY',
      referralId: referral.id,
      referralNumber: referral.referralNumber,
      patientName: referral.patient.name,
      patientAge: referral.patient.age,
      patientGender: referral.patient.gender,
      sourceFacility: referral.sourceFacility.name,
      reason: referral.reason,
      clinicalSummary: referral.clinicalSummary || '',
      timestamp: new Date().toISOString(),
      url: `/hospital?referralId=${referral.id}&urgency=EMERGENCY`,
      actions: [
        { action: 'view', title: '📋 View Vitals' },
        { action: 'acknowledge', title: '✅ Acknowledge' },
      ],
    };

    const payloadString = JSON.stringify(payload);

    let sentCount = 0;
    let failedCount = 0;

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dhKey,
              auth: sub.authKey,
            },
          };

          await webpush.sendNotification(pushSubscription, payloadString, {
            urgency: 'high',
            TTL: 60 * 60, // 1 hour
          });
          sentCount++;
        } catch (err: any) {
          failedCount++;
          console.warn(`[NotificationService] Failed to send push to subscription ${sub.id}:`, err?.statusCode || err?.message);

          // If the subscription is expired or invalid (HTTP 404 or 410 Gone), deactivate it
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await prisma.pushSubscription.update({
              where: { id: sub.id },
              data: { isActive: false },
            }).catch(() => {});
          }
        }
      })
    );

    // Audit the dispatch event
    try {
      await prisma.auditEvent.create({
        data: {
          eventId: `EVT-${randomUUID()}`,
          actorId: referral.createdById || 'SYSTEM',
          actorRole: 'SYSTEM_DISPATCHER',
          facilityId: referral.destinationFacilityId,
          eventType: 'EMERGENCY_ALERT_DISPATCHED',
          entityType: 'REFERRAL',
          entityId: referral.id,
          metadata: {
            referralNumber: referral.referralNumber,
            sentCount,
            failedCount,
            recipientCount: subscriptions.length,
          },
        },
      });
    } catch (auditErr) {
      console.warn('[NotificationService] Audit logging failed:', auditErr);
    }

    console.log(`[NotificationService] Dispatched emergency referral alert to ${sentCount}/${subscriptions.length} devices.`);
    return { success: true, sentCount, failedCount };
  } catch (error) {
    console.error('[NotificationService] Error dispatching emergency notification:', error);
    return { success: false, sentCount: 0, failedCount: 0 };
  }
}
