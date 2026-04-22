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
