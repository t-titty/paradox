import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/error.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { getStripe } from "../lib/stripe.js";
import { env } from "../env.js";
import { resolveLookupKey } from "../lib/pricing.js";
import { cleanText } from "../lib/htmlSanitize.js";

export const stripeRouter = Router();

/* ---------- helpers ---------- */

function mustStripe() {
  const s = getStripe();
  if (!s) {
    throw new HttpError(
      503,
      "Stripe is not configured on this server.",
      "stripe_unconfigured",
    );
  }
  return s;
}

/* ---------- POST /api/stripe/checkout ---------- */

const checkoutSchema = z.object({
  priceLookupKey: z.string().min(1).max(64),
  organizationName: z.string().trim().min(2).max(80).transform(cleanText),
});

/**
 * Creates a subscription Checkout Session. Client sends the stable
 * `lookup_key` from the pricing catalogue (not a raw priceId) and the
 * org name; the server resolves to a live Stripe Price and stashes
 * everything the webhook needs in `session.metadata`.
 *
 * Returns { url } — the client does `window.location = url`.
 */
stripeRouter.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    const stripe = mustStripe();
    const { userId } = req as AuthedRequest;
    const body = checkoutSchema.parse(req.body);

    const resolved = resolveLookupKey(body.priceLookupKey);
    if (!resolved) {
      throw new HttpError(400, "Unknown price key", "unknown_price");
    }

    // Find the active Price with this lookup_key. We trust Stripe's index
    // here — if the Price doesn't exist the catalogue is out of sync, run
    // `npm run stripe:sync`.
    const prices = await stripe.prices.list({
      lookup_keys: [body.priceLookupKey],
      active: true,
      limit: 1,
    });
    const price = prices.data[0];
    if (!price) {
      throw new HttpError(
        500,
        "Stripe price missing; run `npm run stripe:sync`.",
        "stripe_catalogue_stale",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new HttpError(404, "User not found", "not_found");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${env.PUBLIC_APP_URL}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.PUBLIC_APP_URL}/pricing/cancel`,
      customer_email: user.email,
      client_reference_id: userId,
      // Everything the webhook needs to build the Circle. Copied onto the
      // Subscription too so subscription-centric webhooks have it.
      metadata: {
        userId,
        organizationName: body.organizationName,
        priceLookupKey: body.priceLookupKey,
      },
      subscription_data: {
        metadata: {
          userId,
          organizationName: body.organizationName,
          priceLookupKey: body.priceLookupKey,
        },
      },
    });

    if (!session.url) {
      throw new HttpError(500, "Stripe did not return a checkout URL", "stripe_error");
    }
    res.json({ url: session.url });
  } catch (e) {
    next(e);
  }
});

/* ---------- POST /api/stripe/portal ---------- */

const portalSchema = z.object({ circleId: z.string().min(1).max(64) });

/**
 * Opens the Stripe Customer Portal for a Circle's owner so they can upgrade,
 * downgrade, or cancel. Return URL drops them back at the circle page.
 */
stripeRouter.post("/portal", requireAuth, async (req, res, next) => {
  try {
    const stripe = mustStripe();
    const { userId } = req as AuthedRequest;
    const { circleId } = portalSchema.parse(req.body);

    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      select: {
        ownerId: true,
        stripeCustomerId: true,
      },
    });
    if (!circle) throw new HttpError(404, "Not found", "not_found");
    if (circle.ownerId !== userId) {
      throw new HttpError(403, "Only the circle owner can manage billing", "forbidden");
    }
    if (!circle.stripeCustomerId) {
      throw new HttpError(400, "No Stripe customer on this circle yet", "no_customer");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: circle.stripeCustomerId,
      return_url: `${env.PUBLIC_APP_URL}/circles/manage/${circleId}`,
    });
    res.json({ url: session.url });
  } catch (e) {
    next(e);
  }
});

/* ---------- GET /api/stripe/session/:id ---------- */

/**
 * Thin read of a completed Checkout Session so /pricing/success can confirm
 * the org name + plan and link into the newly-created Circle. Authed: users
 * can only look up sessions tied to their own userId metadata.
 */
stripeRouter.get("/session/:id", requireAuth, async (req, res, next) => {
  try {
    const stripe = mustStripe();
    const { userId } = req as AuthedRequest;
    const session = await stripe.checkout.sessions.retrieve(req.params.id!);

    if (session.metadata?.userId && session.metadata.userId !== userId) {
      throw new HttpError(404, "Not found", "not_found");
    }
    const lookupKey = session.metadata?.priceLookupKey ?? null;
    const resolved = lookupKey ? resolveLookupKey(lookupKey) : null;
    const plan = resolved?.plan ?? null;

    // Best-effort: if the webhook has already created the Circle we can
    // link straight to it. Match on the subscription id.
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null;
    const circle = subId
      ? await prisma.circle.findUnique({
          where: { stripeSubscriptionId: subId },
          select: { id: true, name: true },
        })
      : null;

    res.json({
      organizationName: session.metadata?.organizationName ?? null,
      planName: plan ? `${plan.tabLabel} ${plan.tierName}` : null,
      paymentStatus: session.payment_status,
      circle,
    });
  } catch (e) {
    next(e);
  }
});
