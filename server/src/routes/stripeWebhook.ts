import express, { type Request, type Response } from "express";
import type Stripe from "stripe";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { getStripe } from "../lib/stripe.js";
import { resolveLookupKey } from "../lib/pricing.js";

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

    // Idempotency: Stripe will retry a delivery if we don't ack in time.
    // Store event.id on first receive; a unique-constraint violation on a
    // retry means we've already processed it and should just 200.
    try {
      await prisma.processedStripeEvent.create({
        data: { eventId: event.id, type: event.type },
      });
    } catch (err) {
      // Prisma P2002 = unique constraint violation.
      const code = (err as { code?: string }).code;
      if (code === "P2002") {
        return res.json({ received: true, deduplicated: true });
      }
      console.error("[stripe:webhook] idempotency write failed", err);
      return res.status(500).send("idempotency error");
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

  // Idempotency: if we've already minted a Circle for this subscription
  // (retry, duplicate delivery), skip the create step.
  const existing = await prisma.circle.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    select: { id: true },
  });
  if (existing) return;

  const userId = session.metadata?.userId;
  const organizationName = session.metadata?.organizationName;
  const priceLookupKey = session.metadata?.priceLookupKey;
  if (!userId || !organizationName || !priceLookupKey) {
    console.error("[stripe:webhook] session.completed missing metadata", session.id);
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    console.error("[stripe:webhook] session.completed references unknown user", userId);
    return;
  }

  const resolved = resolveLookupKey(priceLookupKey);
  if (!resolved) {
    console.error("[stripe:webhook] unknown priceLookupKey", priceLookupKey);
    return;
  }

  // Pull the subscription to learn its current_period_end and status.
  const stripe = getStripe()!;
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

async function onSubscriptionUpdated(sub: Stripe.Subscription) {
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

  const periodEnd = subCurrentPeriodEnd(sub);
  await prisma.circle.update({
    where: { stripeSubscriptionId: sub.id },
    data: {
      subscriptionStatus: sub.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
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
  await prisma.circle
    .update({
      where: { stripeSubscriptionId: subId },
      data: { subscriptionStatus: "past_due" },
    })
    .catch(() => {});
}
