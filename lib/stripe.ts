import Stripe from "stripe";

import { getRuntimeEnv, hydrateStripeRuntimeEnv } from "@/lib/runtime-env";

let stripeClient: Stripe | null = null;

/**
 * Returns null when STRIPE_SECRET_KEY is missing (noop-safe billing).
 */
export function getStripe(): Stripe | null {
  hydrateStripeRuntimeEnv();
  const key = getRuntimeEnv("STRIPE_SECRET_KEY");
  if (!key) return null;

  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }

  return stripeClient;
}

export { PLAN_CATALOG, isStripeConfigured } from "@/lib/billing/plans";
