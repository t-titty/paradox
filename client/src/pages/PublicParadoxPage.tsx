import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";
import type { PublicDay } from "../lib/types.ts";
import { formatAirDate } from "../lib/dates.ts";
import { TRIBE_LABEL, TRIBE_ORDER } from "../lib/tribes.ts";
import { useAuth } from "../context/AuthContext.tsx";

/**
 * Public page for one day's paradox — the landing page for shared links.
 * Shows the dilemma, and once its Vow has closed: the vote split, how each
 * tribe voted, signed bridges and Gold Star moves.
 */
export function PublicParadoxPage() {
  const { date = "" } = useParams();
  const { user } = useAuth();
  const [day, setDay] = useState<PublicDay | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDay(null);
    setError(null);
    api
      .get<PublicDay>(`/public/paradox/${date}`)
      .then(({ data }) => setDay(data))
      .catch((e) => setError(errorMessage(e, "This paradox hasn't aired.")));
  }, [date]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="brutal-heading text-3xl text-bone">NOT YET.</p>
        <p className="mt-3 font-mono text-muted">{error}</p>
        <Link to="/paradoxes" className="brutal-btn mt-6 inline-block">
          ALL DILEMMAS
        </Link>
      </div>
    );
  }
  if (!day) return <p className="p-16 text-center font-mono text-muted">LOADING...</p>;

  const r = day.results;
  const aPct = r && r.totalVotes > 0 ? Math.round((r.choiceCounts.A / r.totalVotes) * 100) : 0;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">
          PARADOX {day.number ? `#${day.number}` : ""} · {formatAirDate(day.date)} · {day.paradox.category}
        </p>
        <h1 className="brutal-heading mt-3 text-4xl leading-tight text-bone md:text-6xl">
          {day.paradox.title.toUpperCase()}
        </h1>
        {day.paradox.submittedBy && (
          <p className="mt-2 font-mono text-sm uppercase tracking-brutal text-gold">
            SUBMITTED BY @{day.paradox.submittedBy.username}
          </p>
        )}
        <p className="mt-6 font-mono text-base leading-relaxed text-bone md:text-lg">{day.paradox.description}</p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="border-2 border-bone p-4 font-mono text-bone">
            <span className="brutal-heading text-3xl">A</span> · {day.paradox.optionA}
            {r && <p className="mt-2 text-gold">{aPct}%</p>}
          </div>
          <div className="border-2 border-bone p-4 font-mono text-bone">
            <span className="brutal-heading text-3xl">B</span> · {day.paradox.optionB}
            {r && <p className="mt-2 text-gold">{100 - aPct}%</p>}
          </div>
        </div>
      </header>

      {!day.resultsOpen && (
        <div className="brutal-card-gold">
          <p className="brutal-heading text-sm text-gold">THE VOW IS OPEN</p>
          <p className="mt-2 font-mono text-bone">Results stay sealed until the Vow closes. Take a side first.</p>
          <Link to={user ? "/" : "/register"} className="brutal-btn brutal-btn-gold mt-4 inline-block">
            {user ? "TAKE THE VOW →" : "PLAY TODAY'S PARADOX →"}
          </Link>
        </div>
      )}

      {r && (
        <section>
          <h2 className="brutal-heading text-sm text-muted">HOW EACH TRIBE VOTED · {r.totalVotes} VOWS</h2>
          <div className="mt-4 flex flex-col gap-2">
            {TRIBE_ORDER.map((t) => {
              const s = r.tribeChoice[t];
              const n = s.A + s.B;
              const pa = n > 0 ? Math.round((s.A / n) * 100) : 0;
              return (
                <div key={t} className="flex items-center gap-3">
                  <span className="w-40 font-mono text-xs uppercase tracking-brutal text-bone">{TRIBE_LABEL[t]}</span>
                  <div className="flex h-4 flex-1 border border-smoke">
                    {n > 0 && (
                      <>
                        <div className="bg-gold" style={{ width: `${pa}%` }} />
                        <div className="bg-smoke" style={{ width: `${100 - pa}%` }} />
                      </>
                    )}
                  </div>
                  <span className="w-28 text-right font-mono text-xs text-muted">
                    {n > 0 ? `A ${pa}% · B ${100 - pa}%` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {day.syntheses && day.syntheses.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="brutal-heading text-sm text-muted">BRIDGES THAT STOOD</h2>
          {day.syntheses.map((s) => (
            <blockquote key={s.id} className="border-l-2 border-gold pl-4 font-mono text-bone">
              "{s.synthesisText}"
              <footer className="mt-1 text-xs uppercase tracking-brutal text-muted">
                SIGNED BY A {TRIBE_LABEL[s.tribeA]} AND A {TRIBE_LABEL[s.tribeB]}
              </footer>
            </blockquote>
          ))}
        </section>
      )}

      {day.goldStars && day.goldStars.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="brutal-heading text-sm text-muted">★ GOLD STAR MOVES</h2>
          {day.goldStars.map((g) => (
            <div key={g.id} className="border border-smoke p-4 font-mono">
              <p className="text-bone">"{g.messageText}"</p>
              <p className="mt-2 text-xs text-gold">ORACLE: {g.explanation}</p>
            </div>
          ))}
        </section>
      )}

      {!user && (
        <div className="border-2 border-bone p-6">
          <p className="brutal-heading text-2xl text-bone">WHERE WOULD YOU STAND?</p>
          <p className="mt-2 font-mono text-bone">
            A new dilemma every day. One sentence. Seven moral tribes. A live duel with your opposite.
          </p>
          <Link to="/register" className="brutal-btn brutal-btn-gold mt-4 inline-block">
            PLAY PARADOX — FREE
          </Link>
        </div>
      )}
    </div>
  );
}
