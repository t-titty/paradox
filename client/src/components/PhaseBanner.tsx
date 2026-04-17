import type { Phase } from "../lib/types.ts";

const LABELS: Record<Phase, { roman: string; title: string; sub: string }> = {
  drop: { roman: "I", title: "THE DROP", sub: "A new paradox arrives." },
  vow: { roman: "II", title: "THE VOW", sub: "Take a side. One sentence." },
  sort: { roman: "III", title: "THE SORT", sub: "The Oracle has read you." },
  duel: { roman: "IV", title: "THE DUEL", sub: "Ten minutes. Find your match." },
  bridge: { roman: "V", title: "THE BRIDGE", sub: "Until dawn. Meet tomorrow." },
};

const ALL_PHASES: Phase[] = ["drop", "vow", "sort", "duel", "bridge"];

interface Props {
  phase: Phase;
  nextTransitionAt: string;
  testMode?: boolean;
  onPhaseOverride?: (p: Phase) => void;
}

export function PhaseBanner({ phase, nextTransitionAt, testMode, onPhaseOverride }: Props) {
  const { roman, title, sub } = LABELS[phase];
  return (
    <div className="flex flex-col gap-2 border-b border-smoke px-4 py-3 font-mono text-xs uppercase tracking-brutal text-muted md:flex-row md:items-baseline md:justify-between md:px-6">
      <span className="truncate">
        <span className="text-gold">PHASE {roman}</span>
        <span className="mx-3 text-muted">·</span>
        <span className="text-bone">{title}</span>
        <span className="mx-3 text-muted">·</span>
        <span className="hidden sm:inline">{sub}</span>
      </span>

      {testMode && onPhaseOverride ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gold">TEST MODE</span>
          <span className="text-muted">·</span>
          <div className="flex flex-wrap gap-1">
            {ALL_PHASES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPhaseOverride(p)}
                className={`border px-2 py-[2px] font-mono text-[11px] uppercase tracking-brutal ${
                  p === phase
                    ? "border-gold bg-gold text-ink"
                    : "border-smoke text-muted hover:border-gold hover:text-gold"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <span>NEXT TRANSITION {fmt(nextTransitionAt)}</span>
      )}
    </div>
  );
}

function fmt(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
