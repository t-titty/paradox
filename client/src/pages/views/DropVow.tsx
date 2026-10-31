import { useEffect, useState, type FormEvent } from "react";
import { api, errorMessage } from "../../lib/api.ts";
import { validateJustification } from "../../lib/sentence.ts";
import type { Choice, DailyTodayResponse, Paradox } from "../../lib/types.ts";
import { formatAirDate } from "../../lib/dates.ts";

interface Props {
  paradox: Paradox;
  hasVoted: boolean;
  vote: DailyTodayResponse["vote"];
  onVoted: () => void;
  testMode?: boolean;
  onSortNow?: () => void;
  /** "PARADOX #142" */
  number?: number | null;
  /** The Vow window has closed; this is a self-serve late vow. */
  late?: boolean;
}

/**
 * Phase I (Drop) and Phase II (Vow) share a page because the Drop is just
 * the brutalist reveal that frames the voting prompt. If the user has
 * already vowed, we show the locked state — no edits allowed.
 */
export function DropVow({ paradox, hasVoted, vote, onVoted, testMode, onSortNow, number, late }: Props) {
  if (hasVoted && vote) {
    return (
      <LockedVow
        paradox={paradox}
        choice={vote.choice}
        justification={vote.justification}
        testMode={testMode}
        onSortNow={onSortNow}
      />
    );
  }
  return <VowForm paradox={paradox} onVoted={onVoted} number={number} late={late} />;
}

function VowForm({
  paradox,
  onVoted,
  number,
  late,
}: {
  paradox: Paradox;
  onVoted: () => void;
  number?: number | null;
  late?: boolean;
}) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [justification, setJustification] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const check = validateJustification(justification);
  const canSubmit = choice !== null && check.valid;

  function onRequestSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setShowConfirm(true);
  }

  async function onConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/vote", {
        paradoxId: paradox.id,
        choice,
        justification: justification.trim(),
      });
      onVoted();
    } catch (e) {
      setError(errorMessage(e, "The Vow was refused."));
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10 md:gap-12 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">
          {number ? <span className="text-gold">PARADOX #{number} · </span> : null}
          {paradox.category} · {formatAirDate(paradox.airDate)}
        </p>
        {late && (
          <p className="mt-3 inline-block border border-gold px-2 py-1 font-mono text-[11px] uppercase tracking-brutal text-gold">
            LATE VOW · THE ORACLE WILL READ YOU THE MOMENT YOU SUBMIT
          </p>
        )}
        <h1 className="brutal-heading mt-3 text-4xl leading-tight text-bone md:text-6xl lg:text-7xl lg:leading-none">
          {paradox.title.toUpperCase()}
        </h1>
        {paradox.submittedBy && (
          <p className="mt-2 font-mono text-sm uppercase tracking-brutal text-gold">
            SUBMITTED BY @{paradox.submittedBy.username}
          </p>
        )}
        <p className="mt-6 max-w-3xl font-mono text-base leading-relaxed text-bone md:mt-8 md:text-lg">
          {paradox.description}
        </p>
      </header>

      <form onSubmit={onRequestSubmit} className="flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ChoiceCard
            label="A"
            text={paradox.optionA}
            selected={choice === "A"}
            onClick={() => setChoice("A")}
          />
          <ChoiceCard
            label="B"
            text={paradox.optionB}
            selected={choice === "B"}
            onClick={() => setChoice("B")}
          />
        </div>

        <div>
          <label className="brutal-heading text-sm text-muted">
            YOUR JUSTIFICATION — ONE SENTENCE
          </label>
          <textarea
            className="brutal-input mt-2 min-h-[120px] resize-none"
            placeholder="Say it in one sentence. End with . ! or ?"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            maxLength={500}
          />
          <div className="mt-2 flex items-center justify-between font-mono text-xs">
            <span className={check.valid ? "text-gold" : "text-muted"}>
              {check.valid ? "✓ ONE SENTENCE" : check.reason ?? " "}
            </span>
            <span className="text-muted">{justification.length}/500</span>
          </div>
        </div>

        {error && (
          <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{error}</p>
        )}

        <button
          type="submit"
          className="brutal-btn brutal-btn-gold self-start"
          disabled={!canSubmit || submitting}
        >
          TAKE THE VOW
        </button>
      </form>

      {showConfirm && (
        <ConfirmModal
          choice={choice!}
          choiceText={choice === "A" ? paradox.optionA : paradox.optionB}
          justification={justification.trim()}
          submitting={submitting}
          onCancel={() => setShowConfirm(false)}
          onConfirm={onConfirm}
          late={late}
        />
      )}
    </div>
  );
}

function ChoiceCard({
  label,
  text,
  selected,
  onClick,
}: {
  label: string;
  text: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`touch-manipulation border-2 p-5 text-left font-mono transition-none md:p-6 ${
        selected
          ? "border-gold bg-gold text-ink"
          : "border-bone text-bone hover:border-gold hover:text-gold"
      }`}
      style={{ minHeight: 44 }}
    >
      <div className="brutal-heading text-5xl leading-none md:text-6xl">{label}</div>
      <div className="mt-3 text-base md:mt-4 md:text-lg">{text}</div>
    </button>
  );
}

function ConfirmModal({
  choice,
  choiceText,
  justification,
  submitting,
  onCancel,
  onConfirm,
  late,
}: {
  choice: Choice;
  choiceText: string;
  justification: string;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  late?: boolean;
}) {
  // Lock background scroll while the modal is open so iOS can't rubber-band
  // the page behind it (which on short viewports pushed the action buttons
  // off-screen). Restore the prior overflow value on unmount so we don't
  // clobber any global style.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* max-h + flex-col so the content region scrolls independently and
          the action buttons stay pinned to the bottom of the card, even on
          iPhone SE (375px / short landscape). */}
      <div className="brutal-card-gold flex max-h-[90vh] w-full max-w-lg flex-col">
        <div
          className="min-h-0 flex-1 overflow-y-auto pr-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <p className="brutal-heading text-sm text-gold">ONE LAST LOOK.</p>
          <h2 className="brutal-heading mt-4 text-3xl text-bone">YOU CANNOT EDIT THIS.</h2>
          <p className="mt-3 font-mono text-sm text-muted">
            Once vowed, your justification is locked for today.{" "}
            {late
              ? "The Oracle will read it the moment you submit."
              : "The Oracle will read it when the Vow closes."}
          </p>
          <div className="mt-6 border border-smoke p-4 font-mono">
            <p className="text-xs uppercase tracking-brutal text-gold">YOUR CHOICE — {choice}</p>
            <p className="text-bone">{choiceText}</p>
            <p className="mt-4 text-xs uppercase tracking-brutal text-gold">YOUR SENTENCE</p>
            <p className="text-bone">{justification}</p>
          </div>
        </div>
        <div className="mt-4 flex shrink-0 gap-3 pt-4">
          <button onClick={onCancel} className="brutal-btn flex-1" disabled={submitting}>
            RECONSIDER
          </button>
          <button onClick={onConfirm} className="brutal-btn brutal-btn-gold flex-1" disabled={submitting}>
            {submitting ? "..." : "VOW"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LockedVow({
  paradox,
  choice,
  justification,
  testMode,
  onSortNow,
}: {
  paradox: Paradox;
  choice: Choice;
  justification: string;
  testMode?: boolean;
  onSortNow?: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 md:px-6 md:py-16">
      <div>
        <h1 className="brutal-heading text-4xl text-bone md:text-5xl lg:text-6xl">
          {paradox.title.toUpperCase()}
        </h1>
        {paradox.submittedBy && (
          <p className="mt-2 font-mono text-sm uppercase tracking-brutal text-gold">
            SUBMITTED BY @{paradox.submittedBy.username}
          </p>
        )}
      </div>
      <div className="brutal-card-gold">
        <p className="brutal-heading text-sm text-gold">YOU HAVE VOWED.</p>
        <p className="mt-2 font-mono text-xs uppercase tracking-brutal text-muted">
          CHOICE {choice} · {choice === "A" ? paradox.optionA : paradox.optionB}
        </p>
        <p className="mt-6 font-mono text-xl text-bone">"{justification}"</p>
        <p className="mt-6 border-t border-smoke pt-4 font-mono text-sm text-muted">
          The Oracle reads at noon. Return then.
        </p>
      </div>
      {testMode && onSortNow && (
        <button type="button" className="brutal-btn brutal-btn-gold self-start" onClick={onSortNow}>
          SORT ME NOW
        </button>
      )}
    </div>
  );
}
