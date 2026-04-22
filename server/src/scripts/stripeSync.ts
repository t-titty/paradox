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
import { PRICING_PLANS, lookupKeyFor, amountFor, recurringFor, type Billing } from "../lib/pricing.js";
import { requireStripe } from "../lib/stripe.js";

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
    billing: Billing;
    lookupKey: string;
    amountCents: number;
  }[] = [];
  for (const plan of PRICING_PLANS) {
    for (const billing of ["monthly", "6month", "annual"] as Billing[]) {
      desired.push({
        plan,
        billing,
        lookupKey: lookupKeyFor(plan.key, billing),
        amountCents: amountFor(plan, billing) * 100,
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

  console.log("[stripe:sync] done.");
}

main().catch((e) => {
  console.error("[stripe:sync] failed:", e);
  process.exit(1);
});
