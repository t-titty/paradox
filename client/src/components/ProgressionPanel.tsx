import { useState } from "react";
import { api, errorMessage } from "../lib/api.ts";
import type { Tribe } from "../lib/types.ts";
import { TRIBE_LABEL } from "../lib/tribes.ts";

export interface Progression {
  streak: { current: number; best: number };
  title: {
    current: { key: string; label: string; minWp: number };
    next: { key: string; label: string; minWp: number } | null;
    progress: number;
  };
  badges: { key: string; label: string; description: string; earned: boolean }[];
  stats: { votes: number; pvpDuels: number; spars: number; syntheses: number; goldStars: number };
  drift: {
    weekStart: string;
    votesThisWeek: number;
    delta: [number, number, number] | null;
    dominantTribe: Tribe | null;
  };
}

const AXES = [
  { neg: "PRINCIPLES", pos: "OUTCOMES" },
  { neg: "SELF", pos: "OTHERS" },
  { neg: "FEELING", pos: "REASON" },
];

/** Plain-English summary of the week's movement on the three axes. */
function driftSentence(delta: [number, number, number]): string {
  const moves = delta
    .map((d, i) => ({ d, axis: AXES[i]! }))
    .filter((m) => Math.abs(m.d) >= 0.1)
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
    .map((m) => `toward ${m.d > 0 ? m.axis.pos : m.axis.neg}`.toLowerCase());
  if (moves.length === 0) return "Your reasoning held steady this week.";
  return `This week you drifted ${moves.join(" and ")}.`;
}

export function ProgressionPanel({
  data,
  isSelf,
  wisdomPoints,
  onChanged,
}: {
  data: Progression;
  isSelf: boolean;
  wisdomPoints: number;
  onChanged?: () => void;
}) {
  const [freezeMsg, setFreezeMsg] = useState<string | null>(null);
  const { title, badges, streak, drift } = data;

  async function buyFreeze() {
    setFreezeMsg(null);
    try {
      const { data: r } = await api.post<{ wisdomPoints: number; streakFreezes: number }>("/streak/freeze");
      setFreezeMsg(`Freeze bought. You hold ${r.streakFreezes}.`);
      onChanged?.();
    } catch (e) {
      setFreezeMsg(errorMessage(e, "Could not buy a freeze."));
    }
  }

  return (
    <>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="border-2 border-gold p-5">
          <p className="font-mono text-xs uppercase tracking-brutal text-muted">TITLE</p>
          <p className="brutal-heading mt-2 text-3xl text-gold">{title.current.label}</p>
          {title.next ? (
            <>
              <div className="mt-4 h-2 border border-smoke">
                <div className="h-full bg-gold" style={{ width: `${Math.round(title.progress * 100)}%` }} />
              </div>
              <p className="mt-2 font-mono text-xs text-muted">
                {Math.max(0, title.next.minWp - wisdomPoints)} WP TO {title.next.label}
              </p>
            </>
          ) : (
            <p className="mt-2 font-mono text-xs text-muted">THE HIGHEST TITLE.</p>
          )}
        </div>
        <div className="border-2 border-bone p-5">
          <p className="font-mono text-xs uppercase tracking-brutal text-muted">VOW STREAK</p>
          <p className="brutal-heading mt-2 text-3xl text-bone">🔥 {streak.current} DAYS</p>
          <p className="mt-2 font-mono text-xs text-muted">BEST · {streak.best} DAYS</p>
          {isSelf && (
            <div className="mt-4">
              <button onClick={buyFreeze} className="brutal-btn text-xs">
                BUY A STREAK FREEZE · 50 WP
              </button>
              <p className="mt-2 font-mono text-[11px] text-muted">
                A freeze covers a missed day automatically the next time you vow. Hold up to 3.
              </p>
              {freezeMsg && <p className="mt-2 font-mono text-xs text-gold">{freezeMsg}</p>}
            </div>
          )}
        </div>
      </section>

      {isSelf && (
        <section className="border-2 border-smoke p-5">
          <p className="brutal-heading text-sm text-gold">THIS WEEK'S MORAL DRIFT</p>
          {drift.votesThisWeek === 0 ? (
            <p className="mt-2 font-mono text-sm text-muted">No vows yet this week. Your drift report fills in as you play.</p>
          ) : (
            <>
              <p className="mt-2 font-mono text-bone">
                {drift.delta ? driftSentence(drift.delta) : "Not enough history yet to measure drift — keep vowing."}
              </p>
              <p className="mt-2 font-mono text-xs uppercase tracking-brutal text-muted">
                {drift.votesThisWeek} VOW{drift.votesThisWeek === 1 ? "" : "S"} THIS WEEK
                {drift.dominantTribe ? ` · MOSTLY ${TRIBE_LABEL[drift.dominantTribe]}` : ""}
              </p>
            </>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="brutal-heading text-sm text-muted">
          BADGES · {badges.filter((b) => b.earned).length}/{badges.length}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {badges.map((b) => (
            <div
              key={b.key}
              className={`border-2 p-3 ${b.earned ? "border-gold" : "border-smoke opacity-40"}`}
              title={b.description}
            >
              <p className={`brutal-heading text-sm ${b.earned ? "text-gold" : "text-muted"}`}>{b.label}</p>
              <p className="mt-1 font-mono text-[11px] text-bone">{b.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
