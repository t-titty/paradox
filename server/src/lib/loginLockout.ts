/**
 * Per-identifier login lockout: 5 failed attempts in 15 minutes → blocked
 * for 15 minutes from the moment the threshold is hit.
 *
 * Single-process in-memory Map. If we ever horizontally scale the server,
 * move this behind Redis — otherwise each instance enforces independently
 * and attackers get 5×N tries per window.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface Entry {
  attempts: number;
  // Timestamp of the first attempt in the current window.
  windowStart: number;
  // Absolute ms at which the lockout ends; 0 when not locked.
  lockedUntil: number;
}

const state = new Map<string, Entry>();

export interface LockoutStatus {
  locked: boolean;
  retryAfterSeconds: number;
  attemptsRemaining: number;
}

export function check(identifier: string): LockoutStatus {
  const key = normalize(identifier);
  const now = Date.now();
  const entry = state.get(key);
  if (!entry) {
    return { locked: false, retryAfterSeconds: 0, attemptsRemaining: MAX_ATTEMPTS };
  }
  if (entry.lockedUntil > now) {
    return {
      locked: true,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
      attemptsRemaining: 0,
    };
  }
  if (now - entry.windowStart > WINDOW_MS) {
    state.delete(key);
    return { locked: false, retryAfterSeconds: 0, attemptsRemaining: MAX_ATTEMPTS };
  }
  return {
    locked: false,
    retryAfterSeconds: 0,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - entry.attempts),
  };
}

export function recordFailure(identifier: string): LockoutStatus {
  const key = normalize(identifier);
  const now = Date.now();
  const entry = state.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    state.set(key, { attempts: 1, windowStart: now, lockedUntil: 0 });
    return { locked: false, retryAfterSeconds: 0, attemptsRemaining: MAX_ATTEMPTS - 1 };
  }
  entry.attempts += 1;
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + WINDOW_MS;
    return { locked: true, retryAfterSeconds: Math.ceil(WINDOW_MS / 1000), attemptsRemaining: 0 };
  }
  return {
    locked: false,
    retryAfterSeconds: 0,
    attemptsRemaining: MAX_ATTEMPTS - entry.attempts,
  };
}

export function recordSuccess(identifier: string): void {
  state.delete(normalize(identifier));
}

function normalize(id: string): string {
  return id.trim().toLowerCase();
}
