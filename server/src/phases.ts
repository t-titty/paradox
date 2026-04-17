import { env } from "./env.js";

export type Phase = "drop" | "vow" | "sort" | "duel" | "bridge";

export interface PhaseState {
  phase: Phase;
  /** Local server date in YYYY-MM-DD used to key paradoxes/votes. */
  today: string;
  /** ISO timestamp at which the current phase ends (approximate). */
  nextTransitionAt: string;
  /** True when TEST_MODE is enabled — the client uses this to unlock UI. */
  testMode: boolean;
}

/**
 * When test mode is on, accept a per-request phase override. Non-testers
 * can't force this — we only honor the override when env.TEST_MODE.
 */
export function resolvePhaseWithOverride(
  requestedPhase?: string | null,
  now: Date = new Date(),
): PhaseState {
  const state = resolvePhase(now);
  if (!env.TEST_MODE) return state;
  if (!requestedPhase) return state;
  if (!isPhase(requestedPhase)) return state;
  return { ...state, phase: requestedPhase };
}

function isPhase(v: string): v is Phase {
  return v === "drop" || v === "vow" || v === "sort" || v === "duel" || v === "bridge";
}

/**
 * Phase resolution is single-source-of-truth on the server. The client trusts
 * this so all phase-gating logic lives in one place.
 *
 * Phase boundaries (local time):
 *   [DROP_HOUR, VOW_END)        → "drop"  (paradox visible, voting open)
 *   [VOW_END,  SORT_END)        → "sort"  (voting closed, tribe assigned)
 *   [SORT_END, next DROP_HOUR)  → "duel"  (matchmaking + debate — Phase IV)
 *   before DROP_HOUR            → "bridge" of yesterday's duel (Phase V tail)
 *
 * The "vow" phase label is emitted during DROP window too — the client uses
 * vote-completion state to decide whether to show the Drop or the Vow UI.
 */
export function resolvePhase(now: Date = new Date()): PhaseState {
  if (env.PHASE_OVERRIDE) {
    return {
      phase: env.PHASE_OVERRIDE,
      today: ymd(now),
      nextTransitionAt: endOfDay(now).toISOString(),
      testMode: env.TEST_MODE,
    };
  }

  const hour = now.getHours();
  const drop = env.PHASE_DROP_HOUR;
  const vowEnd = env.PHASE_VOW_END_HOUR;
  const sortEnd = env.PHASE_SORT_END_HOUR;

  let phase: Phase;
  let transitionHour: number;
  let transitionDay = new Date(now);

  if (hour < drop) {
    phase = "bridge";
    transitionHour = drop;
  } else if (hour < vowEnd) {
    phase = "vow";
    transitionHour = vowEnd;
  } else if (hour < sortEnd) {
    phase = "sort";
    transitionHour = sortEnd;
  } else {
    phase = "duel";
    transitionHour = drop;
    transitionDay.setDate(transitionDay.getDate() + 1);
  }

  transitionDay.setHours(transitionHour, 0, 0, 0);

  return {
    phase,
    today: ymd(now),
    nextTransitionAt: transitionDay.toISOString(),
    testMode: env.TEST_MODE,
  };
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

/** Parse YYYY-MM-DD into a local-midnight Date (for Prisma date columns). */
export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}
