import { env } from "./env.js";
import { addDaysYmd, zonedParts, zonedTimeToUtc, zonedYmd } from "./lib/time.js";
import { runtimeClockOverride } from "./lib/clockOverride.js";

export type Phase = "drop" | "vow" | "sort" | "duel" | "bridge";

export interface PhaseSchedule {
  /** IANA zone the whole game runs on. */
  timezone: string;
  dropHour: number;
  vowEndHour: number;
  /** Prime-time duel bell. Duels are open from vowEndHour, busiest after this. */
  duelHour: number;
}

export interface PhaseState {
  phase: Phase;
  /** Game-zone date in YYYY-MM-DD used to key paradoxes/votes. */
  today: string;
  /** ISO timestamp at which the current phase ends. */
  nextTransitionAt: string;
  /** ISO timestamp of the next Drop — lets clients show it in local time. */
  nextDropAt: string;
  /** True when TEST_MODE is enabled — the client uses this to unlock UI. */
  testMode: boolean;
  schedule: PhaseSchedule;
  /** True when the phase is forced (admin test clock or PHASE_OVERRIDE). */
  clockOverridden?: boolean;
}

export function phaseSchedule(): PhaseSchedule {
  return {
    timezone: env.PHASE_TIMEZONE,
    dropHour: env.PHASE_DROP_HOUR,
    vowEndHour: env.PHASE_VOW_END_HOUR,
    duelHour: env.PHASE_SORT_END_HOUR,
  };
}

/**
 * Phase resolution is single-source-of-truth on the server, on the game
 * clock (PHASE_TIMEZONE) — never the host's local time.
 *
 * Phase boundaries (game-zone wall clock):
 *   [DROP_HOUR, VOW_END)        → "vow"    (paradox visible, voting open)
 *   [VOW_END,  SORT_END)        → "sort"   (tribes revealed, duels open, late vows allowed)
 *   [SORT_END, midnight)        → "duel"   (prime-time duels, late vows allowed)
 *   [midnight, DROP_HOUR)       → "bridge" (overnight: yesterday's results, wait for the Drop)
 */
export function resolvePhase(now: Date = new Date()): PhaseState {
  const schedule = phaseSchedule();
  const tz = schedule.timezone;
  const today = zonedYmd(now, tz);
  const nextDropAt = nextDrop(now, schedule).toISOString();

  // Admin test clock (staging/dev only) wins over the env override.
  const override = runtimeClockOverride() ?? env.PHASE_OVERRIDE;
  if (override) {
    return {
      phase: override,
      today,
      nextTransitionAt: atHour(today, 24, tz).toISOString(),
      nextDropAt,
      testMode: env.TEST_MODE,
      schedule,
      clockOverridden: true,
    };
  }

  const hour = zonedParts(now, tz).hour;
  let phase: Phase;
  let transition: Date;

  if (hour < schedule.dropHour) {
    phase = "bridge";
    transition = atHour(today, schedule.dropHour, tz);
  } else if (hour < schedule.vowEndHour) {
    phase = "vow";
    transition = atHour(today, schedule.vowEndHour, tz);
  } else if (hour < schedule.duelHour) {
    phase = "sort";
    transition = atHour(today, schedule.duelHour, tz);
  } else {
    phase = "duel";
    // Duels close at midnight game time — after that "today" is a new date
    // whose paradox has not dropped yet.
    transition = atHour(today, 24, tz);
  }

  return {
    phase,
    today,
    nextTransitionAt: transition.toISOString(),
    nextDropAt,
    testMode: env.TEST_MODE,
    schedule,
  };
}

/** True when late (post-window) vows are accepted for today's paradox. */
export function lateVowsOpen(state: PhaseState): boolean {
  return env.ALLOW_LATE_VOWS && (state.phase === "sort" || state.phase === "duel");
}

/** True when duels (human or AI) can be started for today's paradox. */
export function duelsOpen(state: PhaseState): boolean {
  return state.phase === "sort" || state.phase === "duel";
}

function atHour(ymdStr: string, hour: number, tz: string): Date {
  const [y, m, d] = ymdStr.split("-").map(Number);
  if (hour >= 24) {
    const next = addDaysYmd(ymdStr, 1).split("-").map(Number);
    return zonedTimeToUtc(next[0]!, next[1]!, next[2]!, hour - 24, tz);
  }
  return zonedTimeToUtc(y!, m!, d!, hour, tz);
}

function nextDrop(now: Date, schedule: PhaseSchedule): Date {
  const today = zonedYmd(now, schedule.timezone);
  const todayDrop = atHour(today, schedule.dropHour, schedule.timezone);
  if (todayDrop.getTime() > now.getTime()) return todayDrop;
  return atHour(addDaysYmd(today, 1), schedule.dropHour, schedule.timezone);
}

/**
 * Format a Prisma @db.Date (stored at UTC midnight) as YYYY-MM-DD.
 * Do not pass "now" here — use resolvePhase().today for the game date.
 */
export function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD into a UTC-midnight Date (what Prisma uses for @db.Date). */
export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
}
