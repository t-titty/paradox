import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/error.js";
import { requireAuth, signToken, type AuthedRequest } from "../middleware/auth.js";
import { containsProfanity } from "../lib/profanity.js";
import { userHasCircleAccess } from "../lib/circleAccess.js";
import { audit } from "../lib/audit.js";
import { check as checkLockout, recordFailure, recordSuccess } from "../lib/loginLockout.js";
import { blacklistToken } from "../lib/tokenBlacklist.js";

export const authRouter = Router();

// Password policy: ≥8 chars, at least one uppercase, one digit, one non-
// alphanumeric. Enforced server-side so a tampered client can't bypass.
// Existing accounts with weaker passwords still work — this only gates new
// registrations (and, later, password-change flows).
const STRONG_PASSWORD = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .refine((p) => /[A-Z]/.test(p), "Password must include an uppercase letter")
  .refine((p) => /\d/.test(p), "Password must include a number")
  .refine(
    (p) => /[^A-Za-z0-9]/.test(p),
    "Password must include a special character",
  );

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscore only"),
  email: z.string().email().max(200),
  password: STRONG_PASSWORD,
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

// Shape returned in every auth-issuing response.
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

// Wrap the DB row with the derived hasCircleAccess flag so the client can
// render the paywall CTA without a second request.
async function withAccessFlags<T extends MeUser>(user: T) {
  return { ...user, hasCircleAccess: await userHasCircleAccess(user.id) };
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

    await audit({ userId: user.id, action: "auth.register", req, metadata: { username } });
    res.status(201).json({ user: await withAccessFlags(user), token: signToken(user.id) });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { identifier, password, rememberMe, totpCode } = loginSchema.parse(req.body);

    // Lockout check runs before any DB/bcrypt work so repeated attempts are
    // cheap to reject. Keyed on the normalized identifier — the same user
    // from different IPs rolls up into one bucket, and vice versa.
    const lock = checkLockout(identifier);
    if (lock.locked) {
      res.setHeader("Retry-After", String(lock.retryAfterSeconds));
      throw new HttpError(
        429,
        `Too many failed attempts. Try again in ${Math.ceil(lock.retryAfterSeconds / 60)} minute(s).`,
        "account_locked",
      );
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier.toLowerCase() }] },
    });
    if (!user) {
      recordFailure(identifier);
      await audit({
        userId: null,
        action: "auth.login.failed",
        req,
        metadata: { identifier, reason: "unknown_user" },
      });
      throw new HttpError(401, "Invalid credentials", "unauthenticated");
    }

    const ok = await bcrypt.compare(password, user.hashedPassword);
    if (!ok) {
      recordFailure(identifier);
      await audit({
        userId: user.id,
        action: "auth.login.failed",
        req,
        metadata: { identifier, reason: "bad_password" },
      });
      throw new HttpError(401, "Invalid credentials", "unauthenticated");
    }
    if (user.isBanned) {
      await audit({
        userId: user.id,
        action: "auth.login.failed",
        req,
        metadata: { identifier, reason: "banned" },
      });
      throw new HttpError(403, "Account suspended", "banned");
    }

    // Password correct. If 2FA is on, require the code before issuing a token.
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        // Tell the client to prompt for the 6-digit code and retry.
        return res.json({ twoFactorRequired: true });
      }
      if (!user.twoFactorSecret || !verifyTotp(user.twoFactorSecret, totpCode)) {
        recordFailure(identifier);
        await audit({
          userId: user.id,
          action: "auth.login.failed",
          req,
          metadata: { identifier, reason: "bad_totp" },
        });
        throw new HttpError(401, "Invalid authenticator code", "invalid_totp");
      }
    }

    recordSuccess(identifier);
    await audit({
      userId: user.id,
      action: "auth.login.succeeded",
      req,
      metadata: { rememberMe },
    });

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
 * POST /api/auth/logout
 * Blacklists the caller's bearer token until its JWT exp runs out, so a
 * copy leaked between logout and exp can't still authenticate. No-op if
 * the token lacks an `exp` claim (shouldn't happen — every token we sign
 * has one via JWT_EXPIRES_IN).
 */
authRouter.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const { userId, authToken, authTokenExp } = req as AuthedRequest;
    if (authToken && authTokenExp) {
      blacklistToken(authToken, authTokenExp);
    }
    await audit({ userId, action: "auth.logout", req });
    res.status(204).end();
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
    await audit({ userId, action: "auth.2fa.enabled", req });

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
    await audit({ userId, action: "auth.2fa.disabled", req });

    res.json({ twoFactorEnabled: false });
  } catch (e) {
    next(e);
  }
});
