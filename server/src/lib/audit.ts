import type { Request } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

/**
 * Append-only audit log. Never throws — audit failures must not break the
 * request they're logging. Call from any handler where the action is
 * security-relevant (auth events, admin writes).
 *
 * Conventions for the `action` string: dot-delimited, stable, e.g.
 *   auth.login.succeeded, auth.login.failed, auth.logout,
 *   auth.register, auth.2fa.enabled, auth.2fa.disabled,
 *   admin.user.ban, admin.user.unban, admin.user.reset_civility,
 *   admin.user.grant_circle_access, admin.paradox.create,
 *   admin.submission.approve, admin.submission.reject
 */
export async function audit(params: {
  userId: string | null;
  action: string;
  metadata?: Prisma.InputJsonValue;
  req?: Request;
}): Promise<void> {
  const { userId, action, metadata, req } = params;
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        metadata: metadata ?? {},
        ipAddress: req ? clientIp(req) : null,
      },
    });
  } catch (err) {
    // Audit logging must never block the request. Surface to stderr so we
    // still see writes that would have been recorded if the DB was healthy.
    console.error("[audit] failed to write", action, err);
  }
}

/**
 * Best-effort client IP. Honors X-Forwarded-For when Express is configured
 * with `app.set('trust proxy', 1)` — in prod behind Railway's edge we trust
 * the first proxy hop.
 */
export function clientIp(req: Request): string | null {
  return (req.ip ?? req.socket.remoteAddress ?? null) as string | null;
}
