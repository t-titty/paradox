import express, { type Request, type Response } from "express";
import type Stripe from "stripe";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { getStripe } from "../lib/stripe.js";
import {
  estimateStripeFeeCents,
  resolveFeatureLookupKey,
  resolveLookupKey,
  resolveSupporterLookupKey,
} from "../lib/pricing.js";

/**
 * Stripe webhook router. MUST be mounted before `express.json()` so the raw
 * body is available for `stripe.webhooks.constructEvent` signature
 * verification.
 *
 * Handled events:
 *   checkout.session.completed  — create Circle + OWNER membership
 *   customer.subscription.updated — sync status + period end
 *   customer.subscription.deleted — mark canceled
 *   invoice.payment_failed       — mark past_due
 *   charge.succeeded             — record revenue + Stripe's fee (Open Books)
 *   charge.refunded              — record refunds (Open Books)
 *
 * Idempotency: every path keys off `stripeSubscriptionId` (unique on Circle),
 * so duplicate deliveries land as no-ops. A Circle is only created for a
 * given subscription once.
 */
export const stripeWebhookRouter = express.Router();

stripeWebhookRouter.post(
  "/",
  // Only this route parses raw — the rest of the app still uses JSON.
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const stripe = getStripe();
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
      // Responding 503 (not 200) so Stripe retries once we're configured.
      return res.status(503).send("Stripe not configured");
    }

    const sig = req.headers["stripe-signature"];
    if (typeof sig !== "string") {
      return res.status(400).send("Missing stripe-signature header");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "bad signature";
      console.warn("[stripe:webhook] signature failed:", msg);
      return res.status(400).send(`Webhook Error: ${msg}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case "customer.subscription.updated":
          await onSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case "customer.subscription.deleted":
          await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case "invoice.payment_failed":
          await onInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case "charge.succeeded":
          await onChargeSucceeded(event.data.object as Stripe.Charge);
          break;
        case "charge.refunded":
          await onChargeRefunded(event.data.object as Stripe.Charge);
          break;
        default:
          // Every other event type is acknowledged but ignored.
          break;
      }
    } catch (err) {
      console.error(`[stripe:webhook] handler for ${event.type} threw:`, err);
      // Return 500 so Stripe retries.
      return res.status(500).send("handler error");
    }

    res.json({ received: true });
  },
);

/* ---------- shape-compat helpers ----------
 *
 * In Stripe API version 2025-04-30 and later, `current_period_end` moved
 * from Subscription to SubscriptionItem, and `Invoice.subscription` was
 * replaced by `Invoice.parent.subscription_details.subscription`. Rather
 * than pin an API version in the dashboard we read both shapes so the
 * integration keeps working across upgrades.
 */
function subCurrentPeriodEnd(sub: Stripe.Subscription): number | null {
  const anySub = sub as unknown as {
    current_period_end?: number;
    items?: { data?: { current_period_end?: number }[] };
  };
  return anySub.current_period_end ?? anySub.items?.data?.[0]?.current_period_end ?? null;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const anyInv = invoice as unknown as {
    subscription?: string | { id: string };
    parent?: { subscription_details?: { subscription?: string | { id: string } } };
  };
  const raw =
    anyInv.subscription ?? anyInv.parent?.subscription_details?.subscription ?? null;
  if (!raw) return null;
  return typeof raw === "string" ? raw : raw.id;
}

/* ---------- handlers ---------- */

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!subscriptionId || !customerId) {
    console.warn("[stripe:webhook] session.completed missing subscription/customer");
    return;
  }

  const userId = session.metadata?.userId;
  const priceLookupKey = session.metadata?.priceLookupKey;
  if (!userId || !priceLookupKey) {
    console.error("[stripe:webhook] session.completed missing metadata", session.id);
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    console.error("[stripe:webhook] session.completed references unknown user", userId);
    return;
  }

  const stripe = getStripe()!;

  // Branch 0: Supporter plan (user-level, funds the free game).
  const supporter = resolveSupporterLookupKey(priceLookupKey);
  if (supporter) {
    const already = await prisma.user.findFirst({
      where: { supporterStripeSubscriptionId: subscriptionId },
      select: { id: true },
    });
    if (already) return;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const periodEnd = subCurrentPeriodEnd(subscription);
    await prisma.user.update({
      where: { id: userId },
      data: {
        supporterStatus: subscription.status,
        supporterPlan: supporter.billing,
        supporterStripeCustomerId: customerId,
        supporterStripeSubscriptionId: subscriptionId,
        supporterCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        supporterSince: new Date(),
        isPremium: isLiveStatus(subscription.status),
      },
    });
    console.log(`[stripe:webhook] supporter activated for ${userId} · ${supporter.key}`);
    return;
  }

  // Branch 1: feature plan (user-level sub, no Circle). Currently just
  // Party Pro. Checked first because feature keys won't resolve as circle
  // keys.
  const feature = resolveFeatureLookupKey(priceLookupKey);
  if (feature) {
    // Idempotency: if we've already marked this subscription on the user,
    // skip. The unique constraint on partyProStripeSubscriptionId would
    // throw on a duplicate write anyway.
    const already = await prisma.user.findFirst({
      where: { partyProStripeSubscriptionId: subscriptionId },
      select: { id: true },
    });
    if (already) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const periodEnd = subCurrentPeriodEnd(subscription);
    await prisma.user.update({
      where: { id: userId },
      data: {
        partyProStatus: subscription.status,
        partyProStripeCustomerId: customerId,
        partyProStripeSubscriptionId: subscriptionId,
        partyProCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      },
    });
    console.log(
      `[stripe:webhook] party pro activated for ${userId} · ${feature.key}`,
    );
    return;
  }

  // Branch 2: circle tier plan. Requires organizationName in metadata;
  // mints a Circle + OWNER membership.
  const resolved = resolveLookupKey(priceLookupKey);
  if (!resolved) {
    console.error("[stripe:webhook] unknown priceLookupKey", priceLookupKey);
    return;
  }

  const organizationName = session.metadata?.organizationName;
  if (!organizationName) {
    console.error(
      "[stripe:webhook] circle checkout missing organizationName",
      session.id,
    );
    return;
  }

  // Idempotency: if we've already minted a Circle for this subscription
  // (retry, duplicate delivery), skip the create step.
  const existing = await prisma.circle.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    select: { id: true },
  });
  if (existing) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const periodEnd = subCurrentPeriodEnd(subscription);

  await prisma.circle.create({
    data: {
      name: organizationName,
      type: resolved.plan.circleType,
      ownerId: userId,
      subscriptionStatus: subscription.status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceLookupKey: priceLookupKey,
      billingPeriod: resolved.billing,
      seatLimit: resolved.plan.seatLimit,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      memberships: {
        create: { userId, role: "OWNER" },
      },
    },
  });
  console.log(
    `[stripe:webhook] circle created for ${userId} · ${resolved.plan.key}/${resolved.billing}`,
  );
}

function isLiveStatus(status: string): boolean {
  return status === "active" || status === "trialing";
}

async function onSubscriptionUpdated(sub: Stripe.Subscription) {
  const periodEnd = subCurrentPeriodEnd(sub);
  const periodEndDate = periodEnd ? new Date(periodEnd * 1000) : null;

  const supporterUser = await prisma.user.findFirst({
    where: { supporterStripeSubscriptionId: sub.id },
    select: { id: true },
  });
  if (supporterUser) {
    const lookupKey = sub.items.data[0]?.price?.lookup_key ?? null;
    const plan = lookupKey ? resolveSupporterLookupKey(lookupKey) : undefined;
    await prisma.user.update({
      where: { id: supporterUser.id },
      data: {
        supporterStatus: sub.status,
        supporterCurrentPeriodEnd: periodEndDate,
        isPremium: isLiveStatus(sub.status),
        ...(plan ? { supporterPlan: plan.billing } : {}),
      },
    });
    return;
  }

  // Party Pro branch: if this subscription is tied to a User row, update
  // the user's status/period — the column is unique so this is a 0-or-1
  // row match.
  const partyUser = await prisma.user.findFirst({
    where: { partyProStripeSubscriptionId: sub.id },
    select: { id: true },
  });
  if (partyUser) {
    await prisma.user.update({
      where: { id: partyUser.id },
      data: {
        partyProStatus: sub.status,
        partyProCurrentPeriodEnd: periodEndDate,
      },
    });
    return;
  }

  // Circle branch (existing behavior).
  const circle = await prisma.circle.findUnique({
    where: { stripeSubscriptionId: sub.id },
    select: { id: true },
  });
  if (!circle) return; // first-time: checkout.completed creates the row.

  // If the subscription changed to a different Price, update the plan
  // metadata. The price may or may not carry a lookup_key we recognize.
  const item = sub.items.data[0];
  const lookupKey = item?.price?.lookup_key ?? null;
  const resolved = lookupKey ? resolveLookupKey(lookupKey) : null;

  await prisma.circle.update({
    where: { stripeSubscriptionId: sub.id },
    data: {
      subscriptionStatus: sub.status,
      currentPeriodEnd: periodEndDate,
      ...(resolved
        ? {
            stripePriceLookupKey: lookupKey,
            billingPeriod: resolved.billing,
            seatLimit: resolved.plan.seatLimit,
            // Type shouldn't change via portal (we don't let it), but keep
            // it aligned just in case.
            type: resolved.plan.circleType,
          }
        : {}),
    },
  });
}

async function onSubscriptionDeleted(sub: Stripe.Subscription) {
  const supporterUser = await prisma.user.findFirst({
    where: { supporterStripeSubscriptionId: sub.id },
    select: { id: true },
  });
  if (supporterUser) {
    await prisma.user.update({
      where: { id: supporterUser.id },
      data: { supporterStatus: "canceled", isPremium: false },
    });
    return;
  }

  // Try Party Pro branch first.
  const partyUser = await prisma.user.findFirst({
    where: { partyProStripeSubscriptionId: sub.id },
    select: { id: true },
  });
  if (partyUser) {
    await prisma.user.update({
      where: { id: partyUser.id },
      data: { partyProStatus: "canceled" },
    });
    return;
  }

  await prisma.circle
    .update({
      where: { stripeSubscriptionId: sub.id },
      data: { subscriptionStatus: "canceled" },
    })
    .catch(() => {
      // No circle for this subscription — nothing to do.
    });
}

async function onInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return;

  const supporterUser = await prisma.user.findFirst({
    where: { supporterStripeSubscriptionId: subId },
    select: { id: true },
  });
  if (supporterUser) {
    // Keep perks during Stripe's retry window; the subscription.updated /
    // deleted events settle the final state.
    await prisma.user.update({
      where: { id: supporterUser.id },
      data: { supporterStatus: "past_due" },
    });
    return;
  }

  const partyUser = await prisma.user.findFirst({
    where: { partyProStripeSubscriptionId: subId },
    select: { id: true },
  });
  if (partyUser) {
    await prisma.user.update({
      where: { id: partyUser.id },
      data: { partyProStatus: "past_due" },
    });
    return;
  }

  await prisma.circle
    .update({
      where: { stripeSubscriptionId: subId },
      data: { subscriptionStatus: "past_due" },
    })
    .catch(() => {});
}

/* ---------- Open Books: revenue + fees ---------- */

/**
 * Record every successful charge with Stripe's actual fee, read from its
 * balance transaction. If the fee isn't available yet we store the standard
 * estimate and flag it. Idempotent on the charge id.
 */
async function onChargeSucceeded(charge: Stripe.Charge) {
  const stripe = getStripe()!;
  let feeCents = estimateStripeFeeCents(charge.amount);
  let netCents = charge.amount - feeCents;
  let feeEstimated = true;

  const btId =
    typeof charge.balance_transaction === "string"
      ? charge.balance_transaction
      : charge.balance_transaction?.id ?? null;
  if (btId) {
    try {
      const bt = await stripe.balanceTransactions.retrieve(btId);
      feeCents = bt.fee;
      netCents = bt.net;
      feeEstimated = false;
    } catch (e) {
      console.warn("[stripe:webhook] balance transaction lookup failed:", e instanceof Error ? e.message : e);
    }
  }

  const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id ?? null;
  await prisma.revenueEvent.upsert({
    where: { stripeChargeId: charge.id },
    create: {
      stripeChargeId: charge.id,
      customerId,
      occurredAt: new Date(charge.created * 1000),
      grossCents: charge.amount,
      feeCents,
      netCents,
      refundedCents: charge.amount_refunded ?? 0,
      currency: charge.currency,
      feeEstimated,
    },
    update: { feeCents, netCents, feeEstimated, customerId },
  });
}

async function onChargeRefunded(charge: Stripe.Charge) {
  await prisma.revenueEvent
    .update({
      where: { stripeChargeId: charge.id },
      data: { refundedCents: charge.amount_refunded ?? 0 },
    })
    .catch(async () => {
      // Refund for a charge we never saw succeed — record it now.
      await onChargeSucceeded(charge);
    });
}
