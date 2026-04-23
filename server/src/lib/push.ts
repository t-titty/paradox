import webpush from "web-push";
import { env } from "../env.js";
import { prisma } from "../db.js";

// Configure web-push once at import time when VAPID is set. The getter
// pattern mirrors our Stripe/Resend wrappers: null when unconfigured so
// callers can 503 / no-op gracefully in dev without crashing.
let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  configured = true;
  return true;
}

export function pushConfigured(): boolean {
  return ensureConfigured();
}

export interface PushPayload {
  title: string;
  body: string;
  /** Optional click target — the SW uses this to open / focus a tab. */
  url?: string;
}

interface SendResult {
  sent: number;
  pruned: number;
  failed: number;
}

/**
 * Send a payload to every stored subscription (or a provided subset).
 * Prunes subscriptions the push service reports as gone (404/410). Other
 * errors are counted but left intact so a transient push-service blip
 * doesn't wipe the table.
 */
export async function sendPushToAll(payload: PushPayload): Promise<SendResult> {
  if (!ensureConfigured()) {
    return { sent: 0, pruned: 0, failed: 0 };
  }
  const subs = await prisma.pushSubscription.findMany({
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  return sendBatch(subs, payload);
}

/**
 * Send a payload to every stored subscription for a specific user.
 * Used for per-user notifications (e.g. duel-ready pings) — not used by
 * the global phase scheduler today but exposed for completeness.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<SendResult> {
  if (!ensureConfigured()) {
    return { sent: 0, pruned: 0, failed: 0 };
  }
  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  return sendBatch(subs, payload);
}

async function sendBatch(
  subs: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload,
): Promise<SendResult> {
  const body = JSON.stringify(payload);
  let sent = 0;
  let pruned = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent += 1;
      } catch (err) {
        const e = err as { statusCode?: number };
        if (e.statusCode === 404 || e.statusCode === 410) {
          // Subscription is gone — browser unsubscribed or the push
          // service forgot about it. Remove so we don't keep trying.
          await prisma.pushSubscription
            .delete({ where: { id: s.id } })
            .catch(() => {});
          pruned += 1;
        } else {
          failed += 1;
        }
      }
    }),
  );

  return { sent, pruned, failed };
}
