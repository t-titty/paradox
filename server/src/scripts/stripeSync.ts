/**
 * One-shot sync: `npm run stripe:sync`.
 *
 * For each PricingPlan (12) and each billing interval (3) this ensures:
 *   - one Stripe Product per plan, tagged with metadata.plan_key
 *   - one Stripe Price per (plan, billing) with a stable lookup_key
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
import {
  PRICING_PLANS,
  FEATURE_PLANS,
  billingsFor,
  lookupKeyFor,
  amountFor,
  recurringFor,
  featureLookupKey,
  SUPPORTER_PLANS,
} from "../lib/pricing.js";
import { requireStripe } from "../lib/stripe.js";

// $4.99 * 100 === 498.99999... in JS floats; Math.round keeps cents exact.
function usdToCents(usd: number): number {
  return Math.round(usd * 100);
}

async function main() {
  const stripe = requireStripe();

  // --- Products ---------------------------------------------------------
  // Build a name→product map by paging through existing ones tagged with
  // metadata.plan_key. Avoids products.search's eventual-consistency window.
  const existingProducts = new Map<string, string>(); // plan_key → product id
  for await (const product of stripe.products.list({
    limit: 100,
    active: true,
  })) {
    const k = product.metadata?.plan_key;
    if (k) existingProducts.set(k, product.id);
  }

  const productIdByPlanKey = new Map<string, string>();
  for (const plan of PRICING_PLANS) {
    let productId = existingProducts.get(plan.key);
    if (!productId) {
      const created = await stripe.products.create({
        name: `PARADOX — ${plan.tabLabel} ${plan.tierName}`,
        description: `${plan.tierName} tier for ${plan.tabLabel} circles (${plan.seatLimit ?? "unlimited"} seats)`,
        metadata: {
          plan_key: plan.key,
          circle_type: plan.circleType,
          seat_limit: plan.seatLimit === null ? "unlimited" : String(plan.seatLimit),
        },
      });
      productId = created.id;
      console.log(`[stripe:sync] created product ${plan.key} → ${productId}`);
    } else {
      // Keep metadata in sync so seat limits/labels stay authoritative.
      await stripe.products.update(productId, {
        name: `PARADOX — ${plan.tabLabel} ${plan.tierName}`,
        description: `${plan.tierName} tier for ${plan.tabLabel} circles (${plan.seatLimit ?? "unlimited"} seats)`,
        metadata: {
          plan_key: plan.key,
          circle_type: plan.circleType,
          seat_limit: plan.seatLimit === null ? "unlimited" : String(plan.seatLimit),
        },
      });
    }
    productIdByPlanKey.set(plan.key, productId);
  }

  // --- Prices -----------------------------------------------------------
  // Fetch all desired lookup keys in one sweep (Stripe caps at 10 per call).
  const desired: {
    plan: (typeof PRICING_PLANS)[number];
    billing: ReturnType<typeof billingsFor>[number];
    lookupKey: string;
    amountCents: number;
  }[] = [];
  for (const plan of PRICING_PLANS) {
    // Skip billing intervals a plan doesn't offer (e.g. Dens have no
    // 6-month SKU) so we don't mint unreachable Stripe prices.
    for (const billing of billingsFor(plan)) {
      desired.push({
        plan,
        billing,
        lookupKey: lookupKeyFor(plan.key, billing),
        amountCents: usdToCents(amountFor(plan, billing)),
      });
    }
  }

  const existingByLookupKey = new Map<string, { id: string; unit_amount: number | null }>();
  for (let i = 0; i < desired.length; i += 10) {
    const batch = desired.slice(i, i + 10).map((d) => d.lookupKey);
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

  for (const { plan, billing, lookupKey, amountCents } of desired) {
    const existing = existingByLookupKey.get(lookupKey);
    if (existing && existing.unit_amount === amountCents) {
      continue;
    }
    const created = await stripe.prices.create({
      currency: "usd",
      unit_amount: amountCents,
      product: productIdByPlanKey.get(plan.key)!,
      recurring: recurringFor(billing),
      lookup_key: lookupKey,
      // Atomically move the lookup_key away from any stale price.
      transfer_lookup_key: Boolean(existing),
      metadata: {
        plan_key: plan.key,
        billing,
        seat_limit: plan.seatLimit === null ? "unlimited" : String(plan.seatLimit),
      },
    });
    if (existing) {
      // Deactivate the old price so it stops appearing in lists. Existing
      // subscriptions on it continue billing per Stripe's immutability model.
      await stripe.prices.update(existing.id, { active: false });
      console.log(
        `[stripe:sync] rotated ${lookupKey}: ${existing.id} → ${created.id} (${amountCents}¢)`,
      );
    } else {
      console.log(`[stripe:sync] created ${lookupKey} → ${created.id} (${amountCents}¢)`);
    }
  }

  // --- Supporter plan (one product, monthly + annual prices) ------------
  {
    const key = "SUPPORTER";
    let productId = existingProducts.get(key);
    const productPayload = {
      name: "PARADOX — Supporter",
      description: "Keeps PARADOX free for everyone. Unlimited AI spars and a supporter badge.",
      metadata: { plan_key: key, kind: "supporter" as const },
    };
    if (!productId) {
      productId = (await stripe.products.create(productPayload)).id;
      console.log(`[stripe:sync] created product ${key} → ${productId}`);
    } else {
      await stripe.products.update(productId, productPayload);
    }
    for (const sp of SUPPORTER_PLANS) {
      const amountCents = usdToCents(sp.amountUsd);
      const existing = (
        await stripe.prices.list({ lookup_keys: [sp.key], active: true, limit: 1 })
      ).data[0];
      if (existing && existing.unit_amount === amountCents) continue;
      const created = await stripe.prices.create({
        currency: "usd",
        unit_amount: amountCents,
        product: productId,
        recurring: sp.billing === "annual" ? { interval: "year", interval_count: 1 } : { interval: "month", interval_count: 1 },
        lookup_key: sp.key,
        transfer_lookup_key: Boolean(existing),
        metadata: { plan_key: key, billing: sp.billing, kind: "supporter" },
      });
      if (existing) await stripe.prices.update(existing.id, { active: false });
      console.log(`[stripe:sync] ${existing ? "rotated" : "created"} ${sp.key} → ${created.id} (${amountCents}¢)`);
    }
  }

  // --- Feature plans (user-level subscriptions, no Circle) --------------
  // Same upsert/rotate pattern as above, but a flat loop — one product +
  // one monthly price per plan.
  for (const fp of FEATURE_PLANS) {
    let productId = existingProducts.get(fp.key);
    const productPayload = {
      name: `PARADOX — ${fp.name}`,
      description: fp.tagline,
      metadata: {
        plan_key: fp.key,
        kind: "feature" as const,
      },
    };
    if (!productId) {
      const created = await stripe.products.create(productPayload);
      productId = created.id;
      console.log(`[stripe:sync] created product ${fp.key} → ${productId}`);
    } else {
      await stripe.products.update(productId, productPayload);
    }

    const lookupKey = featureLookupKey(fp.key);
    const amountCents = usdToCents(fp.monthlyUsd);
    // Batch-fetch missed this one; issue a targeted lookup.
    const existingList = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    });
    const existingPrice = existingList.data[0];
    if (existingPrice && existingPrice.unit_amount === amountCents) continue;

    const created = await stripe.prices.create({
      currency: "usd",
      unit_amount: amountCents,
      product: productId,
      recurring: { interval: "month", interval_count: 1 },
      lookup_key: lookupKey,
      transfer_lookup_key: Boolean(existingPrice),
      metadata: {
        plan_key: fp.key,
        billing: "monthly",
        kind: "feature",
      },
    });
    if (existingPrice) {
      await stripe.prices.update(existingPrice.id, { active: false });
      console.log(
        `[stripe:sync] rotated ${lookupKey}: ${existingPrice.id} → ${created.id} (${amountCents}¢)`,
      );
    } else {
      console.log(
        `[stripe:sync] created ${lookupKey} → ${created.id} (${amountCents}¢)`,
      );
    }
  }

  console.log("[stripe:sync] done.");
}

main().catch((e) => {
  console.error("[stripe:sync] failed:", e);
  process.exit(1);
});
