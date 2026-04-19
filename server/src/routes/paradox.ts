import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { parseYmd, resolvePhaseWithOverride } from "../phases.js";
import { findThrowbackVote } from "../lib/throwback.js";

export const paradoxRouter = Router();

/**
 * GET /api/paradox/today
 *
 * On Thursdays, if the user has an eligible prior Thursday vote (≥28 days old,
 * not yet revisited), returns a `throwback` payload with the original paradox
 * and their original vote. Otherwise returns the regular daily paradox.
 */
paradoxRouter.get("/today", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const phaseOverride = typeof req.query.phase === "string" ? req.query.phase : null;
    const phase = resolvePhaseWithOverride(phaseOverride);

    // Throwback path — only surfaced during the vow window. After the vow
    // window closes, fall back to the normal daily flow for sort/duel/bridge.
    if (phase.phase === "vow") {
      const throwback = await findThrowbackVote(userId, phase.today);
      if (throwback) {
        res.json({
          mode: "throwback",
          phase,
          paradox: throwback.paradox,
          originalVote: {
            choice: throwback.choice,
            justification: throwback.justification,
            createdAt: throwback.createdAt,
          },
          originalVoteId: throwback.id,
          hasRevoted: false,
        });
        return;
      }
    }

    const airDate = parseYmd(phase.today);
    const paradox = await prisma.paradox.findUnique({
      where: { airDate },
      select: {
        id: true,
        title: true,
        description: true,
        optionA: true,
        optionB: true,
        category: true,
        airDate: true,
        submittedBy: { select: { username: true } },
      },
    });

    if (!paradox) {
      throw new HttpError(
        404,
        "No paradox scheduled for today. Run `npm run db:seed`.",
        "no_paradox_today",
      );
    }

    const vote = await prisma.vote.findUnique({
      where: { userId_paradoxId: { userId, paradoxId: paradox.id } },
      select: { choice: true, justification: true, tribeAssigned: true, createdAt: true },
    });

    res.json({
      mode: "daily",
      paradox,
      phase,
      hasVoted: vote !== null,
      vote: vote ?? null,
    });
  } catch (e) {
    next(e);
  }
});
