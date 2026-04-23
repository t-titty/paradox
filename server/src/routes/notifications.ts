import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/error.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { env } from "../env.js";
import { pushConfigured } from "../lib/push.js";

export const notificationsRouter = Router();

/**
 * The client sends the browser's PushSubscription object verbatim. We
 * flatten `keys.p256dh` and `keys.auth` into their own columns so queries
 * don't need to reach into JSON.
 */
const subscribeSchema = z.object({
  endpoint: z.string().url().max(1024),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});

/**
 * POST /api/notifications/subscribe
 * Upsert a PushSubscription for the current user keyed on endpoint
 * (unique). If the same endpoint was previously tied to a different user
 * — rare, but possible when a shared-device session switches — we
 * re-assign it to the current user.
 */
notificationsRouter.post("/subscribe", requireAuth, async (req, res, next) => {
  try {
    if (!pushConfigured()) {
      throw new HttpError(
        503,
        "Push notifications are not configured on this server.",
        "push_unconfigured",
      );
    }
    const { userId } = req as AuthedRequest;
    const body = subscribeSchema.parse(req.body);

    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      create: {
        userId,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
      update: {
        userId,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
      select: { id: true, endpoint: true, createdAt: true },
    });
    res.status(201).json({ subscription: sub });
  } catch (e) {
    next(e);
  }
});

const unsubscribeSchema = z.object({
  // The client sends the endpoint so we can delete the exact row without
  // needing to track subscription ids on the browser side.
  endpoint: z.string().url().max(1024),
});

/**
 * DELETE /api/notifications/unsubscribe
 * Remove a PushSubscription by endpoint. Only the owning user may delete
 * their subscription; endpoints that don't belong to the caller 404 so
 * the route doesn't leak which endpoints exist.
 */
notificationsRouter.delete("/unsubscribe", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const { endpoint } = unsubscribeSchema.parse(req.body);

    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint },
      select: { id: true, userId: true },
    });
    if (!existing || existing.userId !== userId) {
      throw new HttpError(404, "Subscription not found", "not_found");
    }
    await prisma.pushSubscription.delete({ where: { id: existing.id } });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/notifications/public-key
 * Returns the VAPID public key so the client can subscribe the browser's
 * PushManager. Clients also have the key via VITE_VAPID_PUBLIC_KEY at
 * build time; this endpoint is the runtime fallback and lets the UI
 * detect whether push is configured on this deploy without a rebuild.
 */
notificationsRouter.get("/public-key", (_req, res) => {
  res.json({
    publicKey: env.VAPID_PUBLIC_KEY ?? null,
    configured: pushConfigured(),
  });
});
