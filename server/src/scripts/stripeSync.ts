/**
 * One-shot sync: `npm run stripe:sync`.
 *
 * Syncs three catalogues to Stripe Products + Prices with stable lookup_keys:
 *   1. PRICING_PLANS       — Circle-tier recurring subs (institutional + Dens)
 *   2. FEATURE_PLANS       — User-level recurring subs (Party Pro monthly)
 *   3. ONE_TIME_PRODUCTS   — Non-subscription unlocks (Party Pro lifetime,
 *                            Party Packs)
 *
 * Stripe Prices are immutable (you cannot change unit_amount in place). When
 * the catalogue's amount differs from Stripe, we create a fresh Price and
 * pass `transfer_lookup_key: true` so the new price atomically steals the
 * key from the stale one. The old price is then deactivated — existing
 * subscriptions on it keep billing as-is until customers migrate.
 *
 * Idempotent: safe to run repeatedly. A no-op run for an already-synced
 * catalogue makes no API writes.
 */
import type Stripe from "stripe";
import {
  PRICING_PLANS,
  FEATURE_PLANS,
  ONE_TIME_PRODUCTS,
  billingsFor,
  lookupKeyFor,
  amountFor,
  recurringFor,
  featureLookupKey,
  type Billing,
} from "../lib/pricing.js";
import { requireStripe } from "../lib/stripe.js";

function usdToCents(amount: number): number {
  // `Math.round` avoids floating-point ugliness: 4.99 * 100 === 498.99999...
  return Math.round(amount * 100);
}

/**
 * Upsert a Stripe Product, keyed on `metadata.plan_key`, returning its id.
 * All three catalogues flow through this so metadata shape stays consistent.
 */
async function upsertProduct(
  stripe: Stripe,
  existing: Map<string, string>,
  planKey: string,
  name: string,
  description: string,
  metadata: Record<string, string>,
): Promise<string> {
  const existingId = existing.get(planKey);
  if (!existingId) {
    const created = await stripe.products.create({
      name,
      description,
      metadata: { plan_key: planKey, ...metadata },
    });
    console.log(`[stripe:sync] created product ${planKey} → ${created.id}`);
    return created.id;
  }
  await stripe.products.update(existingId, {
    name,
    description,
    metadata: { plan_key: planKey, ...metadata },
  });
  return existingId;
}

/**
 * Sync one Price for (planKey, lookupKey, amountCents). Creates if missing,
 * rotates (creates-new + deactivates-old) if the amount drifted, no-ops if
 * already in sync.
 *
 * `recurring` is null for one-time prices — Stripe distinguishes on presence.
 */
async function syncPrice(
  stripe: Stripe,
  existingByLookupKey: Map<string, { id: string; unit_amount: number | null }>,
  productId: string,
  lookupKey: string,
  amountCents: number,
  recurring: Stripe.PriceCreateParams.Recurring | null,
  metadata: Record<string, string>,
): Promise<void> {
  const existing = existingByLookupKey.get(lookupKey);
  if (existing && existing.unit_amount === amountCents) return;

  const createParams: Stripe.PriceCreateParams = {
    currency: "usd",
    unit_amount: amountCents,
    product: productId,
    lookup_key: lookupKey,
    transfer_lookup_key: Boolean(existing),
    metadata,
  };
  if (recurring) createParams.recurring = recurring;
  const created = await stripe.prices.create(createParams);

  if (existing) {
    await stripe.prices.update(existing.id, { active: false });
    console.log(
      `[stripe:sync] rotated ${lookupKey}: ${existing.id} → ${created.id} (${amountCents}¢)`,
    );
  } else {
    console.log(`[stripe:sync] created ${lookupKey} → ${created.id} (${amountCents}¢)`);
  }
}

async function main() {
  const stripe = requireStripe();

  // --- Existing products & prices --------------------------------------
  // Build name→product and lookup_key→price maps upfront so each upsert is a
  // single lookup, not a search-per-item.
  const existingProducts = new Map<string, string>(); // plan_key → product id
  for await (const product of stripe.products.list({ limit: 100, active: true })) {
    const k = product.metadata?.plan_key;
    if (k) existingProducts.set(k, product.id);
  }

  // We need the union of all expected lookup keys to batch-prefetch. Stripe
  // caps list({ lookup_keys }) at 10 per call, so we chunk below.
  const allLookupKeys: string[] = [];
  for (const plan of PRICING_PLANS) {
    for (const billing of billingsFor(plan)) {
      allLookupKeys.push(lookupKeyFor(plan.key, billing));
    }
  }
  for (const fp of FEATURE_PLANS) {
    allLookupKeys.push(featureLookupKey(fp.key));
  }
  for (const ot of ONE_TIME_PRODUCTS) {
    allLookupKeys.push(ot.lookupKey);
  }

  const existingByLookupKey = new Map<
    string,
    { id: string; unit_amount: number | null }
  >();
  for (let i = 0; i < allLookupKeys.length; i += 10) {
    const batch = allLookupKeys.slice(i, i + 10);
    const page = await stripe.prices.list({ lookup_keys: batch, limit: 10 });
    for (const p of page.data) {
      if (p.lookup_key) {
        existingByLookupKey.set(p.lookup_key, {
          id: p.id,
          unit_amount: p.unit_amount,
        });
      }
    }
  }

  // --- 1. Circle-tier plans (PRICING_PLANS) ----------------------------
  for (const plan of PRICING_PLANS) {
    const productId = await upsertProduct(
      stripe,
      existingProducts,
      plan.key,
      `PARADOX — ${plan.tabLabel} ${plan.tierName}`,
      `${plan.tierName} tier for ${plan.tabLabel} circles (${plan.seatLimit ?? "unlimited"} seats)`,
      {
        circle_type: plan.circleType,
        seat_limit: plan.seatLimit === null ? "unlimited" : String(plan.seatLimit),
      },
    );
    for (const billing of billingsFor(plan)) {
      const lookupKey = lookupKeyFor(plan.key, billing);
      const amountCents = usdToCents(amountFor(plan, billing));
      await syncPrice(
        stripe,
        existingByLookupKey,
        productId,
        lookupKey,
        amountCents,
        recurringFor(billing) as Stripe.PriceCreateParams.Recurring,
        {
          plan_key: plan.key,
          billing,
          seat_limit: plan.seatLimit === null ? "unlimited" : String(plan.seatLimit),
        },
      );
    }
  }

  // --- 2. Feature plans (FEATURE_PLANS) --------------------------------
  // Currently just Party Pro monthly. User-level, no circle_type metadata.
  for (const fp of FEATURE_PLANS) {
    const productId = await upsertProduct(
      stripe,
      existingProducts,
      fp.key,
      fp.name,
      fp.description,
      { kind: "feature" },
    );
    await syncPrice(
      stripe,
      existingByLookupKey,
      productId,
      featureLookupKey(fp.key),
      usdToCents(fp.monthlyUsd),
      { interval: "month", interval_count: 1 },
      { plan_key: fp.key, billing: "monthly", kind: "feature" },
    );
  }

  // --- 3. One-time products (ONE_TIME_PRODUCTS) ------------------------
  // Lifetime unlocks + Party Packs. Prices have no `recurring` block.
  for (const ot of ONE_TIME_PRODUCTS) {
    const productId = await upsertProduct(
      stripe,
      existingProducts,
      ot.key,
      ot.name,
      ot.description,
      {
        kind: ot.kind,
        ...(ot.packSlug ? { pack_slug: ot.packSlug } : {}),
      },
    );
    await syncPrice(
      stripe,
      existingByLookupKey,
      productId,
      ot.lookupKey,
      usdToCents(ot.amountUsd),
      null,
      {
        plan_key: ot.key,
        kind: ot.kind,
        ...(ot.packSlug ? { pack_slug: ot.packSlug } : {}),
      },
    );
  }

  console.log("[stripe:sync] done.");
}

main().catch((e) => {
  console.error("[stripe:sync] failed:", e);
  process.exit(1);
});
