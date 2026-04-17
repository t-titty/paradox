import { useEffect, useState } from "react";
import { api, errorMessage } from "../../lib/api.ts";
import type { SortResponse, Tribe } from "../../lib/types.ts";

const TRIBE_ORDER: Tribe[] = [
  "Utilitarian",
  "Deontologist",
  "VirtueEthicist",
  "Nihilist",
  "Stoic",
  "Existentialist",
  "Hedonist",
];

const TRIBE_LABEL: Record<Tribe, string> = {
  Utilitarian: "UTILITARIAN",
  Deontologist: "DEONTOLOGIST",
  VirtueEthicist: "VIRTUE ETHICIST",
  Nihilist: "NIHILIST",
  Stoic: "STOIC",
  Existentialist: "EXISTENTIALIST",
  Hedonist: "HEDONIST",
};

export function SortView() {
  const [state, setState] = useState<SortResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<SortResponse>("/sort/me");
        if (!cancelled) setState(data);
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
        <p className="brutal-heading text-2xl text-gold">THE ORACLE READS...</p>
        <p className="mt-3 font-mono text-sm text-muted">
          This takes a few seconds. The Oracle considers your reasoning carefully.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-16">
        <div className="brutal-card-blood">
          <p className="brutal-heading text-2xl text-blood">THE ORACLE TURNS AWAY</p>
          <p className="mt-3 font-mono text-bone">{error}</p>
        </div>
      </div>
    );
  }

  if (!state) return null;

  const { yours, consensus } = state;
  const total = consensus.totalVotes || 1;
  const aPct = Math.round((consensus.choiceCounts.A / total) * 100);
  const bPct = 100 - aPct;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10 md:gap-12 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">
          PHASE III · THE SORT
        </p>
        <h1 className="brutal-heading mt-3 text-4xl text-bone md:text-5xl lg:text-6xl">
          {state.paradox.title.toUpperCase()}
        </h1>
      </header>

      {yours.tribe && (
        <section className="brutal-card-gold">
          <p className="brutal-heading text-sm text-gold">THE ORACLE CALLS YOU</p>
          <h2 className="brutal-heading mt-4 break-words text-4xl text-bone md:text-6xl lg:text-7xl">
            {TRIBE_LABEL[yours.tribe]}
          </h2>
          {yours.confidence !== null && (
            <p className="mt-4 font-mono text-sm text-muted">
              CONFIDENCE {Math.round(yours.confidence * 100)}%
            </p>
          )}
          {yours.reasoning && (
            <p className="mt-6 border-t border-smoke pt-4 font-mono text-lg leading-relaxed text-bone">
              {yours.reasoning}
            </p>
          )}
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
        <div className="mt-4 space-y-3">
          <Bar
            label="A"
            count={consensus.choiceCounts.A}
            total={total}
            pct={aPct}
            highlighted={yours.choice === "A"}
          />
          <Bar
            label="B"
            count={consensus.choiceCounts.B}
            total={total}
            pct={bPct}
            highlighted={yours.choice === "B"}
          />
        </div>
        <p className="mt-3 font-mono text-xs uppercase tracking-brutal text-muted">
          TOTAL VOWS: {total}
        </p>
      </section>

      <section>
        <h3 className="brutal-heading text-sm text-muted">TRIBE DISTRIBUTION</h3>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {TRIBE_ORDER.map((t) => {
            const count = consensus.tribeCounts[t] ?? 0;
            const sum = TRIBE_ORDER.reduce((a, x) => a + (consensus.tribeCounts[x] ?? 0), 0) || 1;
            const pct = Math.round((count / sum) * 100);
            return (
              <TribeBar
                key={t}
                label={TRIBE_LABEL[t]}
                count={count}
                pct={pct}
                highlighted={yours.tribe === t}
              />
            );
          })}
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
  total: number;
  pct: number;
  highlighted: boolean;
}) {
  const barColor = highlighted ? "bg-gold" : "bg-bone";
  return (
    <div className="flex items-center gap-4">
      <span className="brutal-heading w-6 text-2xl text-bone">{label}</span>
      <div className="relative h-8 flex-1 border-2 border-bone">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-24 text-right font-mono text-sm text-bone">
        {pct}% · {count}
      </span>
    </div>
  );
}

function TribeBar({
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
  const barColor = highlighted ? "bg-gold" : "bg-smoke";
  const labelColor = highlighted ? "text-gold" : "text-bone";
  return (
    <div className="flex items-center gap-4">
      <span className={`w-40 font-mono text-xs uppercase tracking-brutal ${labelColor}`}>
        {label}
      </span>
      <div className="relative h-5 flex-1 border border-smoke">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 text-right font-mono text-xs text-muted">
        {pct}% · {count}
      </span>
    </div>
  );
}
