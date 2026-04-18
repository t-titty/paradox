import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";

interface DeepDive {
  paradoxId: string;
  paradoxTitle: string;
  category: string;
  airDate: string | null;
  title: string;
  preview: string;
  locked: boolean;
}

interface LibraryResponse {
  deepDives: DeepDive[];
  isPremium: boolean;
}

export function LibraryPage() {
  const [data, setData] = useState<LibraryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<LibraryResponse>("/library")
      .then((r) => setData(r.data))
      .catch((e) => setError(errorMessage(e, "Library unavailable.")));
  }, []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:gap-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">THE LIBRARY</p>
        <h1 className="brutal-heading mt-3 text-4xl text-bone md:text-6xl lg:text-7xl">DEEP DIVES.</h1>
        <p className="mt-6 max-w-2xl font-mono text-base text-bone md:text-lg">
          Full essays on every paradox — history, case law, the philosophers who fought over it.
          Premium only.
        </p>
        <Link to="/submit" className="brutal-btn brutal-btn-gold mt-6 inline-block">
          + SUBMIT A DILEMMA
        </Link>
        {data && !data.isPremium && (
          <div className="mt-6 border-2 border-gold p-4">
            <p className="brutal-heading text-sm text-gold">UPGRADE TO PREMIUM</p>
            <p className="mt-2 font-mono text-sm text-bone">
              Unlock every Deep Dive, unlock the Library, unlock Archive filters you didn't know
              existed. Payment flow arrives with our next ship.
            </p>
          </div>
        )}
      </header>

      {error && <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{error}</p>}

      {!data ? (
        <p className="brutal-heading text-xl text-muted">LOADING...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.deepDives.map((d) => (
            <DeepDiveCard key={d.paradoxId} dive={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function DeepDiveCard({ dive }: { dive: DeepDive }) {
  return (
    <article className={`border-2 p-5 ${dive.locked ? "border-smoke" : "border-gold"}`}>
      <p className="font-mono text-xs uppercase tracking-brutal text-muted">
        {dive.category} · {dive.airDate ? new Date(dive.airDate).toDateString().toUpperCase() : "UNAIRED"}
      </p>
      <h3 className="brutal-heading mt-2 text-2xl text-bone">{dive.paradoxTitle.toUpperCase()}</h3>
      <p className="mt-3 font-mono text-sm text-bone">{dive.preview}</p>
      <div className="mt-4 flex items-center justify-between">
        <span
          className={`font-mono text-xs uppercase tracking-brutal ${
            dive.locked ? "text-muted" : "text-gold"
          }`}
        >
          {dive.locked ? "🔒 PREMIUM" : "READ"}
        </span>
        <button
          className={dive.locked ? "brutal-btn opacity-60" : "brutal-btn brutal-btn-gold"}
          disabled={dive.locked}
        >
          {dive.locked ? "LOCKED" : "OPEN"}
        </button>
      </div>
    </article>
  );
}
