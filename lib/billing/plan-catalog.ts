import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { BillingInterval, SubscriptionPlan } from "@/types/database";

export type BillingPlanRow = {
  key: string;
  name: string;
  description: string;
  maps_to_subscription_plan: SubscriptionPlan;
  billing_type: "subscription" | "one_time" | "grant" | "trial";
  interval: BillingInterval;
  guest_limit: number;
  website_publishing: boolean;
  pdf_export: boolean;
  invitations: boolean;
  seating: boolean;
  vendors: boolean;
  analytics: boolean;
  storage_mb: number;
  workspace_limit: number;
  access_months: number | null;
  stripe_price_env: string | null;
  is_public: boolean;
  sort_order: number;
};

/** Fallback when DB plans table not yet migrated. */
export const FALLBACK_BILLING_PLANS: BillingPlanRow[] = [
  {
    key: "starter",
    name: "Starter",
    description: "Planificare de bază, abonament lunar.",
    maps_to_subscription_plan: "starter",
    billing_type: "subscription",
    interval: "month",
    guest_limit: 100,
    website_publishing: false,
    pdf_export: false,
    invitations: true,
    seating: true,
    vendors: true,
    analytics: false,
    storage_mb: 500,
    workspace_limit: 1,
    access_months: null,
    stripe_price_env: "STRIPE_PRICE_STARTER_MONTHLY",
    is_public: true,
    sort_order: 10,
  },
  {
    key: "essentials",
    name: "Essentials / Partner",
    description: "Planner + invitații + site.",
    maps_to_subscription_plan: "essentials",
    billing_type: "grant",
    interval: "grant",
    guest_limit: 500,
    website_publishing: true,
    pdf_export: true,
    invitations: true,
    seating: true,
    vendors: true,
    analytics: true,
    storage_mb: 5000,
    workspace_limit: 1,
    access_months: 12,
    stripe_price_env: null,
    is_public: true,
    sort_order: 20,
  },
  {
    key: "premium_pass_12",
    name: "Premium Wedding Pass — 12 luni",
    description: "Acces Premium 12 luni (plată unică).",
    maps_to_subscription_plan: "premium",
    billing_type: "one_time",
    interval: "one_time_12m",
    guest_limit: 5000,
    website_publishing: true,
    pdf_export: true,
    invitations: true,
    seating: true,
    vendors: true,
    analytics: true,
    storage_mb: 20000,
    workspace_limit: 1,
    access_months: 12,
    stripe_price_env: "STRIPE_PRICE_PREMIUM_PASS_12",
    is_public: true,
    sort_order: 30,
  },
  {
    key: "premium_pass_18",
    name: "Premium Wedding Pass — 18 luni",
    description: "Acces Premium 18 luni (plată unică).",
    maps_to_subscription_plan: "premium",
    billing_type: "one_time",
    interval: "one_time_18m",
    guest_limit: 5000,
    website_publishing: true,
    pdf_export: true,
    invitations: true,
    seating: true,
    vendors: true,
    analytics: true,
    storage_mb: 20000,
    workspace_limit: 1,
    access_months: 18,
    stripe_price_env: "STRIPE_PRICE_PREMIUM_PASS_18",
    is_public: true,
    sort_order: 40,
  },
  {
    key: "pro",
    name: "Pro",
    description: "Pentru profesioniști — abonament.",
    maps_to_subscription_plan: "agency",
    billing_type: "subscription",
    interval: "month",
    guest_limit: 5000,
    website_publishing: true,
    pdf_export: true,
    invitations: true,
    seating: true,
    vendors: true,
    analytics: true,
    storage_mb: 50000,
    workspace_limit: 50,
    access_months: null,
    stripe_price_env: "STRIPE_PRICE_PRO_MONTHLY",
    is_public: true,
    sort_order: 50,
  },
];

export async function listPublicBillingPlans(): Promise<BillingPlanRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("billing_plans")
      .select("*")
      .eq("is_public", true)
      .order("sort_order");
    if (error || !data?.length) return FALLBACK_BILLING_PLANS;
    return data as BillingPlanRow[];
  } catch {
    return FALLBACK_BILLING_PLANS;
  }
}

export async function getBillingPlan(
  key: string,
): Promise<BillingPlanRow | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("billing_plans")
      .select("*")
      .eq("key", key)
      .maybeSingle();
    if (data) return data as BillingPlanRow;
  } catch {
    /* fallback */
  }
  return FALLBACK_BILLING_PLANS.find((p) => p.key === key) ?? null;
}

export function getStripePriceIdForPlan(plan: BillingPlanRow): string | null {
  if (!plan.stripe_price_env) return null;
  return process.env[plan.stripe_price_env] || null;
}

export {
  ACCESS_SOURCE_LABELS,
  CONTRACT_STATUS_LABELS,
} from "@/lib/billing/labels";
