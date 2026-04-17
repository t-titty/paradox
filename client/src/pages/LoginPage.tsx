import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10 md:px-6 md:py-16">
      <h1 className="brutal-heading text-4xl text-bone md:text-5xl">ENTER.</h1>
      <p className="font-mono text-sm uppercase tracking-brutal text-white">
        Username or email. Password. That is all.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input
          className="brutal-input placeholder:text-[#CCCCCC]"
          placeholder="USERNAME OR EMAIL"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          className="brutal-input placeholder:text-[#CCCCCC]"
          type="password"
          placeholder="PASSWORD"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && (
          <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{error}</p>
        )}
        <button className="brutal-btn brutal-btn-gold" disabled={submitting}>
          {submitting ? "..." : "LOGIN"}
        </button>
      </form>
      <p className="font-mono text-sm text-white">
        No account?{" "}
        <Link to="/register" className="text-gold hover:text-bone">
          REGISTER
        </Link>
      </p>
    </div>
  );
}
