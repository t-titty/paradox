import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { validateJustification } from "../lib/sentence.js";
import { containsProfanity } from "../lib/profanity.js";
import { ensurePracticeParadox } from "../lib/schedule.js";
import { sortVote } from "../lib/sorting.js";

/**
 * First-run practice round. A new player can vow on a fixed tutorial
 * dilemma and get sorted by the Oracle immediately — any time of day — then
 * take a 4-minute practice spar against the AI (socket `matchmaking:practice`).
 * Nothing here touches WP, civility, streaks or the Constellation.
 */
export const practiceRouter = Router();

practiceRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const paradox = await ensurePracticeParadox();
    const vote = await prisma.vote.findUnique({
      where: { userId_paradoxId: { userId, paradoxId: paradox.id } },
      select: {
        choice: true,
        justification: true,
        tribeAssigned: true,
        tribeConfidence: true,
        tribeReasoning: true,
      },
    });
    res.json({ paradox, vote });
  } catch (e) {
    next(e);
  }
});

const voteSchema = z.object({ choice: z.enum(["A", "B"]), justification: z.string() });

practiceRouter.post("/vote", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const { choice, justification } = voteSchema.parse(req.body);
    const check = validateJustification(justification);
    if (!check.valid) throw new HttpError(400, check.reason ?? "Invalid justification", "bad_justification");
    if (containsProfanity(justification)) {
      throw new HttpError(400, "Rewrite it without slurs or profanity.", "prohibited_language");
    }

    const paradox = await ensurePracticeParadox();
    // Practice can be retried: replace any earlier practice vow.
    const vote = await prisma.vote.upsert({
      where: { userId_paradoxId: { userId, paradoxId: paradox.id } },
      create: { userId, paradoxId: paradox.id, choice, justification: justification.trim() },
      update: {
        choice,
        justification: justification.trim(),
        tribeAssigned: null,
        tribeConfidence: null,
        tribeReasoning: null,
        sortedAt: null,
      },
      select: { id: true },
    });
    const result = await sortVote(vote.id);
    res.status(201).json({ choice, ...result });
  } catch (e) {
    next(e);
  }
});

/** Finish (or skip) onboarding. */
practiceRouter.post("/complete", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    await prisma.user.update({ where: { id: userId }, data: { onboardedAt: new Date() } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
