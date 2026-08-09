import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/**
 * Returns null when STRIPE_SECRET_KEY is missing (noop-safe billing).
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }

  return stripeClient;
}

export { PLAN_CATALOG, isStripeConfigured } from "@/lib/billing/plans";
