import { Router } from "express";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { parseYmd, resolvePhase } from "../phases.js";

export const supportRouter = Router();

/** GET /api/support/me — the caller's Supporter status and today's spar allowance. */
supportRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPremium: true,
        supporterStatus: true,
        supporterPlan: true,
        supporterCurrentPeriodEnd: true,
        supporterSince: true,
      },
    });
    if (!user) throw new HttpError(404, "User not found", "not_found");

    const paradox = await prisma.paradox.findUnique({
      where: { airDate: parseYmd(resolvePhase().today) },
      select: { id: true },
    });
    const sparsToday = paradox
      ? await prisma.duel.count({ where: { userAId: userId, paradoxId: paradox.id, kind: "spar" } })
      : 0;

    res.json({
      isSupporter: user.isPremium,
      status: user.supporterStatus,
      plan: user.supporterPlan,
      currentPeriodEnd: user.supporterCurrentPeriodEnd,
      since: user.supporterSince,
      spars: {
        usedToday: sparsToday,
        freePerDay: env.FREE_SPARS_PER_DAY,
        unlimited: user.isPremium,
      },
    });
  } catch (e) {
    next(e);
  }
});
