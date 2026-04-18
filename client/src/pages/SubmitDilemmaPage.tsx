import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";

export function SubmitDilemmaPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [category, setCategory] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      await api.post("/submissions", {
        title: title.trim(),
        description: description.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        category: category.trim(),
        reason: reason.trim(),
      });
      setSubmitted(true);
    } catch (e) {
      setErr(errorMessage(e, "Could not submit."));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 md:px-6 md:py-24">
        <div className="brutal-card-gold">
          <p className="brutal-heading text-sm text-gold">SUBMITTED.</p>
          <h1 className="brutal-heading mt-3 text-3xl text-bone md:text-4xl">
            YOUR DILEMMA IS IN THE QUEUE.
          </h1>
          <p className="mt-4 font-mono text-bone">
            An admin will review it. If approved, it'll air on a future day — and you'll get to
            watch the tribes tear it apart.
          </p>
          <div className="mt-6 flex gap-2">
            <button
              className="brutal-btn brutal-btn-gold"
              onClick={() => {
                setSubmitted(false);
                setTitle("");
                setDescription("");
                setOptionA("");
                setOptionB("");
                setCategory("");
                setReason("");
              }}
            >
              SUBMIT ANOTHER
            </button>
            <Link to="/library" className="brutal-btn">
              BACK TO LIBRARY
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">SUBMIT A DILEMMA</p>
        <h1 className="brutal-heading mt-3 text-4xl text-bone md:text-6xl lg:text-7xl">
          PROPOSE A PARADOX.
        </h1>
        <p className="mt-6 max-w-2xl font-mono text-base text-bone md:text-lg">
          The best paradoxes are forced choices with no clean winner. Both sides must have real
          moral weight. Make us sweat.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="TITLE">
          <input
            className="brutal-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={2}
            maxLength={200}
            placeholder="THE TROLLEY, REWRITTEN."
          />
        </Field>

        <Field label="DESCRIPTION">
          <textarea
            className="brutal-input min-h-[120px] resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            maxLength={2000}
            placeholder="SET THE SCENE. WHAT IS AT STAKE?"
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="OPTION A">
            <input
              className="brutal-input"
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              required
              maxLength={500}
              placeholder="ONE PATH."
            />
          </Field>
          <Field label="OPTION B">
            <input
              className="brutal-input"
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              required
              maxLength={500}
              placeholder="THE OTHER."
            />
          </Field>
        </div>

        <Field label="CATEGORY">
          <input
            className="brutal-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            minLength={2}
            maxLength={80}
            placeholder="JUSTICE · LOYALTY · AUTONOMY · ETC."
          />
        </Field>

        <Field label="WHY IS THIS A GOOD PARADOX?">
          <textarea
            className="brutal-input min-h-[120px] resize-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={10}
            maxLength={1000}
            placeholder="WHAT MAKES IT IRRESOLVABLE? WHAT DOES EACH SIDE COST?"
          />
        </Field>

        {err && <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{err}</p>}

        <button className="brutal-btn brutal-btn-gold self-start" disabled={submitting}>
          {submitting ? "..." : "SUBMIT FOR REVIEW"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="brutal-heading text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}
