import { useState, type FormEvent } from "react";
import { api, errorMessage } from "../lib/api.ts";

type Category = "bug" | "feature" | "general";

export function FeedbackPage() {
  const [category, setCategory] = useState<Category>("bug");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      await api.post("/feedback", { category, message: message.trim() });
      setSubmitted(true);
    } catch (e) {
      setErr(errorMessage(e, "Could not submit feedback."));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 md:px-6 md:py-24">
        <div className="brutal-card-gold">
          <p className="brutal-heading text-sm text-gold">FEEDBACK RECEIVED.</p>
          <h1 className="brutal-heading mt-3 text-3xl text-bone md:text-4xl">THANK YOU.</h1>
          <p className="mt-4 font-mono text-bone">
            Every note is read. If it requires a reply, we'll reach out via the email on your
            account.
          </p>
          <button
            className="brutal-btn brutal-btn-gold mt-6"
            onClick={() => {
              setSubmitted(false);
              setMessage("");
              setCategory("bug");
            }}
          >
            SEND ANOTHER
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">FEEDBACK</p>
        <h1 className="brutal-heading mt-3 text-4xl text-bone md:text-6xl lg:text-7xl">
          TELL US.
        </h1>
        <p className="mt-6 max-w-2xl font-mono text-base text-bone md:text-lg">
          Bug? Feature idea? Unhinged rant about a category we got wrong? Send it. Brief is fine.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="brutal-heading text-xs text-muted">CATEGORY</span>
          <select
            className="brutal-input appearance-none"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            <option className="bg-ink text-bone" value="bug">BUG REPORT</option>
            <option className="bg-ink text-bone" value="feature">FEATURE REQUEST</option>
            <option className="bg-ink text-bone" value="general">GENERAL FEEDBACK</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="brutal-heading text-xs text-muted">MESSAGE</span>
          <textarea
            className="brutal-input min-h-[180px] resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={3}
            maxLength={2000}
            placeholder="WHAT'S ON YOUR MIND."
          />
        </label>

        {err && <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{err}</p>}

        <button className="brutal-btn brutal-btn-gold self-start" disabled={submitting}>
          {submitting ? "..." : "SUBMIT"}
        </button>
      </form>
    </div>
  );
}
