import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";
import { formatAirDate } from "../lib/dates.ts";

interface Item {
  id: string;
  title: string;
  category: string;
  date: string;
  voteCount: number;
  submittedBy: { username: string } | null;
}

/** Public index of every dilemma that has aired. */
export function ParadoxesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(before?: string) {
    setLoading(true);
    try {
      const { data } = await api.get<{ items: Item[]; nextBefore: string | null }>("/public/paradoxes", {
        params: before ? { before } : {},
      });
      setItems((prev) => (before ? [...prev, ...data.items] : data.items));
      setNext(data.nextBefore);
    } catch (e) {
      setError(errorMessage(e, "Could not load the dilemmas."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 md:px-6 md:py-16">
      <header className="border-b-2 border-bone pb-6">
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">THE DILEMMAS</p>
        <h1 className="brutal-heading mt-3 text-5xl text-bone md:text-7xl">EVERY PARADOX SO FAR.</h1>
        <p className="mt-4 font-mono text-bone">
          One a day. See how the world split, how each moral tribe voted, and the bridges people built.
        </p>
      </header>
      {error && <p className="font-mono text-blood">{error}</p>}
      <ul className="flex flex-col">
        {items.map((p) => (
          <li key={p.id} className="border-b border-smoke">
            <Link to={`/p/${p.date}`} className="flex flex-col gap-1 py-4 hover:text-gold md:flex-row md:items-baseline md:justify-between">
              <span className="brutal-heading text-xl text-bone md:text-2xl">{p.title.toUpperCase()}</span>
              <span className="font-mono text-xs uppercase tracking-brutal text-muted">
                {formatAirDate(p.date)} · {p.category} · {p.voteCount} VOWS
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!loading && items.length === 0 && !error && (
        <p className="font-mono text-muted">The first paradox drops soon.</p>
      )}
      {next && (
        <button className="brutal-btn self-start" disabled={loading} onClick={() => load(next)}>
          {loading ? "..." : "OLDER DILEMMAS"}
        </button>
      )}
    </div>
  );
}
