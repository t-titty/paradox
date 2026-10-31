import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { resolvePhase } from "../phases.js";
import { MAX_STREAK_FREEZES, STREAK_FREEZE_COST_WP, computeStreakForUser } from "../lib/streaks.js";

export const streakRouter = Router();

streakRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const streak = await computeStreakForUser(userId, resolvePhase().today);
    res.json({ streak, freezeCost: STREAK_FREEZE_COST_WP, maxFreezes: MAX_STREAK_FREEZES });
  } catch (e) {
    next(e);
  }
});

/**
 * Buy one streak freeze with Wisdom Points. A freeze is spent automatically
 * to cover a missed day the next time you vow.
 */
streakRouter.post("/freeze", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const updated = await prisma.user.updateMany({
      where: {
        id: userId,
        wisdomPoints: { gte: STREAK_FREEZE_COST_WP },
        streakFreezes: { lt: MAX_STREAK_FREEZES },
      },
      data: {
        wisdomPoints: { decrement: STREAK_FREEZE_COST_WP },
        streakFreezes: { increment: 1 },
      },
    });
    if (updated.count === 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { wisdomPoints: true, streakFreezes: true },
      });
      if (user && user.streakFreezes >= MAX_STREAK_FREEZES) {
        throw new HttpError(409, `You can hold at most ${MAX_STREAK_FREEZES} freezes.`, "max_freezes");
      }
      throw new HttpError(402, `A freeze costs ${STREAK_FREEZE_COST_WP} WP.`, "insufficient_wp");
    }
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { wisdomPoints: true, streakFreezes: true },
    });
    res.json(user);
  } catch (e) {
    next(e);
  }
});
