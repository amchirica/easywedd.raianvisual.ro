"use server";

import { redirect } from "next/navigation";

import {
  accessEndsAtFromInterval,
  BILLING_PRODUCTS,
  getStripePriceId,
  type BillingProductKey,
} from "@/lib/billing/catalog";
import { trackProductEvent } from "@/lib/analytics/product";
import { syncWorkspaceEntitlements } from "@/lib/entitlements/service";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { requireWeddingContext } from "@/lib/planner/context";
import { getSiteUrl } from "@/lib/url";

export async function startCheckoutAction(productKey: BillingProductKey) {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;

  if (!isStripeConfigured()) return;

  const product = BILLING_PRODUCTS[productKey];
  if (!product || product.mode === "grant") return;

  const priceId = getStripePriceId(product);
  const stripe = getStripe();
  if (!stripe || !priceId) return;

  const appUrl = getSiteUrl();

  const { data: sub } = await ctx.context.supabase
    .from("subscriptions")
    .select("*")
    .eq("workspace_id", ctx.context.workspaceId)
    .maybeSingle();

  let customerId = sub?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.context.user!.email,
      metadata: { workspace_id: ctx.context.workspaceId },
    });
    customerId = customer.id;
    await ctx.context.supabase
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("workspace_id", ctx.context.workspaceId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: product.mode === "payment" ? "payment" : "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/billing`,
    metadata: {
      workspace_id: ctx.context.workspaceId,
      product_key: product.key,
      maps_to_plan: product.mapsToPlan,
      billing_interval: product.interval,
    },
  });

  if (session.url) redirect(session.url);
}

export async function openBillingPortalAction() {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!isStripeConfigured()) return;

  const stripe = getStripe();
  if (!stripe) return;

  const { data: sub } = await ctx.context.supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("workspace_id", ctx.context.workspaceId)
    .maybeSingle();

  if (!sub?.stripe_customer_id) return;

  const appUrl = getSiteUrl();

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appUrl}/dashboard/billing`,
  });

  if (portal.url) redirect(portal.url);
}

/** Dev/admin helper when Stripe is not configured — grant pass locally. */
export async function grantLocalPassAction(productKey: BillingProductKey) {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (isStripeConfigured()) return;

  const product = BILLING_PRODUCTS[productKey];
  if (!product) return;

  const ends = accessEndsAtFromInterval(product.interval);
  await ctx.context.supabase
    .from("subscriptions")
    .update({
      plan: product.mapsToPlan,
      status: "active",
      product_key: product.key,
      billing_interval: product.interval,
      access_ends_at: ends,
    })
    .eq("workspace_id", ctx.context.workspaceId);

  await syncWorkspaceEntitlements(ctx.context.workspaceId);
  await trackProductEvent("subscription_started", {
    workspaceId: ctx.context.workspaceId,
    userId: ctx.context.user!.id,
    properties: { product_key: product.key, local: true },
  });
}
