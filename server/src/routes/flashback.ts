import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { env } from "../env.js";

export const flashbackRouter = Router();

/**
 * GET /api/flashback
 *
 * Spec: "If user has an entry from 6+ months ago, randomly surface it."
 * Returns one eligible past vote at random, or null if the user has none
 * that are old enough (typical for new accounts).
 *
 * The cutoff is controlled by FLASHBACK_MIN_DAYS (default 180) so dev/demo
 * environments can relax it without redeploying.
 */
flashbackRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - env.FLASHBACK_MIN_DAYS);

    const candidates = await prisma.vote.findMany({
      where: {
        userId,
        createdAt: { lte: cutoff },
        // Only real daily paradoxes — not the first-run practice dilemma.
        paradox: { airDate: { not: null } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        choice: true,
        justification: true,
        tribeAssigned: true,
        createdAt: true,
        paradox: {
          select: {
            id: true,
            title: true,
            description: true,
            optionA: true,
            optionB: true,
          },
        },
      },
    });

    if (candidates.length === 0) {
      res.json({ flashback: null, minDays: env.FLASHBACK_MIN_DAYS });
      return;
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)]!;
    res.json({ flashback: pick, minDays: env.FLASHBACK_MIN_DAYS });
  } catch (e) {
    next(e);
  }
});
