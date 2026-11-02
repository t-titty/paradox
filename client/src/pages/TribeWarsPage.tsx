import { useEffect, useState } from "react";
import { api, errorMessage } from "../lib/api.ts";
import type { TribeWarsRow } from "../lib/types.ts";
import { TRIBE_CREED, TRIBE_GLYPH, TRIBE_LABEL } from "../lib/tribes.ts";
import { formatAirDate } from "../lib/dates.ts";

interface Response {
  weekStart: string;
  standings: TribeWarsRow[];
  lastWeekWinner: TribeWarsRow | null;
}

/** Weekly tribe leaderboard — public. */
export function TribeWarsPage() {
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Response>("/public/tribe-wars")
      .then(({ data }) => setData(data))
      .catch((e) => setError(errorMessage(e, "Could not load Tribe Wars.")));
  }, []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 md:px-6 md:py-16">
      <header className="border-b-2 border-bone pb-6">
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">
          TRIBE WARS {data ? `· WEEK OF ${formatAirDate(data.weekStart)}` : ""}
        </p>
        <h1 className="brutal-heading mt-3 text-5xl text-bone md:text-7xl">WHICH TRIBE ARGUES BEST?</h1>
        <p className="mt-4 font-mono text-sm text-bone">
          Score per member this week: Gold Stars ×3, signed Syntheses ×10, Red Flags ×−2. Bigger tribes don't win
          by size — they win by arguing well. Resets every Monday.
        </p>
      </header>
      {error && <p className="font-mono text-blood">{error}</p>}
      {data?.lastWeekWinner && (
        <p className="border border-gold p-3 font-mono text-sm text-gold">
          LAST WEEK'S CHAMPIONS: {TRIBE_LABEL[data.lastWeekWinner.tribe]} {TRIBE_GLYPH[data.lastWeekWinner.tribe]}
        </p>
      )}
      <ol className="flex flex-col gap-3">
        {data?.standings.map((row, i) => (
          <li key={row.tribe} className={`border-2 p-4 ${i === 0 && row.members > 0 ? "border-gold" : "border-smoke"}`}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="brutal-heading text-xl text-bone md:text-2xl">
                <span className="text-gold">{i + 1}.</span> {TRIBE_LABEL[row.tribe]} {TRIBE_GLYPH[row.tribe]}
              </span>
              <span className="brutal-heading text-2xl text-gold">{row.score}</span>
            </div>
            <p className="mt-1 font-mono text-xs text-muted">{TRIBE_CREED[row.tribe]}</p>
            <p className="mt-2 font-mono text-xs uppercase tracking-brutal text-bone">
              {row.members} MEMBERS · ★ {row.goldStars} · BRIDGES {row.syntheses} · ⚑ {row.redFlags}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
