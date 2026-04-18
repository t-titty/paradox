import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/error.js";
import { requireAuth, signToken, type AuthedRequest } from "../middleware/auth.js";

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
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = registerSchema.parse(req.body);

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
      select: {
        id: true,
        username: true,
        email: true,
        wisdomPoints: true,
        civilityScore: true,
        isPremium: true,
        isAdmin: true,
      },
    });

    res.status(201).json({ user, token: signToken(user.id) });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { identifier, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier.toLowerCase() }] },
    });
    if (!user) throw new HttpError(401, "Invalid credentials", "unauthenticated");

    const ok = await bcrypt.compare(password, user.hashedPassword);
    if (!ok) throw new HttpError(401, "Invalid credentials", "unauthenticated");
    if (user.isBanned) throw new HttpError(403, "Account suspended", "banned");

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        wisdomPoints: user.wisdomPoints,
        civilityScore: user.civilityScore,
        isPremium: user.isPremium,
        isAdmin: user.isAdmin,
      },
      token: signToken(user.id),
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
      select: {
        id: true,
        username: true,
        email: true,
        wisdomPoints: true,
        civilityScore: true,
        isPremium: true,
        isAdmin: true,
      },
    });
    if (!user) throw new HttpError(404, "User not found", "not_found");
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
