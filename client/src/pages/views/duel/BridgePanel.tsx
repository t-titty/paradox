import { useState, type FormEvent } from "react";
import type { DuelSnapshotDTO } from "../../../lib/duelTypes.ts";

interface Props {
  snapshot: DuelSnapshotDTO;
  onAcknowledge: (text: string) => void;
  onRequestExtension: () => void;
}

/**
 * Only mounted during the Bridge Window. Drives:
 *   1. The self-acknowledgement form (one shot, then shown back locked).
 *   2. Live display of the opponent's acknowledgement once they send theirs.
 *   3. The "Request Extension" button, gated on both acks being in.
 */
export function BridgePanel({ snapshot, onAcknowledge, onRequestExtension }: Props) {
  const { you, opponent, acknowledgements, extensionRequests } = snapshot;
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const myAck = acknowledgements.find((a) => a.userId === you.userId) ?? null;
  const theirAck = acknowledgements.find((a) => a.userId === opponent.userId) ?? null;
  const bothAcked = myAck !== null && theirAck !== null;
  const iRequested = extensionRequests.includes(you.userId);
  const theyRequested = extensionRequests.includes(opponent.userId);

  function submitAck(e: FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (trimmed.length < 10 || trimmed.length > 300) {
      setError("Name the point in 10–300 characters.");
      return;
    }
    onAcknowledge(trimmed);
    setError(null);
  }

  return (
    <div className="border-t-2 border-gold bg-ash px-6 py-5">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <p className="brutal-heading text-sm text-gold">
          THE BRIDGE — ACKNOWLEDGE ONE REASONABLE POINT
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AckCard
            title={`YOUR ACK (${you.username})`}
            ack={myAck}
            emptyNode={
              <form onSubmit={submitAck} className="flex flex-col gap-2">
                <textarea
                  className="brutal-input min-h-[80px] resize-none text-sm"
                  placeholder="Name the opponent's most reasonable point."
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setError(null);
                  }}
                  maxLength={300}
                />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted">{draft.length}/300</span>
                  <button className="brutal-btn brutal-btn-gold text-sm" disabled={!draft.trim()}>
                    ACKNOWLEDGE
                  </button>
                </div>
                {error && <p className="font-mono text-xs text-blood">{error}</p>}
              </form>
            }
          />

          <AckCard
            title={`THEIR ACK (${opponent.username})`}
            ack={theirAck}
            emptyNode={
              <p className="font-mono text-sm text-muted">
                WAITING FOR THEIR ACKNOWLEDGEMENT...
              </p>
            }
          />
        </div>

        <div className="flex items-center justify-between border-t border-smoke pt-4">
          <p className="font-mono text-xs uppercase tracking-brutal text-muted">
            {bothAcked
              ? theyRequested && !iRequested
                ? "YOUR OPPOSITE WANTS TO CROSS. WILL YOU?"
                : iRequested && !theyRequested
                  ? "YOU CROSSED. WAITING ON YOUR OPPOSITE."
                  : "BOTH ACKNOWLEDGED. THE BRIDGE MAY BE CROSSED."
              : "BOTH MUST ACKNOWLEDGE BEFORE THE BRIDGE UNLOCKS."}
          </p>
          <button
            onClick={onRequestExtension}
            className="brutal-btn brutal-btn-gold"
            disabled={!bothAcked || iRequested}
          >
            {iRequested ? "REQUESTED ✓" : "REQUEST EXTENSION"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AckCard({
  title,
  ack,
  emptyNode,
}: {
  title: string;
  ack: { text: string; at: string } | null;
  emptyNode: React.ReactNode;
}) {
  return (
    <div className="border border-smoke p-4">
      <p className="brutal-heading text-xs text-gold">{title}</p>
      <div className="mt-3">
        {ack ? (
          <p className="font-mono text-sm text-bone">"{ack.text}"</p>
        ) : (
          emptyNode
        )}
      </div>
    </div>
  );
}
