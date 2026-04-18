import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { validateJustification } from "../lib/sentence.js";
import { containsProfanity } from "../lib/profanity.js";
import { classifyShift } from "../lib/throwback.js";
import { resolvePhase } from "../phases.js";

export const throwbackRouter = Router();

const revoteSchema = z.object({
  originalVoteId: z.string().min(1),
  newChoice: z.enum(["A", "B"]),
  newJustification: z.string(),
});

/**
 * POST /api/throwback
 * Record a Thursday revisit. Original vote is left untouched; the revote
 * goes in its own table so both moments are preserved.
 */
throwbackRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const { originalVoteId, newChoice, newJustification } = revoteSchema.parse(req.body);

    const phase = resolvePhase();
    if (phase.phase !== "vow") {
      throw new HttpError(403, "Revisits are closed outside the Vow window.", "phase_locked");
    }

    const check = validateJustification(newJustification);
    if (!check.valid) {
      throw new HttpError(400, check.reason ?? "Invalid justification", "bad_justification");
    }
    if (containsProfanity(newJustification)) {
      throw new HttpError(
        400,
        "Your justification contains prohibited language. Rewrite it without slurs or profanity.",
        "prohibited_language",
      );
    }

    const original = await prisma.vote.findUnique({
      where: { id: originalVoteId },
      include: { throwbackRevote: true, paradox: { select: { id: true } } },
    });
    if (!original) throw new HttpError(404, "Original vote not found", "not_found");
    if (original.userId !== userId) {
      throw new HttpError(403, "Not your vote.", "forbidden");
    }
    if (original.throwbackRevote) {
      throw new HttpError(409, "You have already revisited this paradox.", "already_revisited");
    }

    const shift = classifyShift(
      original.choice,
      original.justification,
      newChoice,
      newJustification,
    );

    const revote = await prisma.throwbackRevote.create({
      data: {
        userId,
        originalVoteId,
        paradoxId: original.paradox.id,
        newChoice,
        newJustification: newJustification.trim(),
        shift,
      },
      select: {
        id: true,
        newChoice: true,
        newJustification: true,
        shift: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      revote,
      original: {
        choice: original.choice,
        justification: original.justification,
        createdAt: original.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
});
