import { useEffect, useState } from "react";
import type { CombatMode } from "../../../lib/duelTypes.ts";

const MODE_LABEL: Record<CombatMode, { label: string; sub: string; tone: "bone" | "gold" | "blood" }> = {
  clarification: { label: "CLARIFICATION", sub: "QUESTIONS ONLY", tone: "bone" },
  crucible: { label: "THE CRUCIBLE", sub: "ORACLE IS WATCHING", tone: "blood" },
  bridge: { label: "THE BRIDGE", sub: "ACKNOWLEDGE A POINT", tone: "gold" },
  over: { label: "OVER", sub: "TRANSCRIPT FROZEN", tone: "bone" },
};

/**
 * Live countdown + mode indicator. Re-renders on a 250ms tick because we
 * display whole seconds and want the last second to feel responsive.
 */
export function DuelTimer({
  mode,
  duelEndsAt,
  nextTransitionAt,
}: {
  mode: CombatMode;
  duelEndsAt: string;
  nextTransitionAt: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const msToEnd = Math.max(0, new Date(duelEndsAt).getTime() - now);
  const msToTransition = nextTransitionAt
    ? Math.max(0, new Date(nextTransitionAt).getTime() - now)
    : 0;

  const { label, sub, tone } = MODE_LABEL[mode];
  const toneColor = tone === "bone" ? "text-bone" : tone === "gold" ? "text-gold" : "text-blood";
  const borderColor = tone === "bone" ? "border-bone" : tone === "gold" ? "border-gold" : "border-blood";

  return (
    <div className={`border-b-2 ${borderColor} px-4 py-3 md:px-6 md:py-4`}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className={`brutal-heading text-sm ${toneColor}`}>{label}</p>
          <p className="truncate font-mono text-xs uppercase tracking-brutal text-muted">{sub}</p>
        </div>
        <div className="text-right">
          <p className={`font-mono text-3xl ${toneColor} md:text-4xl`}>{fmtMs(msToEnd)}</p>
          <p className="font-mono text-[10px] uppercase tracking-brutal text-muted md:text-xs">
            {mode !== "over" && nextTransitionAt ? `NEXT IN ${fmtMs(msToTransition)}` : "FINAL"}
          </p>
        </div>
      </div>
    </div>
  );
}

function fmtMs(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
