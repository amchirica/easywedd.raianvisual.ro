"use server";

import { redirect } from "next/navigation";

import {
  accessEndsAtFromInterval,
  BILLING_PRODUCTS,
  type BillingProductKey,
} from "@/lib/billing/catalog";
import { getBillingPlan } from "@/lib/billing/plan-catalog";
import {
  isLocalBillingBypassAllowed,
  isStripeConfigured,
} from "@/lib/billing/plans";
import {
  INVALID_STRIPE_PRICE_MESSAGE,
  resolveStripePriceId,
} from "@/lib/billing/stripe-ids";
import { trackProductEvent } from "@/lib/analytics/product";
import { syncWorkspaceEntitlements } from "@/lib/entitlements/service";
import type { ErrorCode } from "@/lib/i18n/errors";
import { getRuntimeEnv, hydrateStripeRuntimeEnv } from "@/lib/runtime-env";
import { getStripe } from "@/lib/stripe";
import { requireWeddingContext } from "@/lib/planner/context";
import { createAdminClientAsync } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/url";

export type ActionState = {
  error?: string;
  errorCode?: ErrorCode;
  success?: string;
};

function billingErrorRedirect(message: string): never {
  redirect(
    `/dashboard/billing?checkout_error=${encodeURIComponent(message)}`,
  );
}

function checkoutMetadata(input: {
  userId: string;
  workspaceId: string;
  plan: string;
  productKey: string;
  planKey: string;
  mapsToPlan: string;
  billingInterval: string;
}) {
  return {
    user_id: input.userId,
    workspace_id: input.workspaceId,
    plan: input.plan,
    product_key: input.productKey,
    plan_key: input.planKey,
    maps_to_plan: input.mapsToPlan,
    billing_interval: input.billingInterval,
  };
}

/**
 * Creates a Stripe Checkout Session for the authenticated workspace.
 * Entitlements are granted only via webhook — never from this action.
 */
export async function startCheckoutAction(
  productKey: BillingProductKey,
): Promise<void> {
  const { hydrateRuntimeEnvAsync } = await import("@/lib/runtime-env");
  await hydrateRuntimeEnvAsync();
  hydrateStripeRuntimeEnv();

  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    billingErrorRedirect(ctx.error ?? "Autentificare necesară.");
  }

  if (!isStripeConfigured()) {
    billingErrorRedirect(
      "Stripe nu este configurat pe server (STRIPE_SECRET_KEY lipsă în Cloudflare Worker).",
    );
  }

  const product = BILLING_PRODUCTS[productKey];
  if (!product || product.mode === "grant") {
    billingErrorRedirect("Plan indisponibil pentru checkout.");
  }

  const plan = await getBillingPlan(productKey);
  // Prefer Cloudflare/runtime Price ID env; DB is fallback catalog override.
  const envPrice = product.envPriceId
    ? getRuntimeEnv(product.envPriceId)
    : undefined;
  const resolved = resolveStripePriceId([envPrice, plan?.stripe_price_id]);
  if ("error" in resolved) {
    billingErrorRedirect(resolved.error || INVALID_STRIPE_PRICE_MESSAGE);
  }

  const priceId = resolved.priceId;
  if (process.env.NODE_ENV !== "production") {
    console.info("[billing.checkout] resolved price", {
      productKey,
      envVar: product.envPriceId,
      pricePrefix: `${priceId.slice(0, 6)}…`,
      priceLen: priceId.length,
    });
  }
  const stripe = getStripe();
  if (!stripe) {
    billingErrorRedirect("Stripe nu este disponibil momentan.");
  }

  const appUrl = getSiteUrl();
  const workspaceId = ctx.context.workspaceId;
  const userId = ctx.context.user!.id;
  const admin = await createAdminClientAsync();
  const planSlug = plan?.key ?? product.key;

  const { data: sub } = await ctx.context.supabase
    .from("subscriptions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  let customerId = sub?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.context.user!.email,
      metadata: {
        user_id: userId,
        workspace_id: workspaceId,
      },
    });
    customerId = customer.id;
    // Billing writes are service-role only (RLS blocks owner updates).
    await admin
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("workspace_id", workspaceId);
  }

  const metadata = checkoutMetadata({
    userId,
    workspaceId,
    plan: planSlug,
    productKey: product.key,
    planKey: planSlug,
    mapsToPlan: product.mapsToPlan,
    billingInterval: product.interval,
  });

  const mode = product.mode === "payment" ? "payment" : "subscription";

  const session = await stripe.checkout.sessions.create({
    mode,
    customer: customerId,
    client_reference_id: workspaceId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=canceled`,
    metadata,
    ...(mode === "subscription"
      ? { subscription_data: { metadata } }
      : { payment_intent_data: { metadata } }),
  });

  if (!session.url) {
    billingErrorRedirect("Stripe nu a returnat URL de checkout.");
  }

  redirect(session.url);
}

export async function openBillingPortalAction() {
  const { hydrateRuntimeEnvAsync } = await import("@/lib/runtime-env");
  await hydrateRuntimeEnvAsync();
  hydrateStripeRuntimeEnv();

  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    billingErrorRedirect(ctx.error ?? "Autentificare necesară.");
  }
  if (!isStripeConfigured()) {
    billingErrorRedirect("Stripe nu este configurat pe server.");
  }

  const stripe = getStripe();
  if (!stripe) {
    billingErrorRedirect("Stripe nu este disponibil momentan.");
  }

  const { data: sub } = await ctx.context.supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("workspace_id", ctx.context.workspaceId)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    billingErrorRedirect(
      "Nu există încă un client Stripe pentru acest spațiu. Fă mai întâi un Checkout.",
    );
  }

  const appUrl = getSiteUrl();

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appUrl}/dashboard/billing`,
  });

  if (!portal.url) {
    billingErrorRedirect("Nu am putut deschide Stripe Customer Portal.");
  }

  redirect(portal.url);
}

/**
 * Local-only helper when Stripe is not configured.
 * Hard-blocked in production — never self-grant paid access live.
 */
export async function grantLocalPassAction(productKey: BillingProductKey) {
  if (!isLocalBillingBypassAllowed()) return;

  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;

  const product = BILLING_PRODUCTS[productKey];
  if (!product) return;

  const ends = accessEndsAtFromInterval(product.interval);
  const admin = await createAdminClientAsync();
  await admin
    .from("subscriptions")
    .update({
      plan: product.mapsToPlan,
      status: "active",
      product_key: product.key,
      plan_key: product.key,
      billing_interval: product.interval,
      access_source: "admin_grant",
      access_ends_at: ends,
    })
    .eq("workspace_id", ctx.context.workspaceId);

  await syncWorkspaceEntitlements(ctx.context.workspaceId);
  await trackProductEvent("subscription_started", {
    workspaceId: ctx.context.workspaceId,
    userId: ctx.context.user!.id,
    properties: { product_key: product.key, local: true },
  });

  redirect("/dashboard/billing?checkout=local");
}
