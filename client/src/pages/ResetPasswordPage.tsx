import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";

/**
 * Anonymous page. Reads ?token=... from the URL, posts it plus a new
 * password to /auth/reset-password. On success, shows a brief confirmation
 * and redirects to /login after a short pause so the user can read it.
 */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const match = newPassword.length > 0 && newPassword === confirm;
  const longEnough = newPassword.length >= 8;
  const canSubmit = match && longEnough && token.length > 0;

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => navigate("/login", { replace: true }), 2500);
    return () => clearTimeout(t);
  }, [done, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      setDone(true);
    } catch (err) {
      setError(
        errorMessage(err, "Could not reset password. The link may have expired."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 md:px-6 md:py-16">
        <p className="font-mono text-xs uppercase tracking-brutal text-blood">
          MISSING TOKEN
        </p>
        <h1 className="brutal-heading text-4xl text-bone md:text-5xl">
          BAD LINK.
        </h1>
        <p className="font-mono text-sm text-bone">
          This reset link is missing its token. Request a new one.
        </p>
        <Link
          to="/forgot-password"
          className="brutal-btn brutal-btn-gold self-start"
        >
          REQUEST NEW LINK
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 md:px-6 md:py-16">
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">
          PASSWORD RESET
        </p>
        <h1 className="brutal-heading text-4xl text-bone md:text-5xl">DONE.</h1>
        <div className="border-2 border-gold p-4">
          <p className="brutal-heading text-sm text-gold">SUCCESS.</p>
          <p className="mt-2 font-mono text-sm text-bone">
            Your password has been reset. Redirecting to login…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 md:px-6 md:py-16">
      <p className="font-mono text-xs uppercase tracking-brutal text-gold">
        RESET PASSWORD
      </p>
      <h1 className="brutal-heading text-4xl text-bone md:text-5xl">
        NEW PASSWORD.
      </h1>
      <p className="font-mono text-sm uppercase tracking-brutal text-white">
        Minimum 8 characters. Must match.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input
          className="brutal-input placeholder:text-[#CCCCCC]"
          type="password"
          placeholder="NEW PASSWORD"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          autoFocus
        />
        <input
          className="brutal-input placeholder:text-[#CCCCCC]"
          type="password"
          placeholder="CONFIRM PASSWORD"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
        />
        <div className="font-mono text-xs uppercase tracking-brutal">
          <span className={longEnough ? "text-gold" : "text-muted"}>
            {longEnough ? "✓ LONG ENOUGH" : "≥ 8 CHARACTERS"}
          </span>
          <span className="mx-3 text-muted">·</span>
          <span
            className={
              confirm.length === 0
                ? "text-muted"
                : match
                  ? "text-gold"
                  : "text-blood"
            }
          >
            {confirm.length === 0
              ? "MUST MATCH"
              : match
                ? "✓ MATCH"
                : "DOES NOT MATCH"}
          </span>
        </div>
        {error && (
          <p className="border-2 border-blood p-3 font-mono text-sm text-blood">
            {error}
          </p>
        )}
        <button
          className="brutal-btn brutal-btn-gold"
          disabled={!canSubmit || submitting}
        >
          {submitting ? "..." : "RESET PASSWORD"}
        </button>
      </form>
      <Link
        to="/login"
        className="font-mono text-xs uppercase tracking-brutal text-muted hover:text-bone self-start"
      >
        ← BACK TO LOGIN
      </Link>
    </div>
  );
}
