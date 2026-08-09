import "server-only";

import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  accessEndsAtFromInterval,
  BILLING_PRODUCTS,
  type BillingProductKey,
} from "@/lib/billing/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { getRuntimeEnv, hydrateStripeRuntimeEnv } from "@/lib/runtime-env";
import type { AccessSource, Json, SubscriptionPlan } from "@/types/database";

function serviceClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

function mapSubscriptionStatus(
  status: Stripe.Subscription.Status,
): "active" | "trialing" | "past_due" | "canceled" | "incomplete" {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}

export async function POST(request: Request) {
  hydrateStripeRuntimeEnv();

  const stripe = getStripe();
  const webhookSecret = getRuntimeEnv("STRIPE_WEBHOOK_SECRET");
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
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = serviceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service role missing" }, { status: 503 });
  }

  const { data: existing } = await supabase
    .from("stripe_events")
    .select("id, processing_ok")
    .eq("id", event.id)
    .maybeSingle();

  if (existing?.processing_ok) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (!existing) {
    const { error: insertError } = await supabase.from("stripe_events").insert({
      id: event.id,
      event_type: event.type,
      payload: event as unknown as Json,
      processing_ok: false,
    });
    // Race: another worker inserted first — continue only if we can claim processing.
    if (insertError) {
      const { data: raced } = await supabase
        .from("stripe_events")
        .select("id, processing_ok")
        .eq("id", event.id)
        .maybeSingle();
      if (raced?.processing_ok) {
        return NextResponse.json({ received: true, duplicate: true });
      }
      if (!raced) {
        console.error("[stripe:webhook] event insert failed");
        return NextResponse.json({ error: "Event persist failed" }, { status: 500 });
      }
    }
  }

  const handled = new Set([
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
    "invoice.payment_failed",
    "charge.refunded",
  ]);

  try {
    if (handled.has(event.type)) {
      await handleEvent(supabase, event);
    }
    await supabase
      .from("stripe_events")
      .update({ processing_ok: true })
      .eq("id", event.id);
  } catch (err) {
    console.error("[stripe:webhook] handler failed", {
      type: event.type,
      message: err instanceof Error ? err.message : "unknown",
    });
    // 500 → Stripe retries; processing_ok stays false
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

type AdminDb = NonNullable<ReturnType<typeof serviceClient>>;

async function handleEvent(supabase: AdminDb, event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (
      session.payment_status !== "paid" &&
      session.payment_status !== "no_payment_required"
    ) {
      return;
    }

    const isPublic = session.metadata?.public_checkout === "1";
    const planKey =
      session.metadata?.plan ||
      session.metadata?.plan_key ||
      session.metadata?.product_key ||
      "";

    if (isPublic) {
      await fulfillPublicCheckout(supabase, session, planKey);
      return;
    }

    const workspaceId = session.metadata?.workspace_id;
    const productKey = (session.metadata?.product_key ||
      session.metadata?.plan ||
      planKey) as BillingProductKey;
    if (!workspaceId || !productKey) return;

    const product = BILLING_PRODUCTS[productKey];
    const ends = product
      ? accessEndsAtFromInterval(product.interval)
      : null;
    const accessSource: AccessSource =
      product?.mode === "payment" ? "stripe_one_time" : "stripe_subscription";

    await supabase
      .from("subscriptions")
      .update({
        plan: (product?.mapsToPlan ?? "starter") as SubscriptionPlan,
        status: "active",
        product_key: productKey,
        plan_key: planKey || productKey,
        billing_interval: product?.interval ?? "month",
        access_source: accessSource,
        access_ends_at: ends,
        stripe_checkout_session_id: session.id,
        stripe_customer_id: customerId(session.customer),
        stripe_subscription_id: subId(session.subscription),
        last_payment_at: new Date().toISOString(),
        last_payment_stripe_id: typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
        soft_deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", workspaceId);

    if (product?.mode === "payment") {
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
      properties: { product_key: productKey, via: "webhook" },
    });
    return;
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const sub = event.data.object as Stripe.Subscription;
    const customer = customerId(sub.customer);
    const workspaceFromMeta = sub.metadata?.workspace_id || null;
    const planFromMeta =
      sub.metadata?.plan ||
      sub.metadata?.plan_key ||
      sub.metadata?.product_key ||
      null;
    const productFromMeta = (sub.metadata?.product_key ||
      planFromMeta) as BillingProductKey | null;
    const catalogProduct = productFromMeta
      ? BILLING_PRODUCTS[productFromMeta]
      : undefined;

    let workspaceId = workspaceFromMeta;
    if (!workspaceId && customer) {
      const { data: row } = await supabase
        .from("subscriptions")
        .select("workspace_id")
        .eq("stripe_customer_id", customer)
        .maybeSingle();
      workspaceId = row?.workspace_id ?? null;
    }
    if (!workspaceId) return;

    const periodEnd = (sub as { current_period_end?: number }).current_period_end;
    const status = mapSubscriptionStatus(sub.status);
    await supabase
      .from("subscriptions")
      .update({
        ...(catalogProduct
          ? {
              plan: catalogProduct.mapsToPlan as SubscriptionPlan,
              product_key: catalogProduct.key,
              plan_key: planFromMeta || catalogProduct.key,
              billing_interval: catalogProduct.interval,
            }
          : {}),
        status,
        cancel_at_period_end: Boolean(sub.cancel_at_period_end),
        stripe_subscription_id: sub.id,
        stripe_customer_id: customer,
        current_period_ends_at: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
        access_source: "stripe_subscription",
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", workspaceId);

    await supabase.rpc("sync_workspace_entitlements", {
      p_workspace_id: workspaceId,
    });
    return;
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customer = customerId(sub.customer);
    if (!customer) return;
    const { data: row } = await supabase
      .from("subscriptions")
      .select("workspace_id")
      .eq("stripe_customer_id", customer)
      .maybeSingle();
    if (!row) return;

    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", row.workspace_id);

    await supabase.rpc("sync_workspace_entitlements", {
      p_workspace_id: row.workspace_id,
    });
    await supabase.from("product_events").insert({
      workspace_id: row.workspace_id,
      event_name: "subscription_cancelled",
      properties: { via: "webhook" },
    });
    return;
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const customer = customerId(invoice.customer);
    if (!customer) return;
    const { data: row } = await supabase
      .from("subscriptions")
      .select("workspace_id")
      .eq("stripe_customer_id", customer)
      .maybeSingle();
    if (!row) return;

    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        last_payment_at: new Date().toISOString(),
        last_payment_stripe_id: invoice.id,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", row.workspace_id);

    await supabase.rpc("sync_workspace_entitlements", {
      p_workspace_id: row.workspace_id,
    });
    return;
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customer = customerId(invoice.customer);
    if (!customer) return;
    const { data: row } = await supabase
      .from("subscriptions")
      .select("workspace_id")
      .eq("stripe_customer_id", customer)
      .maybeSingle();
    if (!row) return;
    await supabase
      .from("subscriptions")
      .update({ status: "past_due", updated_at: new Date().toISOString() })
      .eq("workspace_id", row.workspace_id);
    await supabase.rpc("sync_workspace_entitlements", {
      p_workspace_id: row.workspace_id,
    });
    await supabase.from("product_events").insert({
      workspace_id: row.workspace_id,
      event_name: "payment_failed",
      properties: { via: "webhook", invoice_id: invoice.id },
    });
    return;
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const customer = customerId(charge.customer);
    if (!customer) return;
    const { data: row } = await supabase
      .from("subscriptions")
      .select("workspace_id")
      .eq("stripe_customer_id", customer)
      .maybeSingle();
    if (!row) return;

    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        admin_notes: "Revocat după refund Stripe",
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", row.workspace_id);

    await supabase
      .from("pending_checkouts")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("stripe_customer_id", customer);

    await supabase.rpc("sync_workspace_entitlements", {
      p_workspace_id: row.workspace_id,
    });
  }
}

async function fulfillPublicCheckout(
  supabase: AdminDb,
  session: Stripe.Checkout.Session,
  planKey: string,
) {
  const pendingId = session.metadata?.pending_checkout_id;
  if (pendingId) {
    await supabase
      .from("pending_checkouts")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_checkout_session_id: session.id,
        stripe_customer_id: customerId(session.customer),
        stripe_subscription_id: subId(session.subscription),
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingId);
  }

  await supabase.from("product_events").insert({
    workspace_id: null,
    event_name: "public_checkout_paid",
    properties: {
      plan_key: planKey,
      session_id: session.id,
      email: session.customer_details?.email ?? session.customer_email,
    },
  });
}

function customerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function subId(
  subscription: string | Stripe.Subscription | null | undefined,
): string | null {
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}
