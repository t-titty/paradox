import type { Tribe } from "../lib/types.ts";

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

export function TribeBarChart({ counts }: { counts: Record<Tribe, number> }) {
  const max = Math.max(1, ...TRIBE_ORDER.map((t) => counts[t] ?? 0));
  return (
    <div className="flex flex-col gap-2">
      {TRIBE_ORDER.map((t) => {
        const count = counts[t] ?? 0;
        const pct = Math.round((count / max) * 100);
        return (
          <div key={t} className="flex items-center gap-4">
            <span className="w-40 font-mono text-xs uppercase tracking-brutal text-bone">
              {TRIBE_LABEL[t]}
            </span>
            <div className="relative h-5 flex-1 border border-smoke">
              <div className="h-full bg-bone" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-10 text-right font-mono text-xs text-muted">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
