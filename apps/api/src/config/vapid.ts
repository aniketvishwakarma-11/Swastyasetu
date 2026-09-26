import webpush from 'web-push';

export const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BGyhjG344bBIH6jSWTRg1eRWW52pu4ioFvfp4-2AzdJj2UJEhmFAt9-FrziWXgjvDaHUWxVmB-ehXtZ6cetTaJU';

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'drBw7RhGMnGB7JE_A4v0kx09ZQK2QQsN_bAW5czsC8o';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:alerts@swastyasetu.gov.in';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[WebPush] VAPID configuration initialized successfully.');
} catch (err) {
  console.warn('[WebPush] Warning initializing VAPID details:', err);
}

export { webpush };
