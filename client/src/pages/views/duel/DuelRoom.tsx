import { useEffect, useRef, useState, type FormEvent } from "react";
import type { DuelSnapshotDTO } from "../../../lib/duelTypes.ts";
import { DuelTimer } from "./DuelTimer.tsx";
import { Message } from "./Message.tsx";
import { BridgePanel } from "./BridgePanel.tsx";
import { ReportButton } from "./ReportButton.tsx";

interface Props {
  snapshot: DuelSnapshotDTO;
  onSendMessage: (text: string) => void;
  onAcknowledge: (text: string) => void;
  onRequestExtension: () => void;
  onReport: (reason: string, note?: string) => void;
}

/** One-tap openers for Clarification mode — the hardest mode for new players. */
const QUESTION_STARTERS = [
  "What would change your mind?",
  "Who bears the cost of your choice?",
  "Is there a version of this where you'd pick the other side?",
  "What matters more to you here — the outcome or the act?",
  "What do you think I'm missing?",
];

const MODE_HINT: Record<string, string> = {
  clarification: "QUESTIONS ONLY · UNDERSTAND BEFORE YOU ATTACK · END WITH '?'",
  crucible: "OPEN ARGUMENT · STEELMAN FOR GOLD STARS · FALLACIES EARN RED FLAGS",
  bridge: "FIND COMMON GROUND · ACKNOWLEDGE THEIR BEST POINT BELOW",
  over: "THE DUEL IS OVER",
};

/**
 * The live Duel room. Three-pane layout: timer header, scrolling transcript,
 * mode-aware input footer. Auto-scrolls on new message.
 */
export function DuelRoom({ snapshot, onSendMessage, onAcknowledge, onRequestExtension, onReport }: Props) {
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const { mode, you, opponent, messages } = snapshot;

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages.length]);

  function validateForMode(text: string): string | null {
    const trimmed = text.trim();
    if (trimmed.length === 0) return "Empty.";
    if (trimmed.length > 2000) return "Too long. Max 2000 chars.";
    if (mode === "clarification" && !trimmed.endsWith("?")) {
      return "Clarification mode — questions only. End with '?'.";
    }
    return null;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validateForMode(draft);
    if (err) {
      setLocalError(err);
      return;
    }
    onSendMessage(draft);
    setDraft("");
    setLocalError(null);
  }

  const inputDisabled = mode === "over";

  const inputPlaceholder =
    mode === "clarification"
      ? "ASK SOMETHING — END WITH '?'"
      : mode === "crucible"
        ? "ARGUE. THE ORACLE IS WATCHING."
        : mode === "bridge"
          ? "YOU MAY STILL TALK. BUT ACKNOWLEDGE BELOW."
          : "THE DUEL IS OVER.";

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col md:h-[calc(100vh-9rem)]">
      <DuelTimer
        mode={mode}
        duelEndsAt={snapshot.duelEndsAt}
        nextTransitionAt={snapshot.nextTransitionAt}
      />

      <header className="border-b border-smoke px-4 py-3 md:px-6">
        <div className="flex flex-col gap-2 font-mono text-xs uppercase tracking-brutal md:flex-row md:items-center md:justify-between md:gap-0">
          <div className="min-w-0 truncate">
            <span className="text-gold">{you.username}</span>
            <span className="mx-2 text-muted">·</span>
            <span className="text-bone">{you.tribe.toUpperCase()}</span>
            <span className="mx-2 text-muted">·</span>
            <span className="text-muted">VOTED {you.choice}</span>
          </div>
          <div className="hidden text-muted md:block">VS</div>
          <div className="min-w-0 truncate md:text-right">
            {opponent.isAi && (
              <span className="mr-2 border border-gold px-1 text-[10px] text-gold">AI</span>
            )}
            <span className="text-blood">{opponent.username}</span>
            <span className="mx-2 text-muted">·</span>
            <span className="text-bone">{opponent.tribe.toUpperCase()}</span>
            <span className="mx-2 text-muted">·</span>
            <span className="text-muted">VOTED {opponent.choice}</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="truncate font-mono text-xs text-muted">
            PARADOX · {snapshot.paradoxTitle.toUpperCase()}
            {snapshot.kind === "practice" && <span className="ml-2 text-gold">· PRACTICE</span>}
            {snapshot.kind === "spar" && (
              <span className="ml-2 text-gold">· SPAR{snapshot.scored ? " · HALF WP" : " · UNSCORED"}</span>
            )}
          </p>
          {!opponent.isAi && <ReportButton onReport={onReport} />}
        </div>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-brutal text-gold">{MODE_HINT[mode]}</p>
      </header>

      <div
        ref={transcriptRef}
        className="flex-1 overflow-y-auto overscroll-contain bg-ink px-4 py-5 md:px-6 md:py-6"
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          {messages.length === 0 && (
            <p className="text-center font-mono text-sm text-muted">
              {mode === "clarification"
                ? "CLARIFICATION BEGINS. ASK A QUESTION."
                : "SILENCE."}
            </p>
          )}
          {messages.map((m) => (
            <Message key={m.id} message={m} isSelf={m.userId === you.userId} />
          ))}
        </div>
      </div>

      {mode === "bridge" && (
        <BridgePanel
          snapshot={snapshot}
          onAcknowledge={onAcknowledge}
          onRequestExtension={onRequestExtension}
        />
      )}

      <form
        onSubmit={onSubmit}
        className="border-t-2 border-bone bg-ink px-4 py-3 md:px-6 md:py-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        {mode === "clarification" && !draft && (
          <div className="mx-auto mb-2 flex max-w-4xl gap-2 overflow-x-auto pb-1">
            {QUESTION_STARTERS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setDraft(q)}
                className="shrink-0 border border-smoke px-2 py-1 font-mono text-[11px] text-muted hover:border-gold hover:text-gold"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="mx-auto flex max-w-4xl gap-2 md:gap-3">
          <input
            className="brutal-input flex-1"
            placeholder={inputPlaceholder}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setLocalError(null);
            }}
            disabled={inputDisabled}
            maxLength={2000}
          />
          <button
            type="submit"
            className="brutal-btn brutal-btn-gold px-4 md:px-6"
            disabled={inputDisabled || !draft.trim()}
          >
            SEND
          </button>
        </div>
        {localError && (
          <p className="mx-auto mt-2 max-w-4xl font-mono text-xs text-blood">{localError}</p>
        )}
      </form>
    </div>
  );
}
