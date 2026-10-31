import { prisma } from "../db.js";
import { addDaysYmd, dbDateToYmd, diffDaysYmd } from "./time.js";

/**
 * Vow streaks. A day "counts" when the player cast a vow on that day's
 * paradox (on time or late) or spent a streak freeze to cover it.
 *
 * The current streak stays alive through today even before today's vow is
 * cast — it only breaks once a whole day passes with no vow and no freeze.
 */

export const STREAK_FREEZE_COST_WP = 50;
export const MAX_STREAK_FREEZES = 3;

export interface StreakSummary {
  current: number;
  best: number;
  votedToday: boolean;
  freezesAvailable: number;
}

/** Pure streak math — exported for unit tests. */
export function computeStreak(
  coveredDays: Iterable<string>,
  today: string,
): { current: number; best: number; votedToday: boolean } {
  const days = new Set(coveredDays);
  const votedToday = days.has(today);

  // Current: walk back from today (or yesterday, if today isn't covered yet).
  let cursor = votedToday ? today : addDaysYmd(today, -1);
  let current = 0;
  while (days.has(cursor)) {
    current++;
    cursor = addDaysYmd(cursor, -1);
  }

  // Best: longest consecutive run anywhere in history.
  const sorted = Array.from(days).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev !== null && diffDaysYmd(prev, d) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }

  return { current, best: Math.max(best, current), votedToday };
}

/**
 * Pure: which missed days a freeze would cover so that `today` continues
 * the previous streak. Returns [] if there's nothing to bridge or the gap
 * is wider than the freezes available.
 */
export function daysToFreeze(
  coveredDays: Iterable<string>,
  today: string,
  freezesAvailable: number,
): string[] {
  const before = Array.from(coveredDays)
    .filter((d) => d < today)
    .sort();
  const last = before[before.length - 1];
  if (!last) return [];
  const gap = diffDaysYmd(last, today) - 1;
  if (gap <= 0 || gap > freezesAvailable) return [];
  const out: string[] = [];
  for (let i = 1; i <= gap; i++) out.push(addDaysYmd(last, i));
  return out;
}

async function coveredDaysForUser(userId: string): Promise<string[]> {
  const [votes, freezes] = await Promise.all([
    prisma.vote.findMany({
      where: { userId, paradox: { airDate: { not: null } } },
      select: { paradox: { select: { airDate: true } } },
    }),
    prisma.streakFreezeUse.findMany({ where: { userId }, select: { date: true } }),
  ]);
  const days: string[] = [];
  for (const v of votes) if (v.paradox.airDate) days.push(dbDateToYmd(v.paradox.airDate));
  for (const f of freezes) days.push(dbDateToYmd(f.date));
  return days;
}

export async function computeStreakForUser(userId: string, today: string): Promise<StreakSummary> {
  const [days, user] = await Promise.all([
    coveredDaysForUser(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { streakFreezes: true } }),
  ]);
  return { ...computeStreak(days, today), freezesAvailable: user?.streakFreezes ?? 0 };
}

/**
 * Called right after a vow is cast: if the player missed a day or two and
 * holds enough freezes, spend them so the streak carries on.
 */
export async function applyStreakFreezes(userId: string, today: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakFreezes: true },
  });
  if (!user || user.streakFreezes <= 0) return [];
  const days = await coveredDaysForUser(userId);
  const toFreeze = daysToFreeze(days, today, user.streakFreezes);
  if (toFreeze.length === 0) return [];
  await prisma.$transaction([
    ...toFreeze.map((d) =>
      prisma.streakFreezeUse.upsert({
        where: { userId_date: { userId, date: new Date(`${d}T00:00:00.000Z`) } },
        create: { userId, date: new Date(`${d}T00:00:00.000Z`) },
        update: {},
      }),
    ),
    prisma.user.update({
      where: { id: userId },
      data: { streakFreezes: { decrement: toFreeze.length } },
    }),
  ]);
  return toFreeze;
}
