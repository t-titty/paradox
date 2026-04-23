import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { validateJustification } from "../lib/sentence.js";
import { containsProfanity } from "../lib/profanity.js";
import { parseYmd, resolvePhase } from "../phases.js";
import { effectiveTestMode } from "../lib/testMode.js";

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
    const testMode = await effectiveTestMode(userId);

    // Check for an admin-issued late-vow exemption on this paradox. Pulled
    // up before the phase gate so the gate can consult it, and reused
    // below to stamp usedAt atomically with the vote. (Unique on
    // (userId, paradoxId), so there's at most one row.)
    const lateVowGrant = await prisma.lateVowGrant.findUnique({
      where: { userId_paradoxId: { userId, paradoxId } },
      select: { id: true, usedAt: true },
    });
    const hasUnusedGrant = Boolean(lateVowGrant && !lateVowGrant.usedAt);

    // Voting only during the vow window. Test mode and an unused
    // late-vow grant both bypass the phase gate.
    if (!testMode && !hasUnusedGrant && phase.phase !== "vow") {
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
    if (containsProfanity(justification)) {
      throw new HttpError(
        400,
        "Your justification contains prohibited language. Rewrite it without slurs or profanity.",
        "prohibited_language",
      );
    }

    const paradox = await prisma.paradox.findUnique({
      where: { id: paradoxId },
      select: { id: true, airDate: true },
    });
    if (!paradox) throw new HttpError(404, "Paradox not found", "not_found");
    if (
      !testMode &&
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

    // Create the vote and (if applicable) burn the late-vow grant in
    // one transaction so a grant can never be half-consumed.
    const vote = await prisma.$transaction(async (tx) => {
      const created = await tx.vote.create({
        data: {
          userId,
          paradoxId,
          choice,
          justification: justification.trim(),
        },
        select: { id: true, choice: true, justification: true, createdAt: true },
      });
      if (hasUnusedGrant && lateVowGrant) {
        await tx.lateVowGrant.update({
          where: { id: lateVowGrant.id },
          data: { usedAt: new Date() },
        });
      }
      return created;
    });

    res.status(201).json({ vote });
  } catch (e) {
    next(e);
  }
});
