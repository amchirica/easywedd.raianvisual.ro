import {
  isValidStripePriceId,
  isValidStripeProductId,
} from "@/lib/billing/stripe-ids";
import { getRuntimeEnv } from "@/lib/runtime-env";
import type { BillingInterval, SubscriptionPlan } from "@/types/database";

function readEnv(name: string): string | null {
  if (!name) return null;
  return getRuntimeEnv(name) ?? null;
}

export type BillingProductKey =
  | "starter"
  | "premium_pass_12"
  | "premium_pass_18"
  | "pro"
  | "partner"
  | "white_label";

export type BillingProduct = {
  key: BillingProductKey;
  name: string;
  description: string;
  mapsToPlan: SubscriptionPlan;
  interval: BillingInterval;
  mode: "subscription" | "payment" | "grant";
  monthlyPriceRon: number | null;
  oneTimePriceRon: number | null;
  /** Env var name that must hold a Stripe Price ID (price_…). */
  envPriceId: string;
  /** Optional env var name for Stripe Product ID (prod_…) — catalog only. */
  envProductId: string;
};

export const BILLING_PRODUCTS: Record<BillingProductKey, BillingProduct> = {
  starter: {
    key: "starter",
    name: "Starter",
    description: "Planificare de bază, abonament lunar.",
    mapsToPlan: "starter",
    interval: "month",
    mode: "subscription",
    monthlyPriceRon: 49,
    oneTimePriceRon: null,
    envPriceId: "STRIPE_PRICE_STARTER_MONTHLY",
    envProductId: "STRIPE_PRODUCT_STARTER_MONTHLY",
  },
  premium_pass_12: {
    key: "premium_pass_12",
    name: "Premium Wedding Pass — 12 luni",
    description: "Acces Premium pentru 12 luni (plată unică).",
    mapsToPlan: "premium",
    interval: "one_time_12m",
    mode: "payment",
    monthlyPriceRon: null,
    oneTimePriceRon: 1490,
    envPriceId: "STRIPE_PRICE_PREMIUM_PASS_12",
    envProductId: "STRIPE_PRODUCT_PREMIUM_PASS_12",
  },
  premium_pass_18: {
    key: "premium_pass_18",
    name: "Premium Wedding Pass — 18 luni",
    description: "Acces Premium pentru 18 luni (plată unică).",
    mapsToPlan: "premium",
    interval: "one_time_18m",
    mode: "payment",
    monthlyPriceRon: null,
    oneTimePriceRon: 1990,
    envPriceId: "STRIPE_PRICE_PREMIUM_PASS_18",
    envProductId: "STRIPE_PRODUCT_PREMIUM_PASS_18",
  },
  pro: {
    key: "pro",
    name: "Pro",
    description: "Pentru profesioniști — abonament.",
    mapsToPlan: "agency",
    interval: "month",
    mode: "subscription",
    monthlyPriceRon: 299,
    oneTimePriceRon: null,
    envPriceId: "STRIPE_PRICE_PRO_MONTHLY",
    envProductId: "STRIPE_PRODUCT_PRO_MONTHLY",
  },
  partner: {
    key: "partner",
    name: "Partner",
    description: "Acordat de Raian Fine Arts / contract.",
    mapsToPlan: "essentials",
    interval: "grant",
    mode: "grant",
    monthlyPriceRon: null,
    oneTimePriceRon: null,
    envPriceId: "",
    envProductId: "",
  },
  white_label: {
    key: "white_label",
    name: "White Label",
    description: "Agency white-label — grant admin.",
    mapsToPlan: "agency",
    interval: "grant",
    mode: "grant",
    monthlyPriceRon: null,
    oneTimePriceRon: null,
    envPriceId: "",
    envProductId: "",
  },
};

/**
 * Returns a Checkout-ready Price ID (price_…), or null if missing/invalid.
 * Never returns Product IDs (prod_…).
 */
export function getStripePriceId(product: BillingProduct): string | null {
  if (!product.envPriceId) return null;
  const value = readEnv(product.envPriceId);
  return isValidStripePriceId(value) ? value : null;
}

/** Catalog reference only — never pass to Checkout. */
export function getStripeProductId(product: BillingProduct): string | null {
  if (!product.envProductId) return null;
  const value = readEnv(product.envProductId);
  return isValidStripeProductId(value) ? value : null;
}

export function accessEndsAtFromInterval(
  interval: BillingInterval,
  from = new Date(),
) {
  const d = new Date(from);
  if (interval === "one_time_12m") {
    d.setMonth(d.getMonth() + 12);
    return d.toISOString();
  }
  if (interval === "one_time_18m") {
    d.setMonth(d.getMonth() + 18);
    return d.toISOString();
  }
  if (interval === "year") {
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString();
  }
  return null;
}

export function mrrEstimateRon(
  plan: SubscriptionPlan,
  status: string,
): number {
  if (status !== "active" && status !== "trialing") return 0;
  if (plan === "starter") return 49;
  if (plan === "essentials") return 99;
  if (plan === "premium") return 179;
  if (plan === "agency") return 299;
  return 0;
}
