import { resolvePhase } from "../phases.js";
import { ensureParadoxForDate } from "./schedule.js";
import { sortPendingVotes } from "./sorting.js";
import { addDaysYmd } from "./time.js";

/**
 * Minute-by-minute game upkeep, independent of push notifications:
 *   - make sure today's and tomorrow's paradoxes exist (calendar never runs dry)
 *   - once the Vow has closed, sort every unsorted vow in bulk so the Sort
 *     page is an instant read for everyone instead of a live AI call
 */
let handle: NodeJS.Timeout | null = null;
let running = false;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const phase = resolvePhase();
    await ensureParadoxForDate(phase.today);
    await ensureParadoxForDate(addDaysYmd(phase.today, 1));
    if (phase.phase === "sort" || phase.phase === "duel") {
      await sortPendingVotes(phase.today);
    }
  } catch (e) {
    console.error("[game] scheduler tick failed:", e instanceof Error ? e.message : e);
  } finally {
    running = false;
  }
}

export function startGameScheduler(): void {
  if (handle) return;
  void tick();
  handle = setInterval(() => void tick(), 60 * 1000);
  handle.unref();
}
