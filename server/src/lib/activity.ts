import { env } from "../env.js";

/**
 * Tracks when a real player last did something (an API request or a socket
 * event — not health checks or socket keep-alive pings).
 *
 * On free hosting (Render + Neon) the database bills for every hour it's
 * awake, and the every-minute background jobs would keep it awake forever.
 * With IDLE_PAUSE_MINUTES set, those jobs skip their database work once
 * nobody has been active for that long, so the database can go to sleep.
 * Nothing is lost: sorting and calendar upkeep also run on demand when
 * players come back.
 */
let lastActivity = Date.now();

export function markActivity(): void {
  lastActivity = Date.now();
}

/** True when background jobs should run (always, unless idle pausing is on). */
export function backgroundWorkAllowed(now = Date.now()): boolean {
  if (env.IDLE_PAUSE_MINUTES <= 0) return true;
  return now - lastActivity < env.IDLE_PAUSE_MINUTES * 60_000;
}
