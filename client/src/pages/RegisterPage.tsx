import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Defensive: the button is disabled when !agreed, but double-check here
    // so a bypassed disabled attribute can't skip the ToS requirement.
    if (!agreed) {
      setError("You must agree to the Terms of Service to register.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register(username.trim(), email.trim().toLowerCase(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 md:px-6 md:py-16">
        <h1 className="brutal-heading text-4xl text-bone md:text-5xl">BEGIN.</h1>
        <p className="font-mono text-sm uppercase tracking-brutal text-white">
          Claim a handle. You will be judged by your reasoning, not your name.
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input
            className="brutal-input placeholder:text-[#CCCCCC]"
            placeholder="USERNAME (3-24 CHARS, a-z A-Z 0-9 _)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            pattern="[a-zA-Z0-9_]{3,24}"
            required
          />
          <input
            className="brutal-input placeholder:text-[#CCCCCC]"
            type="email"
            placeholder="EMAIL"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="brutal-input placeholder:text-[#CCCCCC]"
            type="password"
            placeholder="PASSWORD (8+ CHARS)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          <label className="flex cursor-pointer items-start gap-3 font-mono text-sm text-bone">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-gold"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              I agree to the{" "}
              <Link to="/terms" target="_blank" className="text-gold hover:text-bone">
                Terms of Service
              </Link>
              .
            </span>
          </label>

          {error && (
            <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{error}</p>
          )}
          <button className="brutal-btn brutal-btn-gold" disabled={submitting || !agreed}>
            {submitting ? "..." : "REGISTER"}
          </button>
        </form>
        <p className="font-mono text-sm text-white">
          Have an account?{" "}
          <Link to="/login" className="text-gold hover:text-bone">
            LOGIN
          </Link>
        </p>
      </div>

      <footer className="border-t-2 border-smoke">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 font-mono text-xs uppercase tracking-brutal text-muted md:flex-row md:px-6">
          <span>PARADOX · THINK HARDER.</span>
          <Link to="/terms" className="text-muted hover:text-gold">
            TERMS OF SERVICE
          </Link>
        </div>
      </footer>
    </div>
  );
}
