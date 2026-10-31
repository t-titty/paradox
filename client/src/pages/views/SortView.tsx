import { useEffect, useState } from "react";
import { api, errorMessage } from "../../lib/api.ts";
import type { SortResponse, Tribe } from "../../lib/types.ts";
import { TRIBE_CREED, TRIBE_LABEL, TRIBE_ORDER, confidenceLabel } from "../../lib/tribes.ts";
import { formatAirDate } from "../../lib/dates.ts";
import { ShareButton } from "../../components/ShareCard.tsx";
import { StreakChip } from "../../components/StreakChip.tsx";

/**
 * Phase III — the tribe reveal and the day's results. The reveal animates
 * once per paradox (remembered per browser), then shows the vote split, how
 * each tribe split between A and B, and the share card.
 */
export function SortView() {
  const [state, setState] = useState<SortResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<SortResponse>("/sort/me");
        if (cancelled) return;
        setState(data);
        const key = `paradox.revealed.${data.paradox.id}`;
        let seen = false;
        try {
          seen = localStorage.getItem(key) === "1";
          localStorage.setItem(key, "1");
        } catch {
          /* private mode — just animate */
        }
        if (seen) setRevealed(true);
        else setTimeout(() => !cancelled && setRevealed(true), 1400);
      } catch (e) {
        if (!cancelled) setError(errorMessage(e, "The Oracle could not read you."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center md:px-6 md:py-24">
        <p className="brutal-heading animate-pulse text-2xl text-gold">THE ORACLE READS...</p>
        <p className="mt-3 font-mono text-sm text-muted">
          The Oracle is weighing the shape of your reasoning, not the side you picked.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6 md:p-16">
        <div className="brutal-card-blood">
          <p className="brutal-heading text-2xl text-blood">THE ORACLE TURNS AWAY</p>
          <p className="mt-3 font-mono text-bone">{error}</p>
        </div>
      </div>
    );
  }

  if (!state) return null;

  const { yours, consensus, paradox, streak } = state;
  const total = consensus.totalVotes || 1;
  const aPct = Math.round((consensus.choiceCounts.A / total) * 100);
  const bPct = 100 - aPct;
  const sortedTotal = TRIBE_ORDER.reduce((a, t) => a + (consensus.tribeCounts[t] ?? 0), 0) || 1;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10 md:gap-12 md:px-6 md:py-16">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">
          PHASE III · THE SORT
          {paradox.number ? <span className="text-gold"> · PARADOX #{paradox.number}</span> : null}
          {yours.isLate && <span className="text-gold"> · LATE VOW</span>}
        </p>
        <h1 className="brutal-heading text-4xl text-bone md:text-5xl lg:text-6xl">
          {paradox.title.toUpperCase()}
        </h1>
        <StreakChip streak={streak} />
      </header>

      {yours.tribe && (
        <section className="brutal-card-gold overflow-hidden">
          <p className="brutal-heading text-sm text-gold">THE ORACLE CALLS YOU</p>
          <h2
            className={`brutal-heading mt-4 break-words text-4xl text-bone transition-all duration-700 md:text-6xl lg:text-7xl ${
              revealed ? "translate-y-0 opacity-100 blur-0" : "translate-y-4 opacity-0 blur-sm"
            }`}
          >
            {TRIBE_LABEL[yours.tribe]}
          </h2>
          <div className={`transition-opacity delay-300 duration-700 ${revealed ? "opacity-100" : "opacity-0"}`}>
            <p className="mt-3 font-mono text-sm italic text-bone">{TRIBE_CREED[yours.tribe]}</p>
            {yours.confidence !== null && (
              <p className="mt-4 font-mono text-xs uppercase tracking-brutal text-muted">
                {confidenceLabel(yours.confidence)} · CONFIDENCE {Math.round(yours.confidence * 100)}%
              </p>
            )}
            {yours.reasoning && (
              <p className="mt-6 border-t border-smoke pt-4 font-mono text-lg leading-relaxed text-bone">
                {yours.reasoning}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ShareButton
                data={{
                  number: paradox.number,
                  date: paradox.airDate,
                  title: paradox.title,
                  tribe: yours.tribe,
                  sidePct: yours.sidePct,
                  streak: streak.current,
                }}
              />
              <span className="font-mono text-xs uppercase tracking-brutal text-muted">
                {formatAirDate(paradox.airDate)}
              </span>
            </div>
          </div>
        </section>
      )}

      <section>
        <h3 className="brutal-heading text-sm text-muted">YOUR SENTENCE</h3>
        <p className="mt-2 font-mono text-xl text-bone">"{yours.justification}"</p>
        <p className="mt-2 font-mono text-xs uppercase tracking-brutal text-muted">
          YOU CHOSE {yours.choice} · {yours.choiceText}
        </p>
      </section>

      <section>
        <h3 className="brutal-heading text-sm text-muted">THE WORLD VOTED</h3>
        <p className="mt-2 font-mono text-sm text-bone">
          You sided with <span className="text-gold">{yours.sidePct}%</span> of{" "}
          {consensus.totalVotes} vow{consensus.totalVotes === 1 ? "" : "s"}.
        </p>
        <div className="mt-4 space-y-3">
          <Bar label="A" count={consensus.choiceCounts.A} pct={aPct} highlighted={yours.choice === "A"} />
          <Bar label="B" count={consensus.choiceCounts.B} pct={bPct} highlighted={yours.choice === "B"} />
        </div>
      </section>

      <section>
        <h3 className="brutal-heading text-sm text-muted">HOW EACH TRIBE SPLIT</h3>
        <p className="mt-2 font-mono text-xs text-muted">
          Same tribe, different verdicts — the Oracle sorts by reasoning, not by side.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {TRIBE_ORDER.map((t) => (
            <TribeSplitRow
              key={t}
              tribe={t}
              share={Math.round(((consensus.tribeCounts[t] ?? 0) / sortedTotal) * 100)}
              split={consensus.tribeChoice?.[t] ?? { A: 0, B: 0 }}
              highlighted={yours.tribe === t}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function Bar({
  label,
  count,
  pct,
  highlighted,
}: {
  label: string;
  count: number;
  pct: number;
  highlighted: boolean;
}) {
  const barColor = highlighted ? "bg-gold" : "bg-bone";
  return (
    <div className="flex items-center gap-4">
      <span className="brutal-heading w-6 text-2xl text-bone">{label}</span>
      <div className="relative h-8 flex-1 border-2 border-bone">
        <div className={`h-full ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-24 text-right font-mono text-sm text-bone">
        {pct}% · {count}
      </span>
    </div>
  );
}

function TribeSplitRow({
  tribe,
  share,
  split,
  highlighted,
}: {
  tribe: Tribe;
  share: number;
  split: { A: number; B: number };
  highlighted: boolean;
}) {
  const n = split.A + split.B;
  const aPct = n > 0 ? Math.round((split.A / n) * 100) : 0;
  const labelColor = highlighted ? "text-gold" : "text-bone";
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
      <span className={`w-44 font-mono text-xs uppercase tracking-brutal ${labelColor}`}>
        {TRIBE_LABEL[tribe]} <span className="text-muted">· {share}%</span>
      </span>
      <div className="relative flex h-5 flex-1 border border-smoke">
        {n > 0 ? (
          <>
            <div className={highlighted ? "bg-gold" : "bg-bone"} style={{ width: `${aPct}%` }} />
            <div className="bg-smoke" style={{ width: `${100 - aPct}%` }} />
          </>
        ) : null}
      </div>
      <span className="w-28 text-right font-mono text-xs text-muted">
        {n > 0 ? `A ${aPct}% · B ${100 - aPct}%` : "NO VOWS"}
      </span>
    </div>
  );
}
