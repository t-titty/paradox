import { prisma } from "../db.js";
import { SUPPORTER_PLANS, estimateStripeFeeCents } from "./pricing.js";

/**
 * The public Open Books: what PARADOX cost to run in a month, what came in,
 * and what was left over. Months are calendar months in UTC ("YYYY-MM").
 *
 *   costs  = AI usage (metered per call) + fixed costs (entered by an admin)
 *            + Stripe fees (actual, per charge)
 *   income = charges − refunds
 *   profit = income − costs
 */

export type RevenueSource = "supporters" | "circles" | "colosseum" | "other";

export interface Books {
  month: string;
  isCurrentMonth: boolean;
  ai: {
    totalCents: number;
    calls: number;
    byRole: { role: string; cents: number; calls: number }[];
    models: string[];
  };
  fixed: { totalCents: number; items: { category: string; label: string; amountCents: number }[] };
  stripeFeesCents: number;
  revenue: {
    grossCents: number;
    refundsCents: number;
    netCents: number;
    bySource: Record<RevenueSource, number>;
    feesEstimated: boolean;
  };
  totals: { costsCents: number; profitCents: number };
  players: { active: number; supportersNow: number };
  perActivePlayerCents: number | null;
  /** Supporters needed (at the monthly price, after Stripe's cut) to cover AI + fixed costs. */
  breakEvenSupporters: number;
  /** Of every dollar that came in, where it went. Null when nothing came in. */
  perDollar: { label: string; cents: number }[] | null;
}

export function monthRange(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map(Number);
  return { start: new Date(Date.UTC(y!, m! - 1, 1)), end: new Date(Date.UTC(y!, m!, 1)) };
}

export function currentMonth(now = new Date()): string {
  return now.toISOString().slice(0, 7);
}

const ROLE_LABEL: Record<string, string> = {
  sort: "AI: sorting vows into tribes",
  fallacy: "AI: refereeing duels",
  synthesis: "AI: writing Syntheses",
  spar: "AI: sparring partner",
};

export function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? `AI: ${role}`;
}

/**
 * Pure split of each incoming dollar across cost lines + profit. Exported
 * for tests. Lines are scaled to sum to exactly 100¢ when costs fit inside
 * revenue; when costs exceed revenue the profit line is omitted and the
 * caller reports the shortfall separately.
 */
export function splitPerDollar(
  netRevenueCents: number,
  lines: { label: string; cents: number }[],
): { label: string; cents: number }[] | null {
  if (netRevenueCents <= 0) return null;
  const costs = lines.filter((l) => l.cents > 0);
  const totalCosts = costs.reduce((a, l) => a + l.cents, 0);
  const scale = 100 / netRevenueCents;
  const out = costs.map((l) => ({ label: l.label, cents: Math.round(l.cents * scale * 10) / 10 }));
  if (totalCosts < netRevenueCents) {
    const used = out.reduce((a, l) => a + l.cents, 0);
    out.push({ label: "Profit (developer pay + reinvestment)", cents: Math.round((100 - used) * 10) / 10 });
  }
  return out;
}

export async function computeBooks(month: string): Promise<Books> {
  const { start, end } = monthRange(month);

  const [aiRows, fixedRows, revenueRows, activeRows, supportersNow] = await Promise.all([
    prisma.aiUsageDaily.findMany({
      where: { date: { gte: start, lt: end } },
      select: { role: true, model: true, calls: true, costMicros: true },
    }),
    prisma.operatingCost.findMany({
      where: { month },
      orderBy: { createdAt: "asc" },
      select: { category: true, label: true, amountCents: true },
    }),
    prisma.revenueEvent.findMany({
      where: { occurredAt: { gte: start, lt: end } },
      select: { customerId: true, grossCents: true, feeCents: true, refundedCents: true, feeEstimated: true },
    }),
    prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(DISTINCT v."userId") AS n
      FROM "Vote" v JOIN "User" u ON u.id = v."userId"
      WHERE v."createdAt" >= ${start} AND v."createdAt" < ${end} AND u."isBot" = false`,
    prisma.user.count({ where: { supporterStatus: { in: ["active", "trialing", "past_due"] } } }),
  ]);

  // AI, by role.
  const roleMap = new Map<string, { micros: bigint; calls: number }>();
  const models = new Set<string>();
  for (const r of aiRows) {
    models.add(r.model);
    const cur = roleMap.get(r.role) ?? { micros: 0n, calls: 0 };
    cur.micros += r.costMicros;
    cur.calls += r.calls;
    roleMap.set(r.role, cur);
  }
  const byRole = Array.from(roleMap.entries())
    .map(([role, v]) => ({ role, cents: Number(v.micros) / 10_000, calls: v.calls }))
    .sort((a, b) => b.cents - a.cents);
  const aiCents = byRole.reduce((a, r) => a + r.cents, 0);
  const aiCalls = byRole.reduce((a, r) => a + r.calls, 0);

  // Revenue, classified by who the Stripe customer is.
  const customerIds = Array.from(new Set(revenueRows.map((r) => r.customerId).filter((c): c is string => !!c)));
  const [supporterCustomers, circleCustomers, partyCustomers] = customerIds.length
    ? await Promise.all([
        prisma.user.findMany({
          where: { supporterStripeCustomerId: { in: customerIds } },
          select: { supporterStripeCustomerId: true },
        }),
        prisma.circle.findMany({
          where: { stripeCustomerId: { in: customerIds } },
          select: { stripeCustomerId: true },
        }),
        prisma.user.findMany({
          where: { partyProStripeCustomerId: { in: customerIds } },
          select: { partyProStripeCustomerId: true },
        }),
      ])
    : [[], [], []];
  const sourceOf = new Map<string, RevenueSource>();
  for (const c of partyCustomers) if (c.partyProStripeCustomerId) sourceOf.set(c.partyProStripeCustomerId, "colosseum");
  for (const c of circleCustomers) if (c.stripeCustomerId) sourceOf.set(c.stripeCustomerId, "circles");
  for (const c of supporterCustomers) if (c.supporterStripeCustomerId) sourceOf.set(c.supporterStripeCustomerId, "supporters");

  const bySource: Record<RevenueSource, number> = { supporters: 0, circles: 0, colosseum: 0, other: 0 };
  let gross = 0;
  let refunds = 0;
  let fees = 0;
  let feesEstimated = false;
  for (const r of revenueRows) {
    gross += r.grossCents;
    refunds += r.refundedCents;
    fees += r.feeCents;
    feesEstimated ||= r.feeEstimated;
    const src = (r.customerId && sourceOf.get(r.customerId)) || "other";
    bySource[src] += r.grossCents - r.refundedCents;
  }
  const netRevenue = gross - refunds;

  const fixedTotal = fixedRows.reduce((a, f) => a + f.amountCents, 0);
  const costs = Math.round(aiCents) + fixedTotal + fees;
  const active = Number(activeRows[0]?.n ?? 0n);

  // Break-even: supporters at the monthly price, after Stripe's cut.
  const monthly = SUPPORTER_PLANS.find((p) => p.billing === "monthly")!;
  const monthlyCents = Math.round(monthly.amountUsd * 100);
  const perSupporterNet = monthlyCents - estimateStripeFeeCents(monthlyCents);
  const runningCosts = aiCents + fixedTotal;
  const breakEvenSupporters = runningCosts > 0 ? Math.ceil(runningCosts / perSupporterNet) : 0;

  // Fixed costs grouped by category for the per-dollar view.
  const fixedByCategory = new Map<string, number>();
  for (const f of fixedRows) fixedByCategory.set(f.category, (fixedByCategory.get(f.category) ?? 0) + f.amountCents);
  const perDollar = splitPerDollar(netRevenue, [
    { label: "Card processing (Stripe)", cents: fees },
    { label: "AI (the Oracle + sparring partner)", cents: aiCents },
    ...Array.from(fixedByCategory.entries()).map(([category, cents]) => ({ label: categoryLabel(category), cents })),
  ]);

  return {
    month,
    isCurrentMonth: month === currentMonth(),
    ai: { totalCents: Math.round(aiCents * 100) / 100, calls: aiCalls, byRole, models: Array.from(models).sort() },
    fixed: { totalCents: fixedTotal, items: fixedRows },
    stripeFeesCents: fees,
    revenue: { grossCents: gross, refundsCents: refunds, netCents: netRevenue, bySource, feesEstimated },
    totals: { costsCents: costs, profitCents: netRevenue - costs },
    players: { active, supportersNow },
    perActivePlayerCents: active > 0 ? Math.round((runningCosts / active) * 100) / 100 : null,
    breakEvenSupporters,
    perDollar,
  };
}

const CATEGORY_LABEL: Record<string, string> = {
  hosting: "Servers (hosting)",
  database: "Database",
  email: "Email",
  domain: "Domain name",
  tools: "Tools & services",
  other: "Other",
};

export function categoryLabel(c: string): string {
  return CATEGORY_LABEL[c] ?? c;
}

/** Months that have any books data, newest first, always including this month. */
export async function availableMonths(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ m: string }[]>`
    SELECT to_char(date, 'YYYY-MM') AS m FROM "AiUsageDaily"
    UNION SELECT month AS m FROM "OperatingCost"
    UNION SELECT to_char("occurredAt", 'YYYY-MM') AS m FROM "RevenueEvent"`;
  const set = new Set(rows.map((r) => r.m));
  set.add(currentMonth());
  return Array.from(set).sort().reverse();
}
