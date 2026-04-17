import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { validateJustification } from "../lib/sentence.js";
import { parseYmd, resolvePhase } from "../phases.js";

export const voteRouter = Router();

const voteSchema = z.object({
  paradoxId: z.string().min(1),
  choice: z.enum(["A", "B"]),
  justification: z.string(),
});

/**
 * POST /api/vote
 * Phase II — The Vow. Single-sentence justification. Locked after submit.
 */
voteRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const { paradoxId, choice, justification } = voteSchema.parse(req.body);

    const phase = resolvePhase();
    // Voting only during the vow window. Allow PHASE_OVERRIDE=vow for demos.
    // Test mode bypasses the phase gate entirely.
    if (!env.TEST_MODE && phase.phase !== "vow") {
      throw new HttpError(
        403,
        "Voting is closed. The Vow window has passed.",
        "phase_locked",
      );
    }

    const check = validateJustification(justification);
    if (!check.valid) {
      throw new HttpError(400, check.reason ?? "Invalid justification", "bad_justification");
    }

    const paradox = await prisma.paradox.findUnique({
      where: { id: paradoxId },
      select: { id: true, airDate: true },
    });
    if (!paradox) throw new HttpError(404, "Paradox not found", "not_found");
    if (
      !env.TEST_MODE &&
      (!paradox.airDate || paradox.airDate.getTime() !== parseYmd(phase.today).getTime())
    ) {
      throw new HttpError(400, "This paradox is not today's Drop", "wrong_paradox");
    }

    // Reject duplicate — spec: "Lock submission after first submit. No edits."
    const existing = await prisma.vote.findUnique({
      where: { userId_paradoxId: { userId, paradoxId } },
      select: { id: true },
    });
    if (existing) {
      throw new HttpError(409, "You have already vowed today.", "already_voted");
    }

    const vote = await prisma.vote.create({
      data: {
        userId,
        paradoxId,
        choice,
        justification: justification.trim(),
      },
      select: { id: true, choice: true, justification: true, createdAt: true },
    });

    res.status(201).json({ vote });
  } catch (e) {
    next(e);
  }
});
