import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { requireAuth } from '../../middleware/auth.middleware';
import { VAPID_PUBLIC_KEY, webpush } from '../../config/vapid';

const router = Router();

/**
 * GET /api/notifications/vapid-public-key
 * Returns the VAPID public key so client browsers can generate push subscriptions.
 */
router.get('/vapid-public-key', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      publicKey: VAPID_PUBLIC_KEY,
    },
  });
});

/**
 * POST /api/notifications/subscribe
 * Registers or updates a browser's Web Push subscription.
 */
router.post('/subscribe', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { endpoint, keys, userAgent, deviceType } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      res.status(400).json({
        success: false,
        error: 'Missing required push subscription fields (endpoint, keys.p256dh, keys.auth)',
      });
      return;
    }

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: user.id,
        facilityId: user.facilityId || null,
        endpoint,
        p256dhKey: keys.p256dh,
        authKey: keys.auth,
        userAgent: userAgent || null,
        deviceType: deviceType || 'unknown',
        isActive: true,
      },
      update: {
        userId: user.id,
        facilityId: user.facilityId || null,
        p256dhKey: keys.p256dh,
        authKey: keys.auth,
        userAgent: userAgent || null,
        deviceType: deviceType || 'unknown',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        id: subscription.id,
        isActive: subscription.isActive,
      },
    });
  } catch (error: any) {
    console.error('[NotificationsRouter] Subscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register push subscription',
    });
  }
});

/**
 * POST /api/notifications/unsubscribe
 * Revokes or deactivates a push subscription.
 */
router.post('/unsubscribe', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      res.status(400).json({
        success: false,
        error: 'Endpoint is required to unsubscribe',
      });
      return;
    }

    await prisma.pushSubscription.updateMany({
      where: { endpoint },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: 'Push subscription successfully deactivated',
    });
  } catch (error: any) {
    console.error('[NotificationsRouter] Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate push subscription',
    });
  }
});

/**
 * POST /api/notifications/test
 * Sends a test emergency push notification to the authenticated user's device.
 */
router.post('/test', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    if (subscriptions.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No active push subscriptions found for this account. Enable notifications first.',
      });
      return;
    }

    const testPayload = JSON.stringify({
      title: '🚨 TEST EMERGENCY ALERT',
      body: 'Testing SwasthyaSetu triage push notification on this device. Sound & vibration active.',
      urgency: 'EMERGENCY',
      referralId: 'test-emergency-id',
      referralNumber: 'REF-TEST-999',
      patientName: 'Simulated Patient (Cardiac)',
      sourceFacility: 'PHC Khed',
      timestamp: new Date().toISOString(),
      url: '/hospital?tab=incoming',
      actions: [
        { action: 'view', title: '📋 View Vitals' },
        { action: 'acknowledge', title: '✅ Acknowledge' },
      ],
    });

    let sent = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dhKey, auth: sub.authKey },
          },
          testPayload,
          { urgency: 'high', TTL: 300 }
        );
        sent++;
      } catch (err: any) {
        console.warn(`[NotificationsRouter] Test push failed for sub ${sub.id}:`, err?.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Test alert sent to ${sent} active device(s).`,
      sentCount: sent,
    });
  } catch (error: any) {
    console.error('[NotificationsRouter] Test push error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test push notification',
    });
  }
});

export default router;
