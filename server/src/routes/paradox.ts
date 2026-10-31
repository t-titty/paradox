import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { duelsOpen, lateVowsOpen, parseYmd } from "../phases.js";
import { resolvePhaseForUser } from "../lib/testMode.js";
import { findThrowbackVote } from "../lib/throwback.js";
import { ensureParadoxForDate } from "../lib/schedule.js";
import { computeStreakForUser } from "../lib/streaks.js";
import { paradoxNumber } from "../lib/results.js";

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
    const phase = await resolvePhaseForUser(userId, phaseOverride);

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
    // Never leave a day empty — fills from the unscheduled pool or re-airs.
    await ensureParadoxForDate(phase.today);
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

    const [vote, lateVowGrant, globalLateVow, streak, number, me] = await Promise.all([
      prisma.vote.findUnique({
        where: { userId_paradoxId: { userId, paradoxId: paradox.id } },
        select: {
          choice: true,
          justification: true,
          tribeAssigned: true,
          createdAt: true,
          isLate: true,
        },
      }),
      prisma.lateVowGrant.findUnique({
        where: { userId_paradoxId: { userId, paradoxId: paradox.id } },
        select: { id: true, createdAt: true, usedAt: true },
      }),
      prisma.globalLateVowGrant.findFirst({
        where: { paradoxId: paradox.id, isActive: true },
        select: { id: true, createdAt: true },
      }),
      computeStreakForUser(userId, phase.today),
      paradoxNumber(paradox.airDate),
      prisma.user.findUnique({ where: { id: userId }, select: { onboardedAt: true } }),
    ]);

    // Surface only unused grants to the client — once burned the banner
    // has nothing useful to say and shouldn't nudge the user again.
    const unusedGrant =
      lateVowGrant && !lateVowGrant.usedAt
        ? { id: lateVowGrant.id, createdAt: lateVowGrant.createdAt }
        : null;

    res.json({
      mode: "daily",
      paradox,
      phase,
      hasVoted: vote !== null,
      vote: vote ?? null,
      lateVowGrant: unusedGrant,
      globalLateVowActive: globalLateVow !== null,
      // Self-serve late vows: missed the window? You can still vote today.
      lateVowOpen: vote === null && lateVowsOpen(phase),
      duelsOpen: duelsOpen(phase),
      paradoxNumber: number,
      streak,
      needsOnboarding: !me?.onboardedAt,
    });
  } catch (e) {
    next(e);
  }
});
