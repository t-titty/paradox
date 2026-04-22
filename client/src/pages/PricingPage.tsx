import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";
import { useAuth } from "../context/AuthContext.tsx";
import {
  BILLING_OPTIONS,
  TAB_ORDER,
  amountFor,
  billingsFor,
  formatDollars,
  lookupKeyFor,
  periodSuffix,
  plansByType,
  type Billing,
  type CircleTypeKey,
  type PricingPlan,
} from "../lib/pricing.ts";

// Map the human-friendly `?tab=` URL param to a CircleTypeKey so we can
// deep-link into the Personal tab from the /circles marketing page. Unknown
// values fall through to the default tab (JUNIOR_HIGH).
const QUERY_TAB_TO_KEY: Record<string, CircleTypeKey> = {
  personal: "DEN",
  den: "DEN",
  "jr-high": "JUNIOR_HIGH",
  "junior-high": "JUNIOR_HIGH",
  "high-school": "HIGH_SCHOOL",
  university: "UNIVERSITY",
  corporate: "CORPORATE",
};

export function PricingPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const initialTab = useMemo<CircleTypeKey>(() => {
    const raw = params.get("tab")?.toLowerCase();
    return raw && QUERY_TAB_TO_KEY[raw] ? QUERY_TAB_TO_KEY[raw] : "JUNIOR_HIGH";
  }, [params]);
  const [tab, setTab] = useState<CircleTypeKey>(initialTab);
  const [billing, setBilling] = useState<Billing>("monthly");
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);

  const plans = useMemo(() => plansByType(tab), [tab]);

  // Billing intervals this tab actually offers. All plans in a tab share
  // offered billings today, so we read from the first plan; fall back to
  // all three if the tab is somehow empty.
  const availableBillings = useMemo<readonly Billing[]>(() => {
    return plans[0]
      ? billingsFor(plans[0])
      : (["monthly", "6month", "annual"] as const);
  }, [plans]);

  // If the user switches to a tab that doesn't offer the current billing
  // interval (e.g. from Corporate 6-month → Personal), snap back to monthly
  // instead of silently picking a bogus lookup key at checkout.
  useEffect(() => {
    if (!availableBillings.includes(billing)) {
      setBilling("monthly");
    }
  }, [availableBillings, billing]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">PRICING</p>
        <h1 className="brutal-heading mt-3 text-5xl text-bone md:text-7xl">
          PICK YOUR CIRCLE.
        </h1>
        <p className="mt-6 max-w-2xl font-mono text-base text-bone md:text-lg">
          Every plan includes closed matchmaking, age-targeted dilemma packs, per-game
          invite codes, and an owner dashboard. Cancel anytime from the Stripe portal.
        </p>
        {!user && (
          <p className="mt-4 font-mono text-xs uppercase tracking-brutal text-muted">
            You'll need to{" "}
            <Link to="/register" className="text-gold hover:text-bone">
              REGISTER
            </Link>{" "}
            or{" "}
            <Link to="/login" className="text-gold hover:text-bone">
              LOG IN
            </Link>{" "}
            before checkout.
          </p>
        )}
      </header>

      {/* type tabs */}
      <nav className="flex flex-wrap gap-2 border-b-2 border-smoke pb-2">
        {TAB_ORDER.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`border-2 px-4 py-2 font-mono text-xs uppercase tracking-brutal ${
              tab === t.key
                ? "border-gold bg-gold text-ink"
                : "border-smoke text-muted hover:border-bone hover:text-bone"
            }`}
          >
            {t.label.toUpperCase()}
          </button>
        ))}
      </nav>

      {/* billing toggle — filtered to the intervals this tab actually offers */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-brutal text-muted">
          BILLING:
        </span>
        {BILLING_OPTIONS.filter((b) => availableBillings.includes(b.key)).map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => setBilling(b.key)}
            className={`flex items-center gap-2 border-2 px-3 py-2 font-mono text-xs uppercase tracking-brutal ${
              billing === b.key
                ? "border-gold text-gold"
                : "border-smoke text-muted hover:border-bone hover:text-bone"
            }`}
          >
            {b.label.toUpperCase()}
            {b.savings && (
              <span className="border-2 border-gold bg-gold px-1 text-[10px] text-ink">
                SAVE {b.savings}%
              </span>
            )}
          </button>
        ))}
      </div>

      {/* tier cards */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <TierCard
            key={plan.key}
            plan={plan}
            billing={billing}
            onChoose={() => setCheckoutPlan(plan)}
          />
        ))}
      </section>

      <p className="font-mono text-xs uppercase tracking-brutal text-muted">
        All plans billed in USD via Stripe. 6-month and annual plans are charged as a
        single upfront payment; monthly plans renew automatically every month.
      </p>

      {checkoutPlan && (
        <CheckoutModal
          plan={checkoutPlan}
          billing={billing}
          onClose={() => setCheckoutPlan(null)}
        />
      )}
    </div>
  );
}

function TierCard({
  plan,
  billing,
  onChoose,
}: {
  plan: PricingPlan;
  billing: Billing;
  onChoose: () => void;
}) {
  const amount = amountFor(plan, billing);
  return (
    <article
      className={`relative flex flex-col gap-4 border-2 p-5 md:p-6 ${
        plan.popular ? "border-gold" : "border-bone"
      }`}
    >
      {plan.popular && (
        <span className="absolute right-4 top-[-14px] border-2 border-gold bg-gold px-2 py-1 font-mono text-[10px] uppercase tracking-brutal text-ink">
          MOST POPULAR
        </span>
      )}
      <div>
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">
          {plan.tabLabel.toUpperCase()} · {plan.tierName.toUpperCase()}
        </p>
        <p className="mt-2 font-mono text-xs uppercase tracking-brutal text-muted">
          {plan.seatLimit === null ? "UNLIMITED SEATS" : `UP TO ${plan.seatLimit.toLocaleString()} SEATS`}
        </p>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="brutal-heading text-5xl text-bone">{formatDollars(amount)}</span>
        <span className="font-mono text-xs uppercase tracking-brutal text-muted">
          {periodSuffix(billing)}
        </span>
      </div>

      <ul className="flex flex-col gap-2 font-mono text-sm text-bone">
        {plan.features.map((f) => (
          <li key={f} className="border-l-2 border-smoke pl-3">
            {f}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onChoose}
        className={`brutal-btn ${plan.popular ? "brutal-btn-gold" : ""} mt-auto`}
      >
        GET STARTED
      </button>
    </article>
  );
}

function CheckoutModal({
  plan,
  billing,
  onClose,
}: {
  plan: PricingPlan;
  billing: Billing;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("Log in or create an account before checkout.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { data } = await api.post<{ url: string }>("/stripe/checkout", {
        priceLookupKey: lookupKeyFor(plan.key, billing),
        organizationName: orgName.trim(),
      });
      // Redirect to Stripe-hosted Checkout. Nothing on this page should
      // run after this — the tab is gone.
      window.location.href = data.url;
    } catch (e) {
      setError(errorMessage(e, "Could not start checkout."));
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-md flex-col gap-4 border-2 border-gold bg-ink p-5 md:p-6"
      >
        <div className="flex items-start justify-between gap-3 border-b-2 border-smoke pb-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-brutal text-gold">
              CHECKOUT
            </p>
            <p className="brutal-heading mt-1 text-xl text-bone">
              {plan.tabLabel.toUpperCase()} · {plan.tierName.toUpperCase()}
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-brutal text-muted">
              {formatDollars(amountFor(plan, billing))} {periodSuffix(billing)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="font-mono text-lg text-muted hover:text-bone"
          >
            ×
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="brutal-heading text-xs text-muted">
            {plan.circleType === "DEN" ? "DEN NAME" : "ORGANIZATION NAME"}
          </span>
          <input
            className="brutal-input"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder={
              plan.circleType === "DEN"
                ? "E.G. THE SMITHS"
                : "E.G. LINCOLN HIGH SCHOOL"
            }
            required
            minLength={2}
            maxLength={80}
            autoFocus
          />
        </label>
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">
          {plan.circleType === "DEN"
            ? "This becomes the name of your Den. You can rename it later."
            : "This becomes the name of your Circle. You can rename games inside it later."}
        </p>

        {!user && (
          <p className="border-2 border-blood p-3 font-mono text-sm text-blood">
            You need to log in or register before checkout.
          </p>
        )}
        {error && (
          <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{error}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="brutal-btn brutal-btn-gold"
            disabled={busy || !user}
          >
            {busy ? "..." : "CONTINUE TO PAYMENT"}
          </button>
          <button type="button" onClick={onClose} className="brutal-btn">
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
}
