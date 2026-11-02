import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";

interface Books {
  month: string;
  isCurrentMonth: boolean;
  ai: { totalCents: number; calls: number; byRole: { role: string; cents: number; calls: number }[]; models: string[] };
  fixed: { totalCents: number; items: { category: string; label: string; amountCents: number }[] };
  stripeFeesCents: number;
  revenue: {
    grossCents: number;
    refundsCents: number;
    netCents: number;
    bySource: Record<"supporters" | "circles" | "colosseum" | "other", number>;
    feesEstimated: boolean;
  };
  totals: { costsCents: number; profitCents: number };
  players: { active: number; supportersNow: number };
  perActivePlayerCents: number | null;
  breakEvenSupporters: number;
  perDollar: { label: string; cents: number }[] | null;
}

interface Plan {
  key: string;
  billing: "monthly" | "annual";
  amountUsd: number;
  label: string;
  stripeFeeCents: number;
}

interface Response {
  books: Books;
  months: string[];
  plans: Plan[];
}

const ROLE_LABEL: Record<string, string> = {
  sort: "Sorting vows into tribes",
  fallacy: "Refereeing duels (fallacy checks)",
  synthesis: "Writing Syntheses",
  spar: "AI sparring partner",
};

const CATEGORY_LABEL: Record<string, string> = {
  hosting: "Servers",
  database: "Database",
  email: "Email",
  domain: "Domain name",
  tools: "Tools & services",
  other: "Other",
};

const SOURCE_LABEL: Record<string, string> = {
  supporters: "Supporters",
  circles: "Schools & teams (Circles)",
  colosseum: "Colosseum (party mode)",
  other: "Other",
};

export function usd(cents: number, precise = false): string {
  const v = cents / 100;
  if (precise && v > 0 && v < 0.001) return "<$0.001";
  if (precise && Math.abs(v) < 1 && v !== 0) return `$${v.toFixed(3)}`;
  return `${v < 0 ? "−" : ""}$${Math.abs(v).toFixed(2)}`;
}

function monthName(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y!, mo! - 1, 1))
    .toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    .toUpperCase();
}

/**
 * Public, no-login transparency page: what PARADOX cost to run this month,
 * what came in, the profit, and where each dollar went.
 */
export function OpenBooksPage() {
  const [month, setMonth] = useState<string | null>(null);
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Response>("/public/open-books", { params: month ? { month } : {} })
      .then(({ data }) => setData(data))
      .catch((e) => setError(errorMessage(e, "Could not load the books.")));
  }, [month]);

  if (error) return <p className="p-16 text-center font-mono text-blood">{error}</p>;
  if (!data) return <p className="p-16 text-center font-mono text-muted">OPENING THE BOOKS...</p>;

  const { books, months, plans } = data;
  const profit = books.totals.profitCents;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10 md:px-6 md:py-16">
      <header className="border-b-2 border-bone pb-6">
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">OPEN BOOKS</p>
        <h1 className="brutal-heading mt-3 text-5xl text-bone md:text-7xl">EVERY DOLLAR, IN THE OPEN.</h1>
        <p className="mt-4 font-mono text-bone">
          PARADOX is free to play. It's paid for by Supporters and by schools and teams that run private Circles.
          This page shows what the game costs to run, what comes in, and what's left over — including the profit.
          AI costs are metered on every single call; card fees come straight from Stripe.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="font-mono text-xs uppercase tracking-brutal text-muted" htmlFor="month">
            MONTH
          </label>
          <select
            id="month"
            className="brutal-input w-auto py-2"
            value={books.month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {monthName(m)}
              </option>
            ))}
          </select>
          {books.isCurrentMonth && (
            <span className="font-mono text-xs uppercase tracking-brutal text-gold">· MONTH SO FAR, UPDATED LIVE</span>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="COST TO RUN" value={usd(books.totals.costsCents)} />
        <Tile label="CAME IN" value={usd(books.revenue.netCents)} />
        <Tile label={profit >= 0 ? "PROFIT" : "SHORTFALL"} value={usd(Math.abs(profit))} tone={profit >= 0 ? "gold" : "blood"} />
        <Tile
          label="COST PER PLAYER"
          value={books.perActivePlayerCents === null ? "—" : usd(books.perActivePlayerCents, true)}
          sub={`${books.players.active} ACTIVE PLAYER${books.players.active === 1 ? "" : "S"}`}
        />
      </section>

      <section className="border-2 border-gold p-5 md:p-6">
        <h2 className="brutal-heading text-sm text-gold">WHERE EACH DOLLAR WENT</h2>
        {books.perDollar ? (
          <>
            <div className="mt-4 flex h-6 w-full overflow-hidden border border-smoke">
              {books.perDollar.map((l, i) => (
                <div
                  key={l.label}
                  title={`${l.label}: ${l.cents}¢`}
                  style={{ width: `${Math.min(100, l.cents)}%` }}
                  className={l.label.startsWith("Profit") ? "bg-gold" : i % 2 === 0 ? "bg-bone" : "bg-muted"}
                />
              ))}
            </div>
            <ul className="mt-4 flex flex-col gap-1 font-mono text-sm text-bone">
              {books.perDollar.map((l) => (
                <li key={l.label} className="flex justify-between gap-4">
                  <span className={l.label.startsWith("Profit") ? "text-gold" : ""}>{l.label}</span>
                  <span>{l.cents.toFixed(1)}¢</span>
                </li>
              ))}
            </ul>
            {profit < 0 && (
              <p className="mt-3 font-mono text-xs text-blood">
                Costs were higher than income this month; the developer covered the {usd(-profit)} difference.
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 font-mono text-sm text-bone">
            No income yet this month — every cost below is currently paid by the developer. It takes about{" "}
            <span className="text-gold">{books.breakEvenSupporters}</span> Supporter
            {books.breakEvenSupporters === 1 ? "" : "s"} at the monthly price to cover it.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="brutal-heading text-sm text-muted">WHAT IT COST · {usd(books.totals.costsCents)}</h2>
        <Ledger
          rows={[
            ...books.ai.byRole.map((r) => ({
              label: `AI — ${ROLE_LABEL[r.role] ?? r.role}`,
              sub: `${r.calls.toLocaleString()} calls`,
              cents: r.cents,
              precise: true,
            })),
            ...books.fixed.items.map((f) => ({
              label: `${CATEGORY_LABEL[f.category] ?? f.category} — ${f.label}`,
              cents: f.amountCents,
            })),
            {
              label: "Card processing (Stripe)",
              sub: books.revenue.feesEstimated ? "includes estimates for fees Stripe hasn't settled yet" : undefined,
              cents: books.stripeFeesCents,
            },
          ]}
        />
        {books.ai.models.length > 0 && (
          <p className="font-mono text-[11px] text-muted">
            AI models used: {books.ai.models.join(", ")}. Priced at the provider's published per-token rates.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="brutal-heading text-sm text-muted">WHAT CAME IN · {usd(books.revenue.netCents)}</h2>
        <Ledger
          rows={[
            ...(Object.entries(books.revenue.bySource) as [string, number][])
              .filter(([, c]) => c !== 0)
              .map(([k, c]) => ({ label: SOURCE_LABEL[k] ?? k, cents: c })),
            ...(books.revenue.refundsCents > 0
              ? [{ label: "Refunds (already subtracted above)", cents: -books.revenue.refundsCents }]
              : []),
          ]}
          empty="Nothing yet this month."
        />
        <p className="font-mono text-xs text-muted">
          {books.players.supportersNow} SUPPORTER{books.players.supportersNow === 1 ? "" : "S"} RIGHT NOW · BREAK-EVEN AT{" "}
          {books.breakEvenSupporters}
        </p>
      </section>

      <section className="border-2 border-bone p-5 md:p-6">
        <h2 className="brutal-heading text-sm text-gold">IF YOU BECOME A SUPPORTER</h2>
        <ul className="mt-3 flex flex-col gap-2 font-mono text-sm text-bone">
          {plans.map((p) => {
            const cents = Math.round(p.amountUsd * 100);
            const pct = Math.round((p.stripeFeeCents / cents) * 100);
            return (
              <li key={p.key}>
                <span className="text-gold">{p.label}</span> — Stripe keeps {usd(p.stripeFeeCents)} ({pct}%), the
                game gets {usd(cents - p.stripeFeeCents)}.
              </li>
            );
          })}
        </ul>
        <p className="mt-3 font-mono text-xs text-muted">
          The yearly plan loses far less to card fees, so more of your money reaches the game.
        </p>
        <Link to="/support" className="brutal-btn brutal-btn-gold mt-5 inline-block">
          KEEP PARADOX FREE →
        </Link>
      </section>

      <p className="font-mono text-[11px] text-muted">
        How this is calculated: AI costs are recorded on every request from the token counts the provider reports.
        Card fees and refunds are read from Stripe for each payment. Fixed bills (servers, database, domain, email)
        are entered from the invoices each month. Months are calendar months in UTC. Profit is what's left after all
        of the above and goes to the developer's pay and back into the game.
      </p>
    </div>
  );
}

function Tile({ label, value, sub, tone = "bone" }: { label: string; value: string; sub?: string; tone?: "bone" | "gold" | "blood" }) {
  const color = tone === "gold" ? "text-gold" : tone === "blood" ? "text-blood" : "text-bone";
  return (
    <div className="border-2 border-bone p-4">
      <p className="font-mono text-[10px] uppercase tracking-brutal text-muted">{label}</p>
      <p className={`brutal-heading mt-2 text-2xl md:text-3xl ${color}`}>{value}</p>
      {sub && <p className="mt-1 font-mono text-[10px] uppercase tracking-brutal text-muted">{sub}</p>}
    </div>
  );
}

function Ledger({
  rows,
  empty = "Nothing recorded yet.",
}: {
  rows: { label: string; sub?: string; cents: number; precise?: boolean }[];
  empty?: string;
}) {
  if (rows.length === 0) return <p className="font-mono text-sm text-muted">{empty}</p>;
  return (
    <ul className="flex flex-col border-2 border-smoke">
      {rows.map((r) => (
        <li key={r.label} className="flex items-baseline justify-between gap-4 border-b border-smoke px-4 py-3 last:border-b-0">
          <span className="font-mono text-sm text-bone">
            {r.label}
            {r.sub && <span className="block text-[11px] text-muted">{r.sub}</span>}
          </span>
          <span className="font-mono text-sm text-bone">{usd(r.cents, r.precise)}</span>
        </li>
      ))}
    </ul>
  );
}
