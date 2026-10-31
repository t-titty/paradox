import type { DuelSnapshotDTO, EndReason, SynthesisStateDTO } from "../../../lib/duelTypes.ts";
import { Message } from "./Message.tsx";
import { SynthesisPanel } from "./SynthesisPanel.tsx";
import { ReportButton } from "./ReportButton.tsx";

interface Props {
  snapshot: DuelSnapshotDTO;
  reason: EndReason;
  synthesis: SynthesisStateDTO;
  onSign: () => void;
  onDecline: () => void;
  onReturn: () => void;
  onReport: (reason: string, note?: string) => void;
}

/**
 * Post-duel screen. Shows end reason, Synthesis flow (when applicable), and
 * the frozen transcript. Ghosted duels skip synthesis entirely.
 */
export function DuelEnded({ snapshot, reason, synthesis, onSign, onDecline, onReturn, onReport }: Props) {
  const { you, opponent } = snapshot;
  const isPractice = snapshot.kind === "practice";
  const isExtension = reason.kind === "extension_granted";
  const isGhost = reason.kind === "ghost";

  const toneBorder = isExtension
    ? "border-gold"
    : isGhost
      ? "border-blood"
      : "border-bone";
  const toneText = isExtension ? "text-gold" : isGhost ? "text-blood" : "text-bone";

  const headline = isExtension
    ? "THE BRIDGE IS OPEN."
    : isGhost
      ? "THE DUEL WAS ABANDONED."
      : "THE DUEL IS COMPLETE.";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 md:px-6 md:py-12">
      <div className={`border-2 ${toneBorder} p-5 md:p-6`}>
        <p className={`brutal-heading text-sm ${toneText}`}>PHASE IV · OVER</p>
        <h1 className={`brutal-heading mt-3 text-3xl ${toneText} md:text-5xl lg:text-6xl`}>{headline}</h1>
        <p className="mt-4 font-mono text-bone">{reason.message}</p>
        {isPractice && (
          <p className="mt-3 font-mono text-sm text-gold">
            That was the practice round — nothing was scored. The real thing works exactly the same,
            against a human from an opposing tribe.
          </p>
        )}
        {snapshot.kind === "spar" && (
          <p className="mt-3 font-mono text-xs uppercase tracking-brutal text-muted">
            {snapshot.scored ? "SPAR · HALF WP" : "SPAR · UNSCORED (YOU ALREADY SPARRED TODAY)"}
          </p>
        )}
        {!opponent.isAi && (
          <div className="mt-4">
            <ReportButton onReport={onReport} />
          </div>
        )}
      </div>

      {!isGhost && synthesis.kind !== "none" && (
        <SynthesisPanel
          you={{ userId: you.userId }}
          state={synthesis}
          onSign={onSign}
          onDecline={onDecline}
          kind={snapshot.kind}
        />
      )}

      <section>
        <p className="brutal-heading text-sm text-muted">TRANSCRIPT</p>
        <div className="mt-4 flex flex-col gap-5 border border-smoke p-5">
          {snapshot.messages.length === 0 ? (
            <p className="font-mono text-sm text-muted">NO MESSAGES WERE SENT.</p>
          ) : (
            snapshot.messages.map((m) => (
              <Message key={m.id} message={m} isSelf={m.userId === you.userId} />
            ))
          )}
        </div>
      </section>

      <button onClick={onReturn} className="brutal-btn brutal-btn-gold self-start">
        {isPractice ? "FINISH PRACTICE →" : "RETURN TO LOBBY"}
      </button>
    </div>
  );
}
