import { Link } from "react-router-dom";
import type { SynthesisStateDTO } from "../../../lib/duelTypes.ts";

interface Props {
  you: { userId: string };
  state: SynthesisStateDTO;
  onSign: () => void;
  onDecline: () => void;
}

/**
 * Post-duel Synthesis reveal + sign/decline flow. Rendered inside DuelEnded.
 *
 *   pending         → "The Oracle is writing..."
 *   ready           → synthesis text + SIGN / DECLINE
 *   signed_partial  → locked if you signed; SIGN/DECLINE if opponent did first
 *   signed_both     → archive confirmation + link
 *   declined        → graceful "no bridge" state
 */
export function SynthesisPanel({ you, state, onSign, onDecline }: Props) {
  if (state.kind === "none") return null;

  if (state.kind === "pending") {
    return (
      <div className="brutal-card-gold">
        <p className="brutal-heading text-sm text-gold">THE ORACLE IS WRITING...</p>
        <p className="mt-3 font-mono text-bone">
          A Synthesis is being drafted from your transcript. This takes a few seconds.
        </p>
      </div>
    );
  }

  if (state.kind === "declined") {
    return (
      <div className="brutal-card-blood">
        <p className="brutal-heading text-sm text-blood">NO BRIDGE WAS BUILT.</p>
        <p className="mt-3 font-mono text-bone">{state.reason}</p>
      </div>
    );
  }

  if (state.kind === "signed_both") {
    return (
      <div className="brutal-card-gold">
        <p className="brutal-heading text-sm text-gold">THE BRIDGE STANDS.</p>
        <p className="mt-4 border-t border-smoke pt-4 font-mono text-lg leading-relaxed text-bone">
          "{state.text}"
        </p>
        <p className="mt-4 font-mono text-xs uppercase tracking-brutal text-muted">
          SIGNED · ENTERED THE GLOBAL ARCHIVE
        </p>
        <Link to="/archive" className="brutal-btn brutal-btn-gold mt-5 inline-block">
          VIEW IN ARCHIVE →
        </Link>
      </div>
    );
  }

  const iSigned = state.kind === "signed_partial" && state.signedByUserIds.includes(you.userId);

  return (
    <div className="brutal-card-gold">
      <p className="brutal-heading text-sm text-gold">THE ORACLE PROPOSES A BRIDGE.</p>
      <p className="mt-4 border-t border-smoke pt-4 font-mono text-lg leading-relaxed text-bone">
        "{state.text}"
      </p>
      <p className="mt-2 font-mono text-xs uppercase tracking-brutal text-muted">
        GENERATED {new Date(state.generatedAt).toLocaleTimeString()}
      </p>

      <p className="mt-5 font-mono text-sm text-bone">
        {state.kind === "signed_partial" && !iSigned
          ? "Your opposite has signed. Will you?"
          : state.kind === "signed_partial" && iSigned
            ? "You have signed. Waiting on your opposite."
            : "Do you sign this Synthesis? Both signatures enter it into the Global Archive."}
      </p>

      <div className="mt-5 flex gap-3">
        <button
          onClick={onSign}
          className="brutal-btn brutal-btn-gold flex-1"
          disabled={iSigned}
        >
          {iSigned ? "SIGNED ✓" : "SIGN IT"}
        </button>
        <button
          onClick={onDecline}
          className="brutal-btn brutal-btn-blood flex-1"
          disabled={iSigned}
        >
          DECLINE
        </button>
      </div>
    </div>
  );
}
