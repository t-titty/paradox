import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.ts";
import type { PublicDay } from "../lib/types.ts";
import { TRIBE_LABEL } from "../lib/tribes.ts";

/**
 * "Last time on PARADOX": the most recent day with revealed results — how
 * the world split, the best signed bridges and the sharpest Gold Star moves.
 * Anonymous by design; shown overnight and on the public pages.
 */
export function HighlightsPanel({ title = "LAST NIGHT IN THE ARENA" }: { title?: string }) {
  const [day, setDay] = useState<PublicDay | null>(null);

  useEffect(() => {
    api
      .get<{ day: PublicDay | null }>("/public/highlights")
      .then(({ data }) => setDay(data.day))
      .catch(() => setDay(null));
  }, []);

  if (!day || !day.resultsOpen || !day.results || day.results.totalVotes === 0) return null;
  const r = day.results;
  const aPct = Math.round((r.choiceCounts.A / Math.max(1, r.totalVotes)) * 100);

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-12 md:px-6">
      <div className="border-2 border-smoke p-5 md:p-6">
        <p className="brutal-heading text-sm text-gold">{title}</p>
        <Link to={`/p/${day.date}`} className="brutal-heading mt-3 block text-2xl text-bone hover:text-gold md:text-3xl">
          {day.number ? `#${day.number} · ` : ""}
          {day.paradox.title.toUpperCase()}
        </Link>
        <p className="mt-3 font-mono text-sm text-bone">
          {aPct}% chose A · {100 - aPct}% chose B · {r.totalVotes} vows
        </p>
      </div>

      {day.syntheses && day.syntheses.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="brutal-heading text-xs text-muted">BRIDGES THAT STOOD</p>
          {day.syntheses.map((s) => (
            <blockquote key={s.id} className="border-l-2 border-gold pl-4 font-mono text-sm text-bone">
              "{s.synthesisText}"
              <footer className="mt-1 text-xs uppercase tracking-brutal text-muted">
                {TRIBE_LABEL[s.tribeA]} × {TRIBE_LABEL[s.tribeB]}
              </footer>
            </blockquote>
          ))}
        </div>
      )}

      {day.goldStars && day.goldStars.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="brutal-heading text-xs text-muted">★ GOLD STAR MOVES</p>
          {day.goldStars.map((g) => (
            <div key={g.id} className="border border-smoke p-4">
              <p className="font-mono text-sm text-bone">"{g.messageText}"</p>
              <p className="mt-2 font-mono text-xs text-gold">ORACLE: {g.explanation}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-brutal text-muted">
                A {TRIBE_LABEL[g.tribe]}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
