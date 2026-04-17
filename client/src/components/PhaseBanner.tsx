import type { Phase } from "../lib/types.ts";

const LABELS: Record<Phase, { roman: string; title: string; sub: string }> = {
  drop: { roman: "I", title: "THE DROP", sub: "A new paradox arrives." },
  vow: { roman: "II", title: "THE VOW", sub: "Take a side. One sentence." },
  sort: { roman: "III", title: "THE SORT", sub: "The Oracle has read you." },
  duel: { roman: "IV", title: "THE DUEL", sub: "Ten minutes. Find your match." },
  bridge: { roman: "V", title: "THE BRIDGE", sub: "Until dawn. Meet tomorrow." },
};

export function PhaseBanner({ phase, nextTransitionAt }: { phase: Phase; nextTransitionAt: string }) {
  const { roman, title, sub } = LABELS[phase];
  return (
    <div className="flex items-baseline justify-between border-b border-smoke px-6 py-3 font-mono text-xs uppercase tracking-brutal text-muted">
      <span>
        <span className="text-gold">PHASE {roman}</span>
        <span className="mx-3 text-muted">·</span>
        <span className="text-bone">{title}</span>
        <span className="mx-3 text-muted">·</span>
        <span>{sub}</span>
      </span>
      <span>NEXT TRANSITION {fmt(nextTransitionAt)}</span>
    </div>
  );
}

function fmt(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
