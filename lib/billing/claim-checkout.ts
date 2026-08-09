import "server-only";

import { createAdminClientAsync } from "@/lib/supabase/admin";
import type { AccessSource, SubscriptionPlan } from "@/types/database";

export type ClaimResult = {
  fulfilled: number;
  workspaceIds: string[];
  error?: string;
};

/**
 * Attach paid public checkouts to the user's workspace.
 * Only fulfills rows already marked `paid` by the Stripe webhook.
 */
export async function fulfillPendingCheckoutsForUser(options: {
  userId: string;
  email: string;
  workspaceId?: string | null;
  claimToken?: string | null;
}): Promise<ClaimResult> {
  const email = options.email.trim().toLowerCase();
  if (!email) return { fulfilled: 0, workspaceIds: [], error: "Email lipsă" };

  const admin = await createAdminClientAsync();

  let query = admin
    .from("pending_checkouts")
    .select("*")
    .eq("status", "paid")
    .order("paid_at", { ascending: true });

  if (options.claimToken) {
    query = query.eq("claim_token", options.claimToken);
  } else {
    query = query.ilike("email", email);
  }

  const { data: pendingRows, error } = await query;
  if (error) {
    return { fulfilled: 0, workspaceIds: [], error: error.message };
  }
  if (!pendingRows?.length) {
    return { fulfilled: 0, workspaceIds: [] };
  }

  let workspaceId = options.workspaceId ?? null;

  if (!workspaceId) {
    const { data: membership } = await admin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", options.userId)
      .eq("invitation_status", "accepted")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    workspaceId = membership?.workspace_id ?? null;
  }

  if (!workspaceId) {
    const { data: owned } = await admin
      .from("workspaces")
      .select("id")
      .eq("owner_id", options.userId)
      .is("soft_deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    workspaceId = owned?.id ?? null;
  }

  if (!workspaceId) {
    // Wait for onboarding to create a workspace; do not invent one here.
    return { fulfilled: 0, workspaceIds: [] };
  }

  const fulfilledIds: string[] = [];

  for (const pending of pendingRows) {
    const pendingEmail = pending.email.trim().toLowerCase();
    if (pendingEmail !== email && !options.claimToken) continue;

    const { data: plan } = await admin
      .from("billing_plans")
      .select("*")
      .eq("key", pending.plan_key)
      .maybeSingle();

    if (!plan) continue;

    let accessEnds: string | null = null;
    if (plan.access_months != null) {
      const d = new Date(pending.paid_at ?? new Date().toISOString());
      d.setMonth(d.getMonth() + plan.access_months);
      accessEnds = d.toISOString();
    }

    const accessSource: AccessSource =
      plan.billing_type === "one_time"
        ? "stripe_one_time"
        : plan.billing_type === "subscription"
          ? "stripe_subscription"
          : "stripe_one_time";

    const subPayload = {
      workspace_id: workspaceId,
      plan: plan.maps_to_subscription_plan as SubscriptionPlan,
      status: "active" as const,
      plan_key: plan.key,
      product_key: plan.key,
      billing_interval: plan.interval,
      access_source: accessSource,
      access_ends_at: accessEnds,
      stripe_customer_id: pending.stripe_customer_id,
      stripe_subscription_id: pending.stripe_subscription_id,
      stripe_checkout_session_id: pending.stripe_checkout_session_id,
      last_payment_at: pending.paid_at,
      last_payment_stripe_id:
        pending.stripe_payment_intent_id ?? pending.stripe_checkout_session_id,
      soft_deleted_at: null,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await admin
      .from("subscriptions")
      .upsert(subPayload, { onConflict: "workspace_id" });

    if (upsertErr) {
      const { error: updErr } = await admin
        .from("subscriptions")
        .update(subPayload)
        .eq("workspace_id", workspaceId);
      if (updErr) continue;
    }

    await admin.rpc("sync_workspace_entitlements", {
      p_workspace_id: workspaceId,
    });

    await admin
      .from("pending_checkouts")
      .update({
        status: "fulfilled",
        fulfilled_at: new Date().toISOString(),
        user_id: options.userId,
        workspace_id: workspaceId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pending.id);

    await admin.from("product_events").insert({
      workspace_id: workspaceId,
      event_name: "public_checkout_fulfilled",
      properties: {
        pending_id: pending.id,
        plan_key: pending.plan_key,
        user_id: options.userId,
      },
    });

    fulfilledIds.push(workspaceId);
  }

  return {
    fulfilled: fulfilledIds.length,
    workspaceIds: [...new Set(fulfilledIds)],
  };
}
