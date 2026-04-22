import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";

/**
 * /party landing — Party Mode hub. Auth is already guaranteed by the
 * <ProtectedRoute> wrapper in App.tsx, so we just need to render the entry
 * UI. The live Colosseum flow (lobby, cast, vote, reveal) isn't wired up
 * yet; this page holds the CTA and a brief explanation until those slices
 * land.
 */
export function PartyPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 md:gap-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">
          THE COLOSSEUM
        </p>
        <h1 className="brutal-heading mt-3 text-5xl text-bone md:text-7xl">
          THE COLOSSEUM.
        </h1>
        <p className="mt-4 max-w-2xl font-mono text-base text-bone md:text-lg">
          Cast the dilemma to your TV. Vote on your phones. Debate in person.
          A live party game running on PARADOX.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="border-2 border-bone p-4 md:p-5">
          <p className="brutal-heading text-xs text-gold">COLOSSEUM BASIC — $9.99/MO</p>
          <p className="mt-2 font-mono text-sm text-bone">
            1-hour free trial, no card. Then $9.99/month for unlimited games.
            Up to 8 players per game. Standard paradox pack.
          </p>
        </article>
        <article className="border-2 border-gold p-4 md:p-5">
          <p className="brutal-heading text-xs text-gold">COLOSSEUM PRO — $29.99/MO</p>
          <p className="mt-2 font-mono text-sm text-bone">
            1-hour free trial, no card. Then $29.99/month for unlimited games.
            Up to 25 players per game. All paradox packs. Full game history
            saved to your profile.
          </p>
        </article>
      </section>

      <p className="font-mono text-xs uppercase tracking-brutal text-muted">
        One free trial per account — Basic and Pro share a single 1-hour trial.
      </p>

      <div className="border-2 border-bone p-5 md:p-6">
        <p className="brutal-heading text-sm text-gold">COMING SOON.</p>
        <p className="mt-2 font-mono text-sm text-bone md:text-base">
          The Colosseum goes live soon. When it does,{" "}
          <span className="text-bone">{user?.username}</span> will be able to
          start a game here, share a 6-char room code, and cast the live
          board to any TV.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/pricing" className="brutal-btn">
            VIEW PRICING
          </Link>
          <Link to="/how-to-play" className="brutal-btn">
            HOW IT WORKS
          </Link>
        </div>
      </div>
    </div>
  );
}
