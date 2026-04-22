import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";

/**
 * Anonymous page. Always shows the same confirmation message regardless of
 * whether the email is registered — the server intentionally leaks no
 * signal either, so the client shouldn't either.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, "Could not submit request."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 md:px-6 md:py-16">
      <p className="font-mono text-xs uppercase tracking-brutal text-gold">
        RESET PASSWORD
      </p>
      <h1 className="brutal-heading text-4xl text-bone md:text-5xl">
        FORGOT YOUR PASSWORD.
      </h1>

      {sent ? (
        <>
          <div className="border-2 border-gold p-4">
            <p className="brutal-heading text-sm text-gold">REQUEST RECEIVED.</p>
            <p className="mt-2 font-mono text-sm text-bone">
              If that email exists you'll receive a reset link shortly. The
              link expires in 1 hour.
            </p>
          </div>
          <Link
            to="/login"
            className="brutal-btn brutal-btn-gold self-start"
          >
            ← BACK TO LOGIN
          </Link>
        </>
      ) : (
        <>
          <p className="font-mono text-sm uppercase tracking-brutal text-white">
            Enter your email. We'll send a reset link.
          </p>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <input
              className="brutal-input placeholder:text-[#CCCCCC]"
              type="email"
              placeholder="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              maxLength={200}
              autoFocus
            />
            {error && (
              <p className="border-2 border-blood p-3 font-mono text-sm text-blood">
                {error}
              </p>
            )}
            <button
              className="brutal-btn brutal-btn-gold"
              disabled={submitting}
            >
              {submitting ? "..." : "SEND RESET LINK"}
            </button>
          </form>
          <Link
            to="/login"
            className="font-mono text-xs uppercase tracking-brutal text-muted hover:text-bone self-start"
          >
            ← BACK TO LOGIN
          </Link>
        </>
      )}
    </div>
  );
}
