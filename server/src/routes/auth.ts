import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/error.js";
import { requireAuth, signToken, type AuthedRequest } from "../middleware/auth.js";
import { containsProfanity } from "../lib/profanity.js";
import { userHasCircleAccess, userOwnsOrAdminsCircle } from "../lib/circleAccess.js";
import { env } from "../env.js";
import { sendEmail } from "../lib/email.js";
import { systemTestModeEnabled } from "../lib/testMode.js";

export const authRouter = Router();

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscore only"),
  email: z.string().email().max(200),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  // Accept either username or email.
  identifier: z.string().min(1).max(200),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional().default(false),
  // Second factor — only required when the user has 2FA enabled. We verify
  // the password first, then either issue a token or ask for this code.
  totpCode: z
    .string()
    .regex(/^\d{6}$/, "Code must be 6 digits")
    .optional(),
});

const totpCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

// Shape returned in every auth-issuing response. Note: the User.testMode
// column is no longer selected — the outgoing `testMode` flag on the DTO
// is computed from (isAdmin AND SystemSetting.TEST_MODE="true"), not from
// the legacy per-user column.
const userSelect = {
  id: true,
  username: true,
  email: true,
  wisdomPoints: true,
  civilityScore: true,
  isPremium: true,
  isAdmin: true,
  twoFactorEnabled: true,
} as const;

type MeUser = {
  id: string;
  username: string;
  email: string;
  wisdomPoints: number;
  civilityScore: number;
  isPremium: boolean;
  isAdmin: boolean;
  twoFactorEnabled: boolean;
};

// Wrap the DB row with derived circle flags + effective test mode so the
// client can render the paywall CTA, gate the MANAGE nav, and show the
// test-mode banner without a second request. `testMode` is true iff the
// user is an admin AND the SystemSetting.TEST_MODE toggle is "true" —
// regular users never see test-mode UI regardless of the global setting.
async function withAccessFlags<T extends MeUser>(user: T) {
  const [hasCircleAccess, ownsOrAdminsCircle, systemTestMode] = await Promise.all([
    userHasCircleAccess(user.id),
    userOwnsOrAdminsCircle(user.id),
    systemTestModeEnabled(),
  ]);
  return {
    ...user,
    hasCircleAccess,
    ownsOrAdminsCircle,
    testMode: user.isAdmin && systemTestMode,
  };
}

function verifyTotp(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    // Allow ±1 30-second window to tolerate clock drift between the
    // authenticator app and the server.
    window: 1,
  });
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = registerSchema.parse(req.body);

    if (containsProfanity(username)) {
      throw new HttpError(
        400,
        "Username contains prohibited language. Please choose a different username.",
        "prohibited_username",
      );
    }

    const clash = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { id: true, username: true, email: true },
    });
    if (clash) {
      throw new HttpError(
        409,
        clash.username === username ? "Username taken" : "Email already registered",
        "conflict",
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, email, hashedPassword },
      select: userSelect,
    });

    res.status(201).json({ user: await withAccessFlags(user), token: signToken(user.id) });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { identifier, password, rememberMe, totpCode } = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier.toLowerCase() }] },
    });
    if (!user) throw new HttpError(401, "Invalid credentials", "unauthenticated");

    const ok = await bcrypt.compare(password, user.hashedPassword);
    if (!ok) throw new HttpError(401, "Invalid credentials", "unauthenticated");
    if (user.isBanned) throw new HttpError(403, "Account suspended", "banned");

    // Password correct. If 2FA is on, require the code before issuing a token.
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        // Tell the client to prompt for the 6-digit code and retry.
        return res.json({ twoFactorRequired: true });
      }
      if (!user.twoFactorSecret || !verifyTotp(user.twoFactorSecret, totpCode)) {
        throw new HttpError(401, "Invalid authenticator code", "invalid_totp");
      }
    }

    res.json({
      user: await withAccessFlags({
        id: user.id,
        username: user.username,
        email: user.email,
        wisdomPoints: user.wisdomPoints,
        civilityScore: user.civilityScore,
        isPremium: user.isPremium,
        isAdmin: user.isAdmin,
        twoFactorEnabled: user.twoFactorEnabled,
      }),
      token: signToken(user.id, rememberMe),
    });
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
    if (!user) throw new HttpError(404, "User not found", "not_found");
    res.json({ user: await withAccessFlags(user) });
  } catch (e) {
    next(e);
  }
});

/**
 * Generate a pending TOTP secret and return a QR code the user can scan. The
 * secret is persisted immediately so /2fa/enable can verify against it, but
 * twoFactorEnabled stays false until the user completes verification. A new
 * call overwrites any prior pending secret.
 */
authRouter.post("/2fa/setup", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, twoFactorEnabled: true },
    });
    if (!user) throw new HttpError(404, "User not found", "not_found");
    if (user.twoFactorEnabled) {
      throw new HttpError(400, "2FA already enabled", "already_enabled");
    }

    const secret = speakeasy.generateSecret({
      name: `PARADOX (${user.username})`,
      issuer: "PARADOX",
      length: 20,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    const otpauthUrl = secret.otpauth_url ?? "";
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    res.json({
      otpauthUrl,
      qrDataUrl,
      // Manual-entry fallback for users who can't scan the QR code.
      secret: secret.base32,
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/2fa/enable", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const { code } = totpCodeSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user) throw new HttpError(404, "User not found", "not_found");
    if (user.twoFactorEnabled) {
      throw new HttpError(400, "2FA already enabled", "already_enabled");
    }
    if (!user.twoFactorSecret) {
      throw new HttpError(400, "Run /2fa/setup first", "no_pending_secret");
    }
    if (!verifyTotp(user.twoFactorSecret, code)) {
      throw new HttpError(401, "Invalid authenticator code", "invalid_totp");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    res.json({ twoFactorEnabled: true });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/2fa/disable", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const { code } = totpCodeSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user) throw new HttpError(404, "User not found", "not_found");
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new HttpError(400, "2FA not enabled", "not_enabled");
    }
    if (!verifyTotp(user.twoFactorSecret, code)) {
      throw new HttpError(401, "Invalid authenticator code", "invalid_totp");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    res.json({ twoFactorEnabled: false });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────────────────
// Password reset
// ──────────────────────────────────────────────────────────────────────

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const forgotPasswordSchema = z.object({
  email: z.string().email().max(200),
});

const resetPasswordSchema = z.object({
  // 32 bytes hex = 64 chars; use a generous upper bound.
  token: z.string().min(20).max(200),
  newPassword: z.string().min(8).max(128),
});

/**
 * POST /api/auth/forgot-password
 *
 * Always responds 200 with the same message whether the email exists or
 * not — the response MUST NOT reveal which addresses are registered. If
 * the email does match a user, we generate a 32-byte random token, persist
 * it with a 1-hour expiry, and mail a reset link. If email delivery isn't
 * configured (no RESEND_API_KEY in dev), we still persist the token and log
 * the reset URL so local testing works.
 */
authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    // Normalize so "User@Example.com" matches a lower-cased stored email.
    const normalized = email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, email: true, username: true },
    });

    // If the user exists, mint a token and send the email. We swallow any
    // email-send failure here so a mis-configured RESEND_API_KEY can't be
    // used to probe which addresses are registered — the outward behavior
    // is identical to the no-user case.
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      const resetUrl = `${env.PUBLIC_APP_URL}/reset-password?token=${token}`;
      const subject = "Reset your PARADOX password";
      const text = [
        "Someone requested a password reset for your PARADOX account.",
        "",
        "Click the link below to reset your password.",
        "This link expires in 1 hour.",
        "",
        resetUrl,
        "",
        "If you didn't request this, ignore this email.",
      ].join("\n");

      const result = await sendEmail({ to: user.email, subject, text });
      if (!result.sent) {
        // Log so an operator can see the reset URL in dev or diagnose a
        // Resend outage in prod. Never surfaced in the response.
        console.warn(
          `[auth] reset email not sent (${result.reason}): ${resetUrl}`,
          result.reason === "send_failed" ? result.error : "",
        );
      }
    }

    res.json({
      message:
        "If that email exists you'll receive a reset link shortly.",
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/reset-password
 *
 * Consumes a token minted by /forgot-password. Validates it exists, hasn't
 * expired, and hasn't been used; then hashes the new password and flips the
 * token's `usedAt` in the same transaction so the window is atomic.
 */
authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    const row = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });
    const now = new Date();
    if (!row || row.usedAt || row.expiresAt <= now) {
      throw new HttpError(
        400,
        "This reset link is invalid or has expired. Request a new one.",
        "invalid_reset_token",
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: now },
      }),
      // Invalidate any other outstanding tokens for this user so a stolen
      // link can't be reused after the legitimate reset.
      prisma.passwordResetToken.updateMany({
        where: { userId: row.userId, usedAt: null, id: { not: row.id } },
        data: { usedAt: now },
      }),
    ]);

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
