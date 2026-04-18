import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const submissionsRouter = Router();

const submitSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10).max(2000),
  optionA: z.string().min(1).max(500),
  optionB: z.string().min(1).max(500),
  category: z.string().min(2).max(80),
  reason: z.string().min(10).max(1000),
});

/**
 * POST /api/submissions
 * Any logged-in user can propose a paradox. Admins approve/reject in /admin;
 * approved submissions become scheduled paradoxes automatically.
 */
submissionsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const body = submitSchema.parse(req.body);
    const row = await prisma.submittedParadox.create({
      data: { ...body, userId },
      select: { id: true, status: true, createdAt: true },
    });
    res.status(201).json({ submission: row });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/submissions/mine
 * Lets a user see the status of their own submissions.
 */
submissionsRouter.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const submissions = await prisma.submittedParadox.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        createdAt: true,
        scheduledFor: true,
      },
    });
    res.json({ submissions });
  } catch (e) {
    next(e);
  }
});
