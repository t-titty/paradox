import { useState, type FormEvent } from "react";
import { api, errorMessage } from "../lib/api.ts";

/**
 * Private Circles application stub. Collects organization + contact and
 * logs it to the DB for manual follow-up. No admin UI yet.
 */
export function CirclesPage() {
  const [organization, setOrganization] = useState("");
  const [kind, setKind] = useState<
    "JUNIOR_HIGH" | "HIGH_SCHOOL" | "UNIVERSITY" | "COMPANY"
  >("UNIVERSITY");
  const [contactEmail, setContactEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/circles/apply", {
        organization: organization.trim(),
        kind,
        contactEmail: contactEmail.trim().toLowerCase(),
        note: note.trim() || undefined,
      });
      setSubmitted(true);
    } catch (e) {
      setError(errorMessage(e, "Could not submit."));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 md:px-6 md:py-24">
        <div className="brutal-card-gold">
          <p className="brutal-heading text-sm text-gold">APPLICATION RECEIVED.</p>
          <h1 className="brutal-heading mt-3 text-3xl text-bone md:text-4xl">WE WILL REACH OUT.</h1>
          <p className="mt-4 font-mono text-bone">
            Private Circles are reviewed individually. Expect a response within a week.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">PRIVATE CIRCLES</p>
        <h1 className="brutal-heading mt-3 text-4xl text-bone md:text-6xl lg:text-7xl">
          BRING PARADOX IN-HOUSE.
        </h1>
        <p className="mt-6 max-w-2xl font-mono text-base text-bone md:text-lg">
          A closed PARADOX instance for your university seminar, your ethics committee, your
          design team. Your own paradoxes. Your own archive.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="brutal-heading text-xs text-muted">ORGANIZATION</span>
          <input
            className="brutal-input"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="STANFORD LAW · ACME ETHICS · ETC."
            required
            minLength={2}
            maxLength={120}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="brutal-heading text-xs text-muted">KIND</span>
          <select
            className="brutal-input appearance-none"
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            <option className="bg-ink text-bone" value="JUNIOR_HIGH">
              Jr. High School
            </option>
            <option className="bg-ink text-bone" value="HIGH_SCHOOL">
              High School
            </option>
            <option className="bg-ink text-bone" value="UNIVERSITY">
              University
            </option>
            <option className="bg-ink text-bone" value="COMPANY">
              Company / Organization
            </option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="brutal-heading text-xs text-muted">CONTACT EMAIL</span>
          <input
            className="brutal-input"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="brutal-heading text-xs text-muted">WHY (OPTIONAL)</span>
          <textarea
            className="brutal-input min-h-[120px] resize-none"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            placeholder="TELL US THE USE CASE."
          />
        </label>

        {error && <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{error}</p>}

        <button className="brutal-btn brutal-btn-gold self-start" disabled={submitting}>
          {submitting ? "..." : "APPLY"}
        </button>
      </form>
    </div>
  );
}
