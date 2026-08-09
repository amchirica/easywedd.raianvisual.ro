"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  getBillingPlan,
  resolveCheckoutPriceForPlan,
} from "@/lib/billing/plan-catalog";
import { INVALID_STRIPE_PRICE_MESSAGE } from "@/lib/billing/stripe-ids";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/url";

export type PublicCheckoutResult = {
  error?: string;
};

/**
 * Public Stripe Checkout for customers without an account.
 * Entitlements are granted only via webhook after payment.
 */
export async function startPublicCheckoutAction(
  _prev: PublicCheckoutResult,
  formData: FormData,
): Promise<PublicCheckoutResult> {
  const parsed = z
    .object({
      email: z.string().email("Email invalid"),
      plan_key: z.string().min(1),
    })
    .safeParse({
      email: String(formData.get("email") ?? "")
        .trim()
        .toLowerCase(),
      plan_key: formData.get("plan_key"),
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "validation.invalid" };
  }

  const plan = await getBillingPlan(parsed.data.plan_key);
  if (!plan || !plan.is_public || plan.billing_type === "grant") {
    return { error: "Plan indisponibil pentru checkout public." };
  }

  const resolved = resolveCheckoutPriceForPlan(plan);
  if ("error" in resolved) {
    return {
      error:
        resolved.error === INVALID_STRIPE_PRICE_MESSAGE
          ? "Selected billing plan does not have a valid Stripe Price ID configured."
          : resolved.error,
    };
  }
  const priceId = resolved.priceId;
  const stripe = getStripe();
  if (!stripe) {
    return {
      error:
        "Plățile Stripe nu sunt configurate încă. Contactează-ne sau încearcă mai târziu.",
    };
  }

  const claimToken = crypto.randomUUID();
  const admin = createAdminClient();

  const { data: pending, error: pendingError } = await admin
    .from("pending_checkouts")
    .insert({
      email: parsed.data.email,
      plan_key: plan.key,
      status: "pending",
      claim_token: claimToken,
    })
    .select("id")
    .single();

  if (pendingError || !pending) {
    return { error: "Nu am putut iniția checkout-ul." };
  }

  const site = getSiteUrl();
  const mode = plan.billing_type === "one_time" ? "payment" : "subscription";

  const session = await stripe.checkout.sessions.create({
    mode,
    customer_email: parsed.data.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${site}/checkout/success?claim=${claimToken}`,
    cancel_url: `${site}/pricing?canceled=1`,
    metadata: {
      plan_key: plan.key,
      pending_checkout_id: pending.id,
      claim_token: claimToken,
      public_checkout: "1",
    },
  });

  await admin
    .from("pending_checkouts")
    .update({
      stripe_checkout_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pending.id);

  if (!session.url) {
    return { error: "Stripe nu a returnat URL de checkout." };
  }

  redirect(session.url);
}
