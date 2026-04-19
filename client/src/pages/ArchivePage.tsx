import { useEffect, useState } from "react";
import { api, errorMessage } from "../lib/api.ts";
import type { Tribe } from "../lib/types.ts";

interface ArchiveEntry {
  id: string;
  paradoxTitle: string;
  tribeA: Tribe;
  tribeB: Tribe;
  synthesisText: string;
  signedAt: string;
  submittedBy: { username: string } | null;
}

interface Facets {
  paradoxTitles: { title: string; count: number }[];
  tribePairs: { tribeA: Tribe; tribeB: Tribe; count: number }[];
}

interface ArchiveResponse {
  entries: ArchiveEntry[];
  nextCursor: string | null;
  facets: Facets;
}

const TRIBES_ALL: Tribe[] = [
  "Utilitarian",
  "Deontologist",
  "VirtueEthicist",
  "Nihilist",
  "Stoic",
  "Existentialist",
  "Hedonist",
];

/**
 * The Global Archive — public, no auth. Signed Synthesis Statements, newest
 * first, filterable by paradox title and by tribe pair (order-agnostic).
 */
export function ArchivePage() {
  const [paradoxFilter, setParadoxFilter] = useState<string>("");
  const [tribeAFilter, setTribeAFilter] = useState<Tribe | "">("");
  const [tribeBFilter, setTribeBFilter] = useState<Tribe | "">("");

  const [data, setData] = useState<ArchiveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: Record<string, string> = {};
    if (paradoxFilter) params.paradox = paradoxFilter;
    if (tribeAFilter) params.tribeA = tribeAFilter;
    if (tribeBFilter) params.tribeB = tribeBFilter;

    api
      .get<ArchiveResponse>("/archive", { params })
      .then((r) => {
        if (!cancelled) {
          setData(r.data);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e, "Archive unavailable."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paradoxFilter, tribeAFilter, tribeBFilter]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:gap-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">GLOBAL ARCHIVE</p>
        <h1 className="brutal-heading mt-3 text-4xl text-bone md:text-6xl lg:text-7xl">
          SIGNED BRIDGES.
        </h1>
        <p className="mt-6 max-w-2xl font-mono text-base text-bone md:text-lg">
          Every Synthesis Statement ever signed by both duelists. Public, searchable, permanent.
        </p>
      </header>

      <section className="flex flex-col gap-3 md:grid md:grid-cols-3">
        <Select
          label="PARADOX"
          value={paradoxFilter}
          options={[
            { value: "", label: "ALL" },
            ...(data?.facets.paradoxTitles ?? []).map((p) => ({
              value: p.title,
              label: `${p.title} (${p.count})`,
            })),
          ]}
          onChange={setParadoxFilter}
        />
        <Select
          label="TRIBE A"
          value={tribeAFilter}
          options={[
            { value: "", label: "ANY" },
            ...TRIBES_ALL.map((t) => ({ value: t, label: t.toUpperCase() })),
          ]}
          onChange={(v) => setTribeAFilter(v as Tribe | "")}
        />
        <Select
          label="TRIBE B"
          value={tribeBFilter}
          options={[
            { value: "", label: "ANY" },
            ...TRIBES_ALL.map((t) => ({ value: t, label: t.toUpperCase() })),
          ]}
          onChange={(v) => setTribeBFilter(v as Tribe | "")}
        />
      </section>

      {error && <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{error}</p>}

      {loading ? (
        <p className="brutal-heading text-xl text-muted">LOADING...</p>
      ) : data && data.entries.length === 0 ? (
        <div className="brutal-card">
          <p className="brutal-heading text-sm text-gold">THE ARCHIVE IS QUIET.</p>
          <p className="mt-3 font-mono text-bone">
            {paradoxFilter || tribeAFilter || tribeBFilter
              ? "No signed syntheses match your filters."
              : "No one has signed a Synthesis yet. Be the first."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {data?.entries.map((entry) => (
            <ArchiveCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="brutal-heading text-xs text-muted">{label}</span>
      <select
        className="brutal-input appearance-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink text-bone">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ArchiveCard({ entry }: { entry: ArchiveEntry }) {
  const date = new Date(entry.signedAt);
  return (
    <article className="border-2 border-bone p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs uppercase tracking-brutal">
        <span className="flex flex-wrap items-baseline gap-3">
          <span className="text-gold">{entry.paradoxTitle}</span>
          {entry.submittedBy && (
            <span className="text-gold">
              · SUBMITTED BY @{entry.submittedBy.username}
            </span>
          )}
        </span>
        <span className="text-muted">
          {entry.tribeA.toUpperCase()} <span className="text-muted">↔</span>{" "}
          {entry.tribeB.toUpperCase()} · {date.toDateString().toUpperCase()}
        </span>
      </div>
      <p className="mt-4 font-mono text-lg leading-relaxed text-bone">"{entry.synthesisText}"</p>
    </article>
  );
}
