import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { usd } from "./OpenBooksPage.tsx";

interface Plan {
  key: string;
  billing: "monthly" | "annual";
  amountUsd: number;
  label: string;
  stripeFeeCents: number;
}

interface SupportMe {
  isSupporter: boolean;
  status: string;
  plan: "monthly" | "annual" | null;
  currentPeriodEnd: string | null;
  since: string | null;
  spars: { usedToday: number; freePerDay: number; unlimited: boolean };
}

/**
 * The Supporter plan. The daily game stays free for everyone — this is how
 * people who want to keep it running chip in. Prices and Stripe's cut are
 * shown up front, with a link to the Open Books.
 */
export function SupportPage() {
  const { user, refreshUser } = useAuth();
  const [params] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [me, setMe] = useState<SupportMe | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const checkout = params.get("checkout");

  useEffect(() => {
    api
      .get<{ plans: Plan[] }>("/public/open-books")
      .then(({ data }) => setPlans(data.plans))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user) return;
    api
      .get<SupportMe>("/support/me")
      .then(({ data }) => setMe(data))
      .catch(() => undefined);
    // Stripe's webhook may land a moment after the redirect back here.
    if (checkout === "success") {
      const t = setTimeout(() => {
        void refreshUser?.();
        api.get<SupportMe>("/support/me").then(({ data }) => setMe(data)).catch(() => undefined);
      }, 3000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, checkout]);

  async function subscribe(key: string) {
    setError(null);
    setBusy(key);
    try {
      const { data } = await api.post<{ url: string }>("/stripe/checkout", { priceLookupKey: key });
      window.location.href = data.url;
    } catch (e) {
      setError(errorMessage(e, "Checkout isn't available right now."));
      setBusy(null);
    }
  }

  async function manage() {
    setError(null);
    setBusy("portal");
    try {
      const { data } = await api.post<{ url: string }>("/stripe/supporter-portal");
      window.location.href = data.url;
    } catch (e) {
      setError(errorMessage(e, "Billing portal isn't available right now."));
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10 md:px-6 md:py-16">
      <header className="border-b-2 border-bone pb-6">
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">SUPPORT PARADOX</p>
        <h1 className="brutal-heading mt-3 text-5xl text-bone md:text-7xl">THE GAME IS FREE. KEEP IT THAT WAY.</h1>
        <p className="mt-4 font-mono text-bone">
          The daily dilemma, your tribe, duels with humans, streaks and Tribe Wars are free for everyone, forever.
          What costs real money is the AI — the Oracle that reads every vow and referees every duel, and the
          sparring partner. Supporters pay for it, and you can see exactly where the money goes in the{" "}
          <Link to="/open-books" className="text-gold underline">
            Open Books
          </Link>
          .
        </p>
      </header>

      {checkout === "success" && (
        <p className="border-2 border-gold p-4 font-mono text-gold">
          THANK YOU. Your support is being confirmed with Stripe — your badge and unlimited spars switch on in a moment.
        </p>
      )}
      {checkout === "cancel" && (
        <p className="border-2 border-smoke p-4 font-mono text-muted">No charge was made. The game is still yours, free.</p>
      )}
      {error && <p className="border-2 border-blood p-4 font-mono text-blood">{error}</p>}

      {me?.isSupporter ? (
        <section className="brutal-card-gold">
          <p className="brutal-heading text-sm text-gold">YOU'RE A SUPPORTER ★</p>
          <p className="mt-3 font-mono text-bone">
            {me.plan === "annual" ? "Yearly" : "Monthly"} plan
            {me.since ? ` · since ${new Date(me.since).toLocaleDateString()}` : ""}
            {me.currentPeriodEnd ? ` · renews ${new Date(me.currentPeriodEnd).toLocaleDateString()}` : ""}
            {me.status === "past_due" ? " · payment needs attention" : ""}
          </p>
          <button className="brutal-btn mt-5" onClick={manage} disabled={busy === "portal"}>
            {busy === "portal" ? "..." : "MANAGE OR CANCEL"}
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {plans.map((p) => {
            const cents = Math.round(p.amountUsd * 100);
            const best = p.billing === "annual";
            return (
              <div key={p.key} className={`flex flex-col border-2 p-5 ${best ? "border-gold" : "border-bone"}`}>
                <p className="font-mono text-xs uppercase tracking-brutal text-muted">
                  {best ? "YEARLY · BEST FOR THE GAME" : "MONTHLY"}
                </p>
                <p className="brutal-heading mt-2 text-4xl text-bone">{p.label.toUpperCase()}</p>
                {best && <p className="mt-1 font-mono text-xs text-gold">= $2 a month</p>}
                <p className="mt-3 font-mono text-xs text-muted">
                  Stripe's card fee: {usd(p.stripeFeeCents)} ({Math.round((p.stripeFeeCents / cents) * 100)}%). The
                  game gets {usd(cents - p.stripeFeeCents)}.
                </p>
                {user ? (
                  <button
                    className={`brutal-btn mt-5 ${best ? "brutal-btn-gold" : ""}`}
                    onClick={() => subscribe(p.key)}
                    disabled={busy !== null}
                  >
                    {busy === p.key ? "..." : "BECOME A SUPPORTER"}
                  </button>
                ) : (
                  <Link to="/register" className="brutal-btn mt-5 text-center">
                    CREATE A FREE ACCOUNT FIRST
                  </Link>
                )}
              </div>
            );
          })}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="brutal-heading text-sm text-muted">WHAT YOU GET</h2>
        <ul className="flex flex-col gap-2 font-mono text-sm text-bone">
          <li>
            ★ <span className="text-gold">Unlimited AI spars.</span> Free players get{" "}
            {me?.spars.freePerDay ?? 1} a day — it's the one feature that costs money every time it's used.
          </li>
          <li>★ A Supporter badge on your profile.</li>
          <li>★ The knowledge that the game stays free for students and everyone else.</li>
        </ul>
        <p className="font-mono text-xs text-muted">
          Supporting never changes scoring: spars beyond your first each day are unscored, for everyone. No ads,
          ever, and we never sell your data.
        </p>
      </section>
    </div>
  );
}
