/**
 * Pricing catalogue — source of truth for Stripe products and prices.
 *
 * Stable `lookup_key` strings let us upsert to Stripe idempotently from
 * `npm run stripe:sync` and let the client send a key (not a raw priceId)
 * to POST /stripe/checkout so price rotation doesn't require a client
 * redeploy.
 *
 * Billing intervals map to Stripe Price.recurring as:
 *   monthly → interval=month, interval_count=1
 *   6month  → interval=month, interval_count=6
 *   annual  → interval=year,  interval_count=1
 *
 * Amounts are in whole US dollars; the sync script converts to cents.
 */

export type Billing = "monthly" | "6month" | "annual";

export type CircleTypeKey =
  | "JUNIOR_HIGH"
  | "HIGH_SCHOOL"
  | "UNIVERSITY"
  | "CORPORATE"
  | "DEN";

export interface PricingPlan {
  key: string;
  circleType: CircleTypeKey;
  tierName: string;
  tabLabel: string;
  // null means "unlimited" (CORPORATE_ENTERPRISE).
  seatLimit: number | null;
  popular: boolean;
  // USD amounts; may be fractional (e.g. 4.99). Converted via
  // Math.round(value * 100) at the Stripe boundary to avoid float drift.
  monthly: number;
  sixMonth: number;
  annual: number;
  features: string[];
  // Billing intervals this plan offers. Defaults to all three. Dens only
  // offer monthly + annual so the 6-month SKU is never synced or shown.
  offeredBillings?: Billing[];
}

const DEFAULT_BILLINGS: readonly Billing[] = ["monthly", "6month", "annual"];

export function billingsFor(plan: PricingPlan): readonly Billing[] {
  return plan.offeredBillings ?? DEFAULT_BILLINGS;
}

/* ---------- the 12 plans ---------- */

export const PRICING_PLANS: PricingPlan[] = [
  // JR. HIGH
  {
    key: "JR_HIGH_STARTER",
    circleType: "JUNIOR_HIGH",
    tierName: "Starter",
    tabLabel: "Jr. High",
    seatLimit: 100,
    popular: false,
    monthly: 29,
    sixMonth: 148,
    annual: 243,
    features: [
      "Up to 100 student seats",
      "Jr. High dilemma pack",
      "Per-class games",
      "Invite codes",
    ],
  },
  {
    key: "JR_HIGH_STANDARD",
    circleType: "JUNIOR_HIGH",
    tierName: "Standard",
    tabLabel: "Jr. High",
    seatLimit: 300,
    popular: true,
    monthly: 49,
    sixMonth: 250,
    annual: 411,
    features: [
      "Up to 300 student seats",
      "Jr. High dilemma pack",
      "Multiple periods per circle",
      "Priority support",
    ],
  },
  {
    key: "JR_HIGH_CAMPUS",
    circleType: "JUNIOR_HIGH",
    tierName: "Campus",
    tabLabel: "Jr. High",
    seatLimit: 600,
    popular: false,
    monthly: 79,
    sixMonth: 403,
    annual: 664,
    features: [
      "Up to 600 student seats",
      "Jr. High dilemma pack",
      "Campus-wide deployment",
      "Priority support",
    ],
  },

  // HIGH SCHOOL
  {
    key: "HIGH_SCHOOL_STARTER",
    circleType: "HIGH_SCHOOL",
    tierName: "Starter",
    tabLabel: "High School",
    seatLimit: 200,
    popular: false,
    monthly: 49,
    sixMonth: 250,
    annual: 411,
    features: [
      "Up to 200 student seats",
      "High School dilemma pack",
      "Per-class games",
      "Invite codes",
    ],
  },
  {
    key: "HIGH_SCHOOL_STANDARD",
    circleType: "HIGH_SCHOOL",
    tierName: "Standard",
    tabLabel: "High School",
    seatLimit: 600,
    popular: true,
    monthly: 89,
    sixMonth: 454,
    annual: 748,
    features: [
      "Up to 600 student seats",
      "High School dilemma pack",
      "Multi-period coverage",
      "Priority support",
    ],
  },
  {
    key: "HIGH_SCHOOL_CAMPUS",
    circleType: "HIGH_SCHOOL",
    tierName: "Campus",
    tabLabel: "High School",
    seatLimit: 1500,
    popular: false,
    monthly: 149,
    sixMonth: 760,
    annual: 1252,
    features: [
      "Up to 1,500 student seats",
      "High School dilemma pack",
      "Campus-wide deployment",
      "Priority support",
    ],
  },

  // UNIVERSITY
  {
    key: "UNIVERSITY_DEPARTMENT",
    circleType: "UNIVERSITY",
    tierName: "Department",
    tabLabel: "University",
    seatLimit: 500,
    popular: false,
    monthly: 99,
    sixMonth: 505,
    annual: 831,
    features: [
      "Up to 500 student seats",
      "University dilemma pack",
      "Seminar-scoped games",
      "Email support",
    ],
  },
  {
    key: "UNIVERSITY_FACULTY",
    circleType: "UNIVERSITY",
    tierName: "Faculty",
    tabLabel: "University",
    seatLimit: 2000,
    popular: true,
    monthly: 199,
    sixMonth: 1015,
    annual: 1672,
    features: [
      "Up to 2,000 student seats",
      "University dilemma pack",
      "Faculty-wide deployment",
      "Priority support",
    ],
  },
  {
    key: "UNIVERSITY_INSTITUTION",
    circleType: "UNIVERSITY",
    tierName: "Institution",
    tabLabel: "University",
    seatLimit: 5000,
    popular: false,
    monthly: 349,
    sixMonth: 1780,
    annual: 2932,
    features: [
      "Up to 5,000 student seats",
      "University dilemma pack",
      "Institution-wide deployment",
      "Dedicated support",
    ],
  },

  // CORPORATE
  {
    key: "CORPORATE_TEAM",
    circleType: "CORPORATE",
    tierName: "Team",
    tabLabel: "Corporate",
    seatLimit: 50,
    popular: false,
    monthly: 149,
    sixMonth: 760,
    annual: 1252,
    features: [
      "Up to 50 employee seats",
      "Corporate dilemma pack",
      "Single team deployment",
      "Email support",
    ],
  },
  {
    key: "CORPORATE_DEPARTMENT",
    circleType: "CORPORATE",
    tierName: "Department",
    tabLabel: "Corporate",
    seatLimit: 200,
    popular: true,
    monthly: 299,
    sixMonth: 1525,
    annual: 2512,
    features: [
      "Up to 200 employee seats",
      "Corporate dilemma pack",
      "Multi-team deployment",
      "Priority support",
    ],
  },
  {
    key: "CORPORATE_ENTERPRISE",
    circleType: "CORPORATE",
    tierName: "Enterprise",
    tabLabel: "Corporate",
    seatLimit: null,
    popular: false,
    monthly: 499,
    sixMonth: 2545,
    annual: 4192,
    features: [
      "Unlimited employee seats",
      "Corporate dilemma pack",
      "Org-wide deployment",
      "Dedicated support",
    ],
  },

  // DEN — Friend & family. Monthly + annual only (no 6-month). `sixMonth`
  // is set to 0 but `offeredBillings` excludes it so nothing ever resolves
  // a 6-month Den lookup key.
  {
    key: "DEN_STARTER",
    circleType: "DEN",
    tierName: "Starter",
    tabLabel: "Den",
    seatLimit: 5,
    popular: false,
    monthly: 4.99,
    sixMonth: 0,
    annual: 39,
    offeredBillings: ["monthly", "annual"],
    features: [
      "Up to 5 members",
      "Private matchmaking",
      "Shared synthesis archive",
      "Group tribe leaderboard",
      "Invite via shareable link",
    ],
  },
  {
    key: "DEN_PLUS",
    circleType: "DEN",
    tierName: "Plus",
    tabLabel: "Den",
    seatLimit: 15,
    popular: true,
    monthly: 9.99,
    sixMonth: 0,
    annual: 79,
    offeredBillings: ["monthly", "annual"],
    features: [
      "Everything in Starter",
      "Up to 15 members",
      "Den Stats dashboard",
      "Full session history",
    ],
  },
];

/* ---------- helpers ---------- */

export function lookupKeyFor(planKey: string, billing: Billing): string {
  const suffix = billing === "6month" ? "6MONTH" : billing.toUpperCase();
  return `${planKey}_${suffix}`;
}

export function amountFor(plan: PricingPlan, billing: Billing): number {
  return billing === "monthly" ? plan.monthly : billing === "6month" ? plan.sixMonth : plan.annual;
}

/**
 * Returns `{ interval, interval_count }` for a Stripe Price's `recurring`
 * block. 6-month upfront is `month × 6`; annual is `year × 1`.
 */
export function recurringFor(
  billing: Billing,
): { interval: "month" | "year"; interval_count: number } {
  if (billing === "monthly") return { interval: "month", interval_count: 1 };
  if (billing === "6month") return { interval: "month", interval_count: 6 };
  return { interval: "year", interval_count: 1 };
}

export function findPlanByKey(key: string): PricingPlan | undefined {
  return PRICING_PLANS.find((p) => p.key === key);
}

/**
 * Reverse lookup: given a lookup_key like "JR_HIGH_STANDARD_6MONTH", return
 * the plan + billing period. Used by the webhook to figure out which plan
 * was purchased from a Price object.
 */
export function resolveLookupKey(
  lookupKey: string,
): { plan: PricingPlan; billing: Billing } | undefined {
  for (const plan of PRICING_PLANS) {
    for (const billing of billingsFor(plan)) {
      if (lookupKeyFor(plan.key, billing) === lookupKey) {
        return { plan, billing };
      }
    }
  }
  return undefined;
}

export const ALL_LOOKUP_KEYS: string[] = PRICING_PLANS.flatMap((p) =>
  billingsFor(p).map((b) => lookupKeyFor(p.key, b)),
);

/* ---------- feature plans (user-level subscriptions, no Circle) ---------- */

/**
 * User-level recurring subscriptions that don't create a Circle. Kept in
 * a separate catalogue so the Circle-oriented PricingPlan shape stays
 * focused (no `circleType`, no `seatLimit`, no 6-month option). Currently
 * just Party Pro monthly; extensible to any future "unlock a feature for
 * this user" subscription.
 */
export interface FeaturePlan {
  key: string;
  /** Short tab/card label, e.g. "Party Pro" */
  name: string;
  /** Descriptive tagline shown under the price */
  tagline: string;
  monthlyUsd: number;
  features: string[];
  popular?: boolean;
}

export const FEATURE_PLANS: FeaturePlan[] = [
  {
    key: "PARTY_PRO",
    name: "Party Pro",
    tagline: "Unlimited Colosseum sessions, bigger rooms, longer play.",
    monthlyUsd: 9.99,
    popular: true,
    features: [
      "Unlimited party sessions",
      "Up to 25 players per session",
      "Up to 2 hours per session",
      "All paradox packs included",
      "Full session history",
    ],
  },
];

/** Builds the Stripe `lookup_key` for a feature plan. Always _MONTHLY. */
export function featureLookupKey(planKey: string): string {
  return `${planKey}_MONTHLY`;
}

/**
 * Reverse lookup for a feature-plan lookup key. The webhook calls both
 * `resolveLookupKey` (circles) and this (features) to figure out what a
 * successful checkout was for.
 */
export function resolveFeatureLookupKey(
  lookupKey: string,
): FeaturePlan | undefined {
  return FEATURE_PLANS.find((p) => featureLookupKey(p.key) === lookupKey);
}
