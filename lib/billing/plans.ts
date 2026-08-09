import { BILLING_PRODUCTS } from "@/lib/billing/catalog";
import { getRuntimeEnv } from "@/lib/runtime-env";
import type { SubscriptionPlan } from "@/types/database";

export const PLAN_CATALOG: Record<
  SubscriptionPlan,
  { name: string; monthlyPriceRon: number | null; description: string }
> = {
  trial: {
    name: "Trial",
    monthlyPriceRon: null,
    description: "Perioadă de încercare.",
  },
  starter: {
    name: BILLING_PRODUCTS.starter.name,
    monthlyPriceRon: BILLING_PRODUCTS.starter.monthlyPriceRon,
    description: BILLING_PRODUCTS.starter.description,
  },
  essentials: {
    name: "Essentials / Partner",
    monthlyPriceRon: 99,
    description: "Planner + invitații + site.",
  },
  premium: {
    name: "Premium",
    monthlyPriceRon: 179,
    description: "Toate modulele + Premium Wedding Pass.",
  },
  agency: {
    name: "Pro / Agency",
    monthlyPriceRon: 299,
    description: "Pentru profesioniști și white-label.",
  },
};

/**
 * Hosted Checkout + Portal need only the secret key server-side.
 * Reads Cloudflare Worker bindings when process.env is empty (OpenNext).
 */
export function isStripeConfigured() {
  return Boolean(getRuntimeEnv("STRIPE_SECRET_KEY"));
}

/** Dev-only self-grant when Stripe keys are absent. Never in production. */
export function isLocalBillingBypassAllowed() {
  return process.env.NODE_ENV !== "production" && !isStripeConfigured();
}
