import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const circlesRouter = Router();

const applicationSchema = z.object({
  organization: z.string().min(2).max(120),
  kind: z.enum(["university", "company", "other"]),
  contactEmail: z.string().email(),
  note: z.string().max(1000).optional(),
});

/**
 * POST /api/circles/apply
 * Stores a Private Circles application. Real follow-up happens out-of-band.
 */
circlesRouter.post("/apply", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const body = applicationSchema.parse(req.body);
    const row = await prisma.circleApplication.create({
      data: {
        organization: body.organization,
        kind: body.kind,
        contactEmail: body.contactEmail,
        note: body.note,
        submittedByUserId: userId,
      },
      select: { id: true, createdAt: true },
    });
    res.status(201).json({ application: row });
  } catch (e) {
    next(e);
  }
});
