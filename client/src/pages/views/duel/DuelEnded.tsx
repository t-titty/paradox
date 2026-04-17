import type { DuelSnapshotDTO, EndReason, SynthesisStateDTO } from "../../../lib/duelTypes.ts";
import { Message } from "./Message.tsx";
import { SynthesisPanel } from "./SynthesisPanel.tsx";

interface Props {
  snapshot: DuelSnapshotDTO;
  reason: EndReason;
  synthesis: SynthesisStateDTO;
  onSign: () => void;
  onDecline: () => void;
  onReturn: () => void;
}

/**
 * Post-duel screen. Shows end reason, Synthesis flow (when applicable), and
 * the frozen transcript. Ghosted duels skip synthesis entirely.
 */
export function DuelEnded({ snapshot, reason, synthesis, onSign, onDecline, onReturn }: Props) {
  const { you } = snapshot;
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
      </div>

      {!isGhost && synthesis.kind !== "none" && (
        <SynthesisPanel
          you={{ userId: you.userId }}
          state={synthesis}
          onSign={onSign}
          onDecline={onDecline}
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

      <button onClick={onReturn} className="brutal-btn self-start">
        RETURN TO LOBBY
      </button>
    </div>
  );
}
