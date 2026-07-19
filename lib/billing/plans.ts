import { BILLING_PRODUCTS } from "@/lib/billing/catalog";
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

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}
