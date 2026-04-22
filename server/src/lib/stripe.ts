import Stripe from "stripe";
import { env } from "../env.js";

// Singleton Stripe client. Null when STRIPE_SECRET_KEY is unset so the
// server still boots in dev without a Stripe account — callers must guard
// on this and return a 503 / no-op if absent.
let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (client) return client;
  if (!env.STRIPE_SECRET_KEY) return null;
  client = new Stripe(env.STRIPE_SECRET_KEY, {
    typescript: true,
  });
  return client;
}

export function requireStripe(): Stripe {
  const s = getStripe();
  if (!s) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing).");
  }
  return s;
}
