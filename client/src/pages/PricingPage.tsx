import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";
import { useAuth } from "../context/AuthContext.tsx";
import {
  BILLING_OPTIONS,
  FEATURE_PLANS,
  TAB_ORDER,
  amountFor,
  billingsFor,
  featureLookupKey,
  formatDollars,
  lookupKeyFor,
  periodSuffix,
  plansByType,
  type Billing,
  type FeaturePlan,
  type PricingPlan,
  type PricingTab,
} from "../lib/pricing.ts";

// Map the human-friendly `?tab=` URL param to a PricingTab so we can
// deep-link into a specific tab from marketing pages. Unknown values fall
// through to the default tab (JUNIOR_HIGH).
const QUERY_TAB_TO_KEY: Record<string, PricingTab> = {
  personal: "DEN",
  den: "DEN",
  "jr-high": "JUNIOR_HIGH",
  "junior-high": "JUNIOR_HIGH",
  "high-school": "HIGH_SCHOOL",
  university: "UNIVERSITY",
  corporate: "CORPORATE",
  party: "PARTY",
};

type CheckoutTarget =
  | { kind: "circle"; plan: PricingPlan; billing: Billing }
  | { kind: "feature"; plan: FeaturePlan };

export function PricingPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const initialTab = useMemo<PricingTab>(() => {
    const raw = params.get("tab")?.toLowerCase();
    return raw && QUERY_TAB_TO_KEY[raw] ? QUERY_TAB_TO_KEY[raw] : "JUNIOR_HIGH";
  }, [params]);
  const [tab, setTab] = useState<PricingTab>(initialTab);
  const [billing, setBilling] = useState<Billing>("monthly");
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(null);

  const plans = useMemo(
    () => (tab === "PARTY" ? [] : plansByType(tab)),
    [tab],
  );

  // Billing intervals this tab actually offers. PARTY is monthly-only.
  // Circle tabs read from the first plan (all plans in a tab share offered
  // billings today); fall back to all three if the tab is empty.
  const availableBillings = useMemo<readonly Billing[]>(() => {
    if (tab === "PARTY") return ["monthly"] as const;
    return plans[0]
      ? billingsFor(plans[0])
      : (["monthly", "6month", "annual"] as const);
  }, [plans, tab]);

  // If the user switches to a tab that doesn't offer the current billing
  // interval (e.g. from Corporate 6-month → Party), snap back to monthly
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

      {/* billing toggle — hidden on PARTY (monthly only) */}
      {tab !== "PARTY" && (
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
      )}

      {/* tier cards */}
      {tab === "PARTY" ? (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {FEATURE_PLANS.map((fp) => (
            <PartyTierCard
              key={fp.key}
              plan={fp}
              onChoose={() => setCheckoutTarget({ kind: "feature", plan: fp })}
            />
          ))}
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <TierCard
              key={plan.key}
              plan={plan}
              billing={billing}
              onChoose={() =>
                setCheckoutTarget({ kind: "circle", plan, billing })
              }
            />
          ))}
        </section>
      )}

      <p className="font-mono text-xs uppercase tracking-brutal text-muted">
        {tab === "PARTY"
          ? "The Colosseum plans are billed monthly in USD via Stripe. Cancel anytime from the billing portal."
          : "All plans billed in USD via Stripe. 6-month and annual plans are charged as a single upfront payment; monthly plans renew automatically every month."}
      </p>

      {checkoutTarget && (
        <CheckoutModal
          target={checkoutTarget}
          onClose={() => setCheckoutTarget(null)}
        />
      )}
    </div>
  );
}

function PartyTierCard({
  plan,
  onChoose,
}: {
  plan: FeaturePlan;
  onChoose: () => void;
}) {
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
          {plan.name.toUpperCase()}
        </p>
        <span className="mt-2 inline-block border-2 border-gold px-2 py-1 font-mono text-[10px] uppercase tracking-brutal text-gold">
          1 HOUR FREE TRIAL
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="brutal-heading text-5xl text-bone">
          {formatDollars(plan.monthlyUsd)}
        </span>
        <span className="font-mono text-xs uppercase tracking-brutal text-muted">
          /MO
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
  target,
  onClose,
}: {
  target: CheckoutTarget;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isCircle = target.kind === "circle";
  const headerLabel = isCircle
    ? `${target.plan.tabLabel.toUpperCase()} · ${target.plan.tierName.toUpperCase()}`
    : target.plan.name.toUpperCase();
  const priceLabel = isCircle
    ? `${formatDollars(amountFor(target.plan, target.billing))} ${periodSuffix(target.billing)}`
    : `${formatDollars(target.plan.monthlyUsd)} /MO`;
  const priceLookupKey = isCircle
    ? lookupKeyFor(target.plan.key, target.billing)
    : featureLookupKey(target.plan.key);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("Log in or create an account before checkout.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      // Feature plans skip organizationName entirely; the server accepts
      // the missing field and the webhook will update the user's Party
      // Pro fields instead of minting a Circle.
      const body: Record<string, string> = { priceLookupKey };
      if (isCircle) body.organizationName = orgName.trim();

      const { data } = await api.post<{ url: string }>(
        "/stripe/checkout",
        body,
      );
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
            <p className="brutal-heading mt-1 text-xl text-bone">{headerLabel}</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-brutal text-muted">
              {priceLabel}
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

        {isCircle ? (
          <>
            <label className="flex flex-col gap-1">
              <span className="brutal-heading text-xs text-muted">
                {target.plan.circleType === "DEN" ? "DEN NAME" : "ORGANIZATION NAME"}
              </span>
              <input
                className="brutal-input"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={
                  target.plan.circleType === "DEN"
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
              {target.plan.circleType === "DEN"
                ? "This becomes the name of your Den. You can rename it later."
                : "This becomes the name of your Circle. You can rename games inside it later."}
            </p>
          </>
        ) : (
          <p className="font-mono text-xs uppercase tracking-brutal text-muted">
            Unlocks unlimited Colosseum games on your account. No Circle is
            created — this is a personal subscription.
          </p>
        )}

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
