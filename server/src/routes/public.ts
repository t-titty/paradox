import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/error.js";
import { parseYmd, resolvePhase, ymd, type PhaseState } from "../phases.js";
import { TRIBES, type TribeName } from "../lib/oracle.js";
import { paradoxNumber, paradoxResults } from "../lib/results.js";
import { addDaysYmd, weekStartYmd } from "../lib/time.js";
import { PRACTICE_CATEGORY } from "../lib/schedule.js";

/**
 * Public, logged-out pages: past dilemmas with their results, the daily
 * highlights feed and the weekly Tribe Wars table. Everything here is safe
 * to show search engines and share links:
 *  - nothing from the future (tomorrow's paradox stays secret)
 *  - no results while a Vow is still open
 *  - no usernames in highlights, nothing from school-circle duels
 */
export const publicRouter = Router();

/** Is the paradox on `date` visible / are its results revealable right now? */
function visibility(date: string, phase: PhaseState): { visible: boolean; resultsOpen: boolean } {
  if (date < phase.today) return { visible: true, resultsOpen: true };
  if (date > phase.today) return { visible: false, resultsOpen: false };
  // Today: hidden until the Drop; results hidden until the Vow closes.
  if (phase.phase === "bridge") return { visible: false, resultsOpen: false };
  return { visible: true, resultsOpen: phase.phase === "sort" || phase.phase === "duel" };
}

const listSchema = z.object({
  before: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(60).default(30),
});

/** GET /api/public/paradoxes — aired dilemmas, newest first. */
publicRouter.get("/paradoxes", async (req, res, next) => {
  try {
    const q = listSchema.parse(req.query);
    const phase = resolvePhase();
    const latestVisible = phase.phase === "bridge" ? addDaysYmd(phase.today, -1) : phase.today;
    const upper = q.before && q.before <= latestVisible ? addDaysYmd(q.before, -1) : latestVisible;

    const rows = await prisma.paradox.findMany({
      where: { airDate: { not: null, lte: parseYmd(upper) }, category: { not: PRACTICE_CATEGORY } },
      orderBy: { airDate: "desc" },
      take: q.limit,
      select: {
        id: true,
        title: true,
        category: true,
        airDate: true,
        submittedBy: { select: { username: true } },
        _count: { select: { votes: true } },
      },
    });
    const items = rows.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      date: ymd(p.airDate!),
      voteCount: p._count.votes,
      submittedBy: p.submittedBy,
    }));
    const last = items[items.length - 1];
    res.json({ items, nextBefore: items.length === q.limit && last ? last.date : null });
  } catch (e) {
    next(e);
  }
});

/** GET /api/public/paradox/:date — one day's dilemma, results and bridges. */
publicRouter.get("/paradox/:date", async (req, res, next) => {
  try {
    const date = req.params.date ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "Bad date", "bad_request");
    const phase = resolvePhase();
    const vis = visibility(date, phase);
    if (!vis.visible) throw new HttpError(404, "Not aired yet", "not_found");
    res.json(await dayPayload(date, vis.resultsOpen));
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/public/highlights — the most recent day with revealed results:
 * its numbers, the best signed Syntheses and the sharpest Gold Star moves.
 */
publicRouter.get("/highlights", async (_req, res, next) => {
  try {
    const phase = resolvePhase();
    const date =
      phase.phase === "sort" || phase.phase === "duel" ? phase.today : addDaysYmd(phase.today, -1);
    const payload = await dayPayload(date, true).catch(() => null);
    res.json({ day: payload });
  } catch (e) {
    next(e);
  }
});

async function dayPayload(date: string, resultsOpen: boolean) {
  const paradox = await prisma.paradox.findUnique({
    where: { airDate: parseYmd(date) },
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
  if (!paradox) throw new HttpError(404, "No paradox on that date", "not_found");

  const number = await paradoxNumber(paradox.airDate);
  if (!resultsOpen) {
    return { date, number, paradox, resultsOpen: false as const };
  }

  const [results, syntheses, goldStars] = await Promise.all([
    paradoxResults(paradox.id),
    prisma.synthesisArchive.findMany({
      where: { duel: { paradoxId: paradox.id } },
      orderBy: { signedAt: "desc" },
      take: 3,
      select: { id: true, tribeA: true, tribeB: true, synthesisText: true, signedAt: true },
    }),
    prisma.oracleMark.findMany({
      where: { paradoxId: paradox.id, kind: "gold_star", isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, tribe: true, messageText: true, explanation: true },
    }),
  ]);
  return { date, number, paradox, resultsOpen: true as const, results, syntheses, goldStars };
}

/**
 * GET /api/public/tribe-wars — this week's standings. Each tribe scores
 * per member who vowed under it this week, so big tribes don't win by size:
 *   score = (3·goldStars + 10·syntheses − 2·redFlags) / members × 10
 */
publicRouter.get("/tribe-wars", async (_req, res, next) => {
  try {
    const phase = resolvePhase();
    const weekStart = weekStartYmd(phase.today);
    const prevWeekStart = addDaysYmd(weekStart, -7);
    const [current, previous] = await Promise.all([
      tribeWarsFor(weekStart, addDaysYmd(weekStart, 7)),
      tribeWarsFor(prevWeekStart, weekStart),
    ]);
    res.json({
      weekStart,
      standings: current,
      lastWeekWinner: previous.find((r) => r.members > 0) ?? null,
    });
  } catch (e) {
    next(e);
  }
});

async function tribeWarsFor(fromYmd: string, toYmd: string) {
  const from = parseYmd(fromYmd);
  const to = parseYmd(toYmd);
  const [members, marks, syntheses] = await Promise.all([
    prisma.tribeHistory.groupBy({
      by: ["tribe"],
      where: { airDate: { gte: from, lt: to } },
      _count: { _all: true },
    }),
    prisma.oracleMark.groupBy({
      by: ["tribe", "kind"],
      where: { createdAt: { gte: from, lt: to } },
      _count: { _all: true },
    }),
    prisma.synthesisArchive.findMany({
      where: { signedAt: { gte: from, lt: to } },
      select: { tribeA: true, tribeB: true },
    }),
  ]);

  const rows = new Map<TribeName, { members: number; goldStars: number; redFlags: number; syntheses: number }>();
  for (const t of TRIBES) rows.set(t, { members: 0, goldStars: 0, redFlags: 0, syntheses: 0 });
  for (const m of members) rows.get(m.tribe as TribeName)!.members = m._count._all;
  for (const m of marks) {
    const r = rows.get(m.tribe as TribeName)!;
    if (m.kind === "gold_star") r.goldStars += m._count._all;
    else r.redFlags += m._count._all;
  }
  for (const s of syntheses) {
    rows.get(s.tribeA as TribeName)!.syntheses++;
    if (s.tribeB !== s.tribeA) rows.get(s.tribeB as TribeName)!.syntheses++;
  }

  return Array.from(rows.entries())
    .map(([tribe, r]) => {
      const raw = 3 * r.goldStars + 10 * r.syntheses - 2 * r.redFlags;
      const score = r.members > 0 ? Math.round((raw / r.members) * 10) : 0;
      return { tribe, ...r, score };
    })
    .sort((a, b) => b.score - a.score || b.members - a.members);
}
