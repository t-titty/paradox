import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const feedbackRouter = Router();

const feedbackSchema = z.object({
  category: z.enum(["bug", "feature", "general"]),
  message: z.string().min(3).max(2000),
});

/**
 * POST /api/feedback
 * Logged-in users can submit feedback. Admin reviews happen in /admin.
 */
feedbackRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const body = feedbackSchema.parse(req.body);
    const row = await prisma.feedback.create({
      data: {
        userId,
        category: body.category,
        message: body.message,
      },
      select: { id: true, createdAt: true },
    });
    res.status(201).json({ feedback: row });
  } catch (e) {
    next(e);
  }
});
