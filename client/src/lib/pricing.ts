// Client-side mirror of server/src/lib/pricing.ts.
//
// Kept in sync manually. The server is the source of truth (it drives Stripe
// sync and webhook decisions); the client copy exists so the pricing page
// can render without an extra round-trip. If you change tiers or amounts,
// edit *both* files and then run `npm run stripe:sync` on the server.

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
  seatLimit: number | null;
  popular: boolean;
  monthly: number;
  sixMonth: number;
  annual: number;
  features: string[];
  /** Billing intervals this plan offers. Defaults to all three. Dens
   *  skip 6-month. */
  offeredBillings?: Billing[];
}

const DEFAULT_BILLINGS: readonly Billing[] = ["monthly", "6month", "annual"];

export function billingsFor(plan: PricingPlan): readonly Billing[] {
  return plan.offeredBillings ?? DEFAULT_BILLINGS;
}

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

  // DEN — Friend & family. Monthly + annual only.
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

export function lookupKeyFor(planKey: string, billing: Billing): string {
  const suffix = billing === "6month" ? "6MONTH" : billing.toUpperCase();
  return `${planKey}_${suffix}`;
}

export function amountFor(plan: PricingPlan, billing: Billing): number {
  return billing === "monthly" ? plan.monthly : billing === "6month" ? plan.sixMonth : plan.annual;
}

export function plansByType(type: CircleTypeKey): PricingPlan[] {
  return PRICING_PLANS.filter((p) => p.circleType === type);
}

export const TAB_ORDER: { key: CircleTypeKey; label: string }[] = [
  { key: "DEN", label: "Personal" },
  { key: "JUNIOR_HIGH", label: "Jr. High" },
  { key: "HIGH_SCHOOL", label: "High School" },
  { key: "UNIVERSITY", label: "University" },
  { key: "CORPORATE", label: "Corporate" },
];

export const BILLING_OPTIONS: { key: Billing; label: string; savings: number | null }[] = [
  { key: "monthly", label: "Monthly", savings: null },
  { key: "6month", label: "6 Months", savings: 15 },
  { key: "annual", label: "Annual", savings: 30 },
];

export function periodSuffix(billing: Billing): string {
  return billing === "monthly" ? "/MO" : billing === "6month" ? "/ 6MO" : "/ YR";
}

export function formatDollars(n: number): string {
  return "$" + n.toLocaleString("en-US");
}
