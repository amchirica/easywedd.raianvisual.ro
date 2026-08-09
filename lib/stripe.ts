import "server-only";

import Stripe from "stripe";

import { getRuntimeEnv } from "@/lib/runtime-env";

let stripeClient: Stripe | null = null;
let stripeClientKey: string | null = null;

/**
 * Returns null when STRIPE_SECRET_KEY is missing (noop-safe billing).
 * Uses Cloudflare Worker runtime env when process.env is empty.
 */
export function getStripe(): Stripe | null {
  const key = getRuntimeEnv("STRIPE_SECRET_KEY");
  if (!key) return null;

  if (!stripeClient || stripeClientKey !== key) {
    stripeClient = new Stripe(key);
    stripeClientKey = key;
  }

  return stripeClient;
}

export {
  PLAN_CATALOG,
  isLocalBillingBypassAllowed,
  isStripeConfigured,
} from "@/lib/billing/plans";
