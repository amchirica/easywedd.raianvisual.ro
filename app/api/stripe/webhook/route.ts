import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  accessEndsAtFromInterval,
  BILLING_PRODUCTS,
  type BillingProductKey,
} from "@/lib/billing/catalog";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe:webhook]", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = serviceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service role missing" }, { status: 503 });
  }

  const { data: existing } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await supabase.from("stripe_events").insert({
    id: event.id,
    event_type: event.type,
    payload: event as unknown as Json,
  });

  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted" ||
    event.type === "invoice.paid" ||
    event.type === "invoice.payment_failed"
  ) {
    await handleEvent(supabase, event);
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(
  supabase: NonNullable<ReturnType<typeof serviceClient>>,
  event: Stripe.Event,
) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const workspaceId = session.metadata?.workspace_id;
    const productKey = session.metadata?.product_key as BillingProductKey | undefined;
    if (!workspaceId || !productKey) return;

    const product = BILLING_PRODUCTS[productKey];
    if (!product) return;

    const ends = accessEndsAtFromInterval(product.interval);
    await supabase
      .from("subscriptions")
      .update({
        plan: product.mapsToPlan,
        status: "active",
        product_key: product.key,
        billing_interval: product.interval,
        access_ends_at: ends,
        stripe_customer_id:
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null,
        stripe_subscription_id:
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null,
      })
      .eq("workspace_id", workspaceId);

    if (product.mode === "payment") {
      await supabase.from("one_time_payments").insert({
        workspace_id: workspaceId,
        product_key: product.key,
        stripe_checkout_session_id: session.id,
        amount_ron: product.oneTimePriceRon,
        status: "succeeded",
        access_starts_at: new Date().toISOString(),
        access_ends_at: ends,
      });
    }

    await supabase.rpc("sync_workspace_entitlements", {
      p_workspace_id: workspaceId,
    });

    await supabase.from("product_events").insert({
      workspace_id: workspaceId,
      event_name: "subscription_started",
      properties: { product_key: product.key },
    });
    return;
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const { data: row } = await supabase
      .from("subscriptions")
      .select("workspace_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (!row) return;

    await supabase
      .from("subscriptions")
      .update({ status: "canceled", cancel_at_period_end: true })
      .eq("workspace_id", row.workspace_id);

    await supabase.rpc("sync_workspace_entitlements", {
      p_workspace_id: row.workspace_id,
    });

    await supabase.from("product_events").insert({
      workspace_id: row.workspace_id,
      event_name: "subscription_cancelled",
      properties: {},
    });
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId =
      typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id;
    if (!customerId) return;
    const { data: row } = await supabase
      .from("subscriptions")
      .select("workspace_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (!row) return;
    await supabase
      .from("subscriptions")
      .update({ status: "past_due" })
      .eq("workspace_id", row.workspace_id);
  }
}
