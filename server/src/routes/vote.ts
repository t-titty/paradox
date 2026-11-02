import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { validateJustification } from "../lib/sentence.js";
import { containsProfanity } from "../lib/profanity.js";
import { lateVowsOpen, parseYmd, resolvePhase } from "../phases.js";
import { effectiveTestMode } from "../lib/testMode.js";
import { applyStreakFreezes, computeStreakForUser } from "../lib/streaks.js";
import { sortVote } from "../lib/sorting.js";

export const voteRouter = Router();

const voteSchema = z.object({
  paradoxId: z.string().min(1),
  choice: z.enum(["A", "B"]),
  justification: z.string(),
});

/**
 * POST /api/vote
 * Phase II — The Vow. Single-sentence justification. Locked after submit.
 *
 * Gate precedence (spec'd exactly in this order):
 *   1. Already voted today → reject, regardless of any grants.
 *   2. Current phase is vow → allow.
 *   3. Self-serve late vows (ALLOW_LATE_VOWS, sort/duel phases) → allow, flagged isLate.
 *   4. Active GlobalLateVowGrant for today's paradox → allow (does NOT burn).
 *   5. Individual unused LateVowGrant → allow and stamp `usedAt`.
 *   6. Otherwise → phase_locked.
 *
 * After the vote lands: spend streak freezes to bridge any missed days, and
 * sort late vows immediately (the batch sort has already run for on-time ones).
 */
voteRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const { paradoxId, choice, justification } = voteSchema.parse(req.body);

    const phase = resolvePhase();
    const testMode = await effectiveTestMode(userId);

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

    // 1. Duplicate-vote check is first — a grant (global or individual)
    //    never unlocks a second vote.
    const existing = await prisma.vote.findUnique({
      where: { userId_paradoxId: { userId, paradoxId } },
      select: { id: true },
    });
    if (existing) {
      throw new HttpError(
        409,
        "You have already cast your vow for today's paradox",
        "already_voted",
      );
    }

    // 2/3/4. Phase gate, with global-grant and individual-grant fall-throughs.
    //    Look up grants only when the phase is closed — saves a round-trip
    //    on the hot path during the vow window.
    let individualGrant: { id: string; usedAt: Date | null } | null = null;
    const isLate = phase.phase !== "vow";
    if (!testMode && phase.phase !== "vow" && !lateVowsOpen(phase)) {
      const globalActive = await prisma.globalLateVowGrant.findFirst({
        where: { paradoxId: paradox.id, isActive: true },
        select: { id: true },
      });
      if (!globalActive) {
        individualGrant = await prisma.lateVowGrant.findUnique({
          where: { userId_paradoxId: { userId, paradoxId } },
          select: { id: true, usedAt: true },
        });
        const hasUnused = Boolean(individualGrant && !individualGrant.usedAt);
        if (!hasUnused) {
          throw new HttpError(
            403,
            "Voting is closed. The Vow window has passed.",
            "phase_locked",
          );
        }
      }
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

    // Create the vote and, only if an individual grant was the thing that
    // unlocked this vote, burn it in the same transaction. Global grants
    // are NOT consumed — they stay active until the admin revokes.
    const willBurnIndividual = Boolean(individualGrant && !individualGrant.usedAt);

    const vote = await prisma.$transaction(async (tx) => {
      const created = await tx.vote.create({
        data: {
          userId,
          paradoxId,
          choice,
          justification: justification.trim(),
          isLate,
        },
        select: { id: true, choice: true, justification: true, createdAt: true },
      });
      if (willBurnIndividual && individualGrant) {
        await tx.lateVowGrant.update({
          where: { id: individualGrant.id },
          data: { usedAt: new Date() },
        });
      }
      return created;
    });

    // Streak bookkeeping never blocks the vote.
    let frozenDays: string[] = [];
    try {
      frozenDays = await applyStreakFreezes(userId, phase.today);
    } catch (e) {
      console.warn("[vote] streak freeze failed", e);
    }
    const streak = await computeStreakForUser(userId, phase.today).catch(() => null);

    if (isLate) {
      // Fire-and-forget; the Sort page will await the same in-flight call.
      sortVote(vote.id).catch((e) => console.warn("[vote] late sort failed", e));
    }

    res.status(201).json({ vote: { ...vote, isLate }, streak, frozenDays });
  } catch (e) {
    next(e);
  }
});
