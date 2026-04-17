import { useState, type FormEvent } from "react";
import { api, errorMessage } from "../../lib/api.ts";
import { validateJustification } from "../../lib/sentence.ts";
import type {
  Choice,
  Paradox,
  Shift,
  ThrowbackRevoteResponse,
  ThrowbackTodayResponse,
} from "../../lib/types.ts";

interface Props {
  state: ThrowbackTodayResponse;
  onDone: () => void;
}

/**
 * Thursday revisit. The user sees the paradox they answered ≥28 days ago
 * with their original choice and justification above, then revotes. The
 * server classifies the shift and we render the comparison.
 */
export function Throwback({ state, onDone: _onDone }: Props) {
  const [result, setResult] = useState<ThrowbackRevoteResponse | null>(null);

  if (result) {
    return <ThrowbackResult paradox={state.paradox} result={result} />;
  }

  return (
    <RevoteForm
      paradox={state.paradox}
      originalVoteId={state.originalVoteId}
      original={state.originalVote}
      onResult={setResult}
    />
  );
}

function RevoteForm({
  paradox,
  originalVoteId,
  original,
  onResult,
}: {
  paradox: Paradox;
  originalVoteId: string;
  original: ThrowbackTodayResponse["originalVote"];
  onResult: (r: ThrowbackRevoteResponse) => void;
}) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [justification, setJustification] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const check = validateJustification(justification);
  const canSubmit = choice !== null && check.valid;

  const originalDate = new Date(original.createdAt).toDateString().toUpperCase();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post<ThrowbackRevoteResponse>("/throwback", {
        originalVoteId,
        newChoice: choice,
        newJustification: justification.trim(),
      });
      onResult(data);
    } catch (e) {
      setError(errorMessage(e, "The Oracle would not record the revisit."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 md:gap-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">THROWBACK THURSDAY</p>
        <h1 className="brutal-heading mt-3 text-4xl leading-tight text-bone md:text-5xl lg:text-6xl lg:leading-none">
          {paradox.title.toUpperCase()}
        </h1>
        <p className="mt-6 max-w-3xl font-mono text-base leading-relaxed text-bone md:text-lg">
          {paradox.description}
        </p>
      </header>

      <section className="brutal-card-gold">
        <p className="brutal-heading text-sm text-gold">YOUR MIND THEN — {originalDate}</p>
        <p className="mt-3 font-mono text-xs uppercase tracking-brutal text-muted">
          CHOICE {original.choice} ·{" "}
          {original.choice === "A" ? paradox.optionA : paradox.optionB}
        </p>
        <p className="mt-4 font-mono text-xl text-bone">"{original.justification}"</p>
      </section>

      <div>
        <h2 className="brutal-heading text-3xl text-bone">YOUR MIND THEN. HAS IT CHANGED?</h2>
        <p className="mt-2 font-mono text-muted">
          Vote again. Justify again. Both moments will be preserved.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-8">
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
          {submitting ? "..." : "RENEW THE VOW"}
        </button>
      </form>
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

function ThrowbackResult({
  paradox,
  result,
}: {
  paradox: Paradox;
  result: ThrowbackRevoteResponse;
}) {
  const then = new Date(result.original.createdAt).toDateString().toUpperCase();
  const now = new Date(result.revote.createdAt).toDateString().toUpperCase();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 md:gap-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">THROWBACK THURSDAY</p>
        <h1 className="brutal-heading mt-3 text-4xl leading-tight text-bone md:text-5xl lg:text-6xl lg:leading-none">
          {paradox.title.toUpperCase()}
        </h1>
      </header>

      <ShiftVerdict shift={result.revote.shift} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <MindPanel
          label={`THEN — ${then}`}
          choice={result.original.choice}
          choiceText={
            result.original.choice === "A" ? paradox.optionA : paradox.optionB
          }
          justification={result.original.justification}
          accent="muted"
        />
        <MindPanel
          label={`NOW — ${now}`}
          choice={result.revote.newChoice}
          choiceText={
            result.revote.newChoice === "A" ? paradox.optionA : paradox.optionB
          }
          justification={result.revote.newJustification}
          accent="gold"
        />
      </div>
    </div>
  );
}

function ShiftVerdict({ shift }: { shift: Shift }) {
  const copy =
    shift === "shifted"
      ? {
          title: "YOU SHIFTED.",
          body: "A different mind came to the same question. Which one was more honest — is a question only you can answer.",
        }
      : shift === "held"
        ? {
            title: "YOU HELD.",
            body: "Same choice. Same shape of reasoning. Conviction or rut — only you know.",
          }
        : {
            title: "YOU EVOLVED.",
            body: "Same answer, different argument. The destination endured; the road changed.",
          };

  return (
    <section className="brutal-card-gold">
      <p className="brutal-heading text-sm text-gold">THE VERDICT</p>
      <h2 className="brutal-heading mt-2 text-4xl text-bone">{copy.title}</h2>
      <p className="mt-4 font-mono text-bone">{copy.body}</p>
    </section>
  );
}

function MindPanel({
  label,
  choice,
  choiceText,
  justification,
  accent,
}: {
  label: string;
  choice: Choice;
  choiceText: string;
  justification: string;
  accent: "muted" | "gold";
}) {
  const borderClass = accent === "gold" ? "border-gold" : "border-smoke";
  const labelClass = accent === "gold" ? "text-gold" : "text-muted";
  return (
    <div className={`border-2 ${borderClass} p-5`}>
      <p className={`brutal-heading text-xs ${labelClass}`}>{label}</p>
      <p className="mt-3 font-mono text-xs uppercase tracking-brutal text-muted">
        CHOICE {choice} · {choiceText}
      </p>
      <p className="mt-4 font-mono text-lg text-bone">"{justification}"</p>
    </div>
  );
}
