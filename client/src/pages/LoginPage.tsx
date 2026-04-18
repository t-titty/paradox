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
    <div className="flex flex-col">
      {/* Login form — constrained width. */}
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 md:px-6 md:py-16">
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

      {/* Full-bleed "WHAT IS PARADOX" section. */}
      <section className="border-t-2 border-bone bg-ink">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:px-6 md:py-24">
          <header className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-brutal text-gold">WHAT IS PARADOX?</p>
            <h2 className="brutal-heading mt-3 text-4xl text-bone md:text-6xl lg:text-7xl">
              A DAILY TEST OF HOW YOU THINK.
            </h2>
            <p className="mt-6 font-mono text-base text-bone md:text-lg">
              Every day, one ethical dilemma. You vote in one sentence — no edits. An AI sorts
              everyone into one of seven moral tribes based on how you argued. Then you get paired
              with someone from the opposite tribe for a ten-minute debate. At the end, the AI
              drafts a synthesis of your two positions; if you both sign it, it enters the public
              archive forever.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FeatureBlock
              label="I"
              title="THE DROP"
              body="A new paradox goes live at midnight. Read it, feel it, and prepare to vote."
            />
            <FeatureBlock
              label="II"
              title="THE VOW"
              body="One sentence. No editing. Commit your choice and your reason."
            />
            <FeatureBlock
              label="III"
              title="THE SORT"
              body="The Oracle reads your justification and assigns you to one of seven tribes."
            />
            <FeatureBlock
              label="IV"
              title="THE DUEL"
              body="Ten minutes with someone from the opposite tribe. Defend. Listen. Synthesize."
            />
          </div>

          <div className="border-2 border-gold p-5 md:p-6">
            <p className="brutal-heading text-sm text-gold">THE BRIDGE</p>
            <p className="mt-2 font-mono text-sm text-bone md:text-base">
              When both of you sign the synthesis, it goes into the permanent archive — a record
              of two opposed tribes finding common ground. Your moral constellation grows every
              time you vote, duel, and sign.
            </p>
          </div>
        </div>
      </section>

      {/* Footer with Terms link. */}
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

function FeatureBlock({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <article className="border-2 border-bone p-5">
      <p className="brutal-heading text-xs text-gold">{label}</p>
      <h3 className="brutal-heading mt-2 text-2xl text-bone">{title}</h3>
      <p className="mt-3 font-mono text-sm text-bone">{body}</p>
    </article>
  );
}
