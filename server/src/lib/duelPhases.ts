/**
 * The Duel lasts 10 minutes and runs through three Combat Modes:
 *
 *   [0:00 – 3:00)  Clarification — questions only (must end with "?")
 *   [3:00 – 8:00)  Crucible      — open debate, Oracle checks for fallacies
 *   [8:00 – 10:00) Bridge Window — each side must Acknowledge a point
 *   [10:00+)       Over          — timer expired, transcript frozen
 *
 * The server is the single source of truth for mode timing — clients render
 * a countdown but every message is re-validated server-side using the duel's
 * startedAt timestamp.
 */

export type CombatMode = "clarification" | "crucible" | "bridge" | "over";

export const DUEL_DURATION_MS = 10 * 60 * 1000;
export const CLARIFICATION_END_MS = 3 * 60 * 1000;
export const CRUCIBLE_END_MS = 8 * 60 * 1000;

/** Per-duel mode boundaries. Practice spars run a compressed 4-minute clock. */
export interface DuelTiming {
  clarificationEndMs: number;
  crucibleEndMs: number;
  durationMs: number;
}

export const STANDARD_TIMING: DuelTiming = {
  clarificationEndMs: CLARIFICATION_END_MS,
  crucibleEndMs: CRUCIBLE_END_MS,
  durationMs: DUEL_DURATION_MS,
};

export const PRACTICE_TIMING: DuelTiming = {
  clarificationEndMs: 1 * 60 * 1000,
  crucibleEndMs: 3 * 60 * 1000,
  durationMs: 4 * 60 * 1000,
};

export interface ModeSnapshot {
  mode: CombatMode;
  /** Ms elapsed since duel start. */
  elapsedMs: number;
  /** Ms until the current mode ends (0 if "over"). */
  msUntilNextTransition: number;
  /** ISO of next transition, for clocks. Null when "over". */
  nextTransitionAt: string | null;
  /** ISO of the hard duel end, regardless of mode. */
  duelEndsAt: string;
}

export function resolveMode(
  startedAt: Date,
  now: Date = new Date(),
  timing: DuelTiming = STANDARD_TIMING,
): ModeSnapshot {
  const elapsedMs = Math.max(0, now.getTime() - startedAt.getTime());
  const duelEndsAt = new Date(startedAt.getTime() + timing.durationMs);

  let mode: CombatMode;
  let nextBoundary: number;

  if (elapsedMs >= timing.durationMs) {
    mode = "over";
    nextBoundary = timing.durationMs;
  } else if (elapsedMs < timing.clarificationEndMs) {
    mode = "clarification";
    nextBoundary = timing.clarificationEndMs;
  } else if (elapsedMs < timing.crucibleEndMs) {
    mode = "crucible";
    nextBoundary = timing.crucibleEndMs;
  } else {
    mode = "bridge";
    nextBoundary = timing.durationMs;
  }

  const msUntilNextTransition = Math.max(0, nextBoundary - elapsedMs);
  const nextTransitionAt =
    mode === "over"
      ? null
      : new Date(startedAt.getTime() + nextBoundary).toISOString();

  return { mode, elapsedMs, msUntilNextTransition, nextTransitionAt, duelEndsAt: duelEndsAt.toISOString() };
}

/**
 * Clarification mode accepts only questions. A "question" is any message
 * whose trimmed text ends with "?". We intentionally do not enforce
 * interrogative grammar (e.g. "Really." with a period is blocked; "What
 * would you do?" passes) — the goal is to force users to frame contributions
 * as inquiries during the first three minutes, not to be pedantic about
 * syntax.
 */
export function isValidMessageForMode(mode: CombatMode, text: string): { ok: true } | { ok: false; reason: string } {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { ok: false, reason: "Empty message." };
  if (trimmed.length > 2000) return { ok: false, reason: "Message too long. Max 2000 characters." };

  if (mode === "over") return { ok: false, reason: "The duel is over." };

  if (mode === "clarification") {
    if (!trimmed.endsWith("?")) {
      return { ok: false, reason: "Clarification mode — questions only. End with '?'." };
    }
  }

  return { ok: true };
}
