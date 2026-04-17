import type { Choice, Tribe } from "../lib/types.ts";

interface Flashback {
  id: string;
  choice: Choice;
  justification: string;
  tribeAssigned: Tribe | null;
  createdAt: string;
  paradox: {
    id: string;
    title: string;
    description: string;
    optionA: string;
    optionB: string;
  };
}

/**
 * Surfaces an old Vow (6+ months ago by default) and asks whether the user
 * still stands by it. For now this is display-only — the "re-vote" action
 * is a stub that collapses back into the normal Drop/Vow flow the next
 * time that paradox comes round.
 */
export function FlashbackCard({ flashback }: { flashback: Flashback }) {
  const ago = relativeDays(flashback.createdAt);
  const choiceText =
    flashback.choice === "A" ? flashback.paradox.optionA : flashback.paradox.optionB;

  return (
    <div className="brutal-card-gold">
      <p className="brutal-heading text-sm text-gold">PARADOX FLASHBACK · {ago}</p>
      <h3 className="brutal-heading mt-3 text-2xl text-bone">
        {flashback.paradox.title.toUpperCase()}
      </h3>
      <p className="mt-3 font-mono text-sm text-bone">{flashback.paradox.description}</p>

      <div className="mt-5 border-t border-smoke pt-4">
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">
          YOU CHOSE {flashback.choice} · {choiceText}
        </p>
        {flashback.tribeAssigned && (
          <p className="mt-1 font-mono text-xs uppercase tracking-brutal text-muted">
            ORACLE CALLED YOU: {flashback.tribeAssigned.toUpperCase()}
          </p>
        )}
        <p className="mt-3 font-mono text-lg text-bone">"{flashback.justification}"</p>
      </div>

      <p className="mt-5 font-mono text-sm text-bone">
        Do you still stand by this? The next time PARADOX runs this Drop, you'll have a
        chance to vow again.
      </p>
    </div>
  );
}

function relativeDays(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 365) return `${days} DAYS AGO`;
  const years = (days / 365).toFixed(1);
  return `${years} YEARS AGO`;
}
