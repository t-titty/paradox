import type { StreakSummary } from "../lib/types.ts";

/** Compact streak readout for the Today page. */
export function StreakChip({ streak }: { streak: StreakSummary }) {
  if (streak.current <= 0 && streak.best <= 0) return null;
  const atRisk = streak.current > 0 && !streak.votedToday;
  return (
    <div
      className={`inline-flex items-center gap-3 border px-3 py-1 font-mono text-xs uppercase tracking-brutal ${
        atRisk ? "border-blood text-blood" : "border-gold text-gold"
      }`}
      title={`Best: ${streak.best} days`}
    >
      <span>🔥 {streak.current}-DAY STREAK</span>
      {atRisk && <span>· VOW TODAY TO KEEP IT</span>}
      {streak.freezesAvailable > 0 && (
        <span className="text-muted">· {streak.freezesAvailable} FREEZE{streak.freezesAvailable > 1 ? "S" : ""}</span>
      )}
    </div>
  );
}
