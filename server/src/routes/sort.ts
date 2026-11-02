import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { parseYmd, resolvePhase } from "../phases.js";
import { effectiveTestMode } from "../lib/testMode.js";
import type { TribeName } from "../lib/oracle.js";
import { sortVote } from "../lib/sorting.js";
import { paradoxNumber, paradoxResults } from "../lib/results.js";
import { computeStreakForUser } from "../lib/streaks.js";

export const sortRouter = Router();

/**
 * GET /api/sort/me
 * Phase III — The Sort.
 *
 * Votes are normally sorted in bulk by the background job the moment the
 * Vow closes, so this is usually a read. If the caller's vote is still
 * unsorted (e.g. the batch hasn't reached it), sort it now.
 *
 * Returns the caller's tribe plus today's results — vote split, tribe
 * distribution and how each tribe split — for the results reveal and the
 * share card.
 */
sortRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const basePhase = resolvePhase();
    const testMode = await effectiveTestMode(userId);
    // Stamp the caller's effective testMode onto the phase so the client
    // banner / "SORT ME NOW" button render per-user, not by system env.
    const phase = { ...basePhase, testMode };

    const airDate = parseYmd(phase.today);
    const paradox = await prisma.paradox.findUnique({
      where: { airDate },
      select: { id: true, title: true, optionA: true, optionB: true, airDate: true },
    });
    if (!paradox) throw new HttpError(404, "No paradox for today", "no_paradox_today");

    const vote = await prisma.vote.findUnique({
      where: { userId_paradoxId: { userId, paradoxId: paradox.id } },
    });
    if (!vote) {
      throw new HttpError(403, "You did not vow today. No tribe to report.", "no_vote");
    }

    // Results stay hidden while the Vow is open so they can't sway anyone.
    // Late vowers have already voted, so they can see them straight away.
    if (!testMode && phase.phase === "vow") {
      throw new HttpError(425, "Sorting begins after the Vow closes.", "phase_early");
    }

    let tribe = vote.tribeAssigned as TribeName | null;
    let confidence = vote.tribeConfidence;
    let reasoning = vote.tribeReasoning;
    if (!tribe) {
      const result = await sortVote(vote.id);
      tribe = result.tribe;
      confidence = result.confidence;
      reasoning = result.reasoning;
    }

    const [consensus, number, streak] = await Promise.all([
      paradoxResults(paradox.id),
      paradoxNumber(paradox.airDate),
      computeStreakForUser(userId, phase.today),
    ]);

    const sideCount = consensus.choiceCounts[vote.choice];
    const sidePct = consensus.totalVotes > 0 ? Math.round((sideCount / consensus.totalVotes) * 100) : 100;

    res.json({
      paradox: { id: paradox.id, title: paradox.title, number, airDate: phase.today },
      yours: {
        choice: vote.choice,
        choiceText: vote.choice === "A" ? paradox.optionA : paradox.optionB,
        justification: vote.justification,
        tribe,
        confidence,
        reasoning,
        isLate: vote.isLate,
        sidePct,
      },
      consensus,
      streak,
      phase,
    });
  } catch (e) {
    next(e);
  }
});
