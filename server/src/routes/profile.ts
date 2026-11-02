import { Router } from "express";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/error.js";
import type { Tribe } from "@prisma/client";
import { TRIBES, type TribeName } from "../lib/oracle.js";
import { computeConstellation, computeDrift } from "../lib/constellation.js";
import { badgesFor, titleFor } from "../lib/progression.js";
import { computeStreakForUser } from "../lib/streaks.js";
import { resolvePhase } from "../phases.js";
import { addDaysYmd, weekStartYmd } from "../lib/time.js";

export const profileRouter = Router();

/**
 * GET /api/profile/:username
 * Public. Returns everything the Moral Constellation page needs:
 *   - WP + civility
 *   - Full tribe history (ordered by airDate)
 *   - Tribe frequency counts
 *   - Pre-computed constellation coordinates
 *
 * The client does the 3D rendering; we do the math that shouldn't live
 * in the browser.
 */
profileRouter.get("/:username", async (req, res, next) => {
  try {
    const username = req.params.username;
    if (!username) throw new HttpError(400, "Missing username", "bad_request");

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        wisdomPoints: true,
        civilityScore: true,
        isPremium: true,
        createdAt: true,
        isBot: true,
      },
    });
    if (!user || user.isBot) throw new HttpError(404, "User not found", "not_found");

    const history = await prisma.tribeHistory.findMany({
      where: { userId: user.id },
      orderBy: { airDate: "asc" },
      select: {
        tribe: true,
        airDate: true,
        paradox: { select: { id: true, title: true, category: true } },
      },
    });

    // Community paradoxes this user submitted that made it to the schedule.
    // We key on "has a row in Paradox" — the SubmittedParadox status flips
    // to "approved" at the same moment the Paradox is created, so the
    // existence of the Paradox row is the source of truth for "used".
    const submittedParadoxes = await prisma.paradox.findMany({
      where: { submittedById: user.id },
      orderBy: [{ airDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        category: true,
        airDate: true,
      },
    });

    const tribeCounts = Object.fromEntries(TRIBES.map((t) => [t, 0])) as Record<TribeName, number>;
    for (const row of history) tribeCounts[row.tribe as TribeName]++;

    const constellation = computeConstellation(history.map((h) => h.tribe));

    // Progression: streak, title, badges and this week's Moral Drift.
    const today = resolvePhase().today;
    const weekStart = weekStartYmd(today);
    const baselineStart = addDaysYmd(weekStart, -28);
    const [streak, votes, pvpDuels, spars, syntheses, goldStars, shiftedThrowbacks] = await Promise.all([
      computeStreakForUser(user.id, today),
      prisma.vote.count({ where: { userId: user.id, paradox: { airDate: { not: null } } } }),
      prisma.duel.count({
        where: { kind: "pvp", endedAt: { not: null }, OR: [{ userAId: user.id }, { userBId: user.id }] },
      }),
      prisma.duel.count({ where: { kind: "spar", userAId: user.id } }),
      prisma.duel.count({
        where: { kind: "pvp", bothSigned: true, OR: [{ userAId: user.id }, { userBId: user.id }] },
      }),
      prisma.oracleMark.count({ where: { userId: user.id, kind: "gold_star" } }),
      prisma.throwbackRevote.count({ where: { userId: user.id, shift: "shifted" } }),
    ]);
    const thisWeekTribes = history
      .filter((h) => h.airDate.toISOString().slice(0, 10) >= weekStart)
      .map((h) => h.tribe);
    const baselineTribes = history
      .filter((h) => {
        const d = h.airDate.toISOString().slice(0, 10);
        return d >= baselineStart && d < weekStart;
      })
      .map((h) => h.tribe);
    const airedSubmissions = submittedParadoxes.filter(
      (p) => p.airDate && p.airDate.toISOString().slice(0, 10) <= today,
    ).length;

    const { isBot: _isBot, ...publicUser } = user;
    void _isBot;

    res.json({
      user: publicUser,
      streak: { current: streak.current, best: streak.best },
      title: titleFor(user.wisdomPoints),
      badges: badgesFor({
        votes,
        bestStreak: streak.best,
        pvpDuels,
        spars,
        syntheses,
        goldStars,
        shiftedThrowbacks,
        distinctTribes: Object.values(tribeCounts).filter((n) => n > 0).length,
        airedSubmissions,
      }),
      stats: { votes, pvpDuels, spars, syntheses, goldStars },
      drift: {
        weekStart,
        votesThisWeek: thisWeekTribes.length,
        ...computeDrift(thisWeekTribes, baselineTribes),
      },
      history: history.map((h) => ({
        tribe: h.tribe,
        airDate: h.airDate,
        paradox: h.paradox,
      })),
      tribeCounts,
      constellation,
      submittedParadoxes,
    });
  } catch (e) {
    next(e);
  }
});

