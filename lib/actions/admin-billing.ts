"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { isProtectedSystemWorkspace } from "@/lib/admin/auth";
import { logAudit } from "@/lib/planner/context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccessSource, ContractStatus, SubscriptionPlan } from "@/types/database";

export type AdminBillingResult = { error?: string; success?: string };

async function assertAdmin() {
  const auth = await requirePlatformAdmin();
  if (!auth.ok || !auth.user) {
    return { ok: false as const, error: auth.error, user: null };
  }
  return { ok: true as const, error: null, user: auth.user, supabase: auth.supabase };
}

export async function adminGrantAccessAction(
  _prev: AdminBillingResult,
  formData: FormData,
): Promise<AdminBillingResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { error: auth.error };

  const schema = z.object({
    user_id: z.string().uuid().optional().or(z.literal("")),
    workspace_id: z.string().uuid({ message: "Selectează workspace-ul" }),
    plan_key: z.string().min(1, "Selectează planul"),
    access_source: z
      .enum([
        "admin_grant",
        "partner",
        "trial",
        "stripe_subscription",
        "stripe_one_time",
        "legacy",
      ])
      .default("admin_grant"),
    status: z
      .enum(["active", "trialing", "past_due", "canceled", "incomplete"])
      .default("active"),
    access_months: z.coerce.number().int().min(0).max(120).optional(),
    permanent: z.boolean().optional(),
    starts_at: z.string().optional(),
    access_ends_at: z.string().optional(),
    notes: z.string().max(2000).optional(),
    allow_duplicate_plan: z.boolean().optional(),
  });

  const parsed = schema.safeParse({
    user_id: formData.get("user_id") || "",
    workspace_id: formData.get("workspace_id"),
    plan_key: formData.get("plan_key"),
    access_source: formData.get("access_source") || "admin_grant",
    status: formData.get("status") || "active",
    access_months: formData.get("access_months") || undefined,
    permanent: formData.get("permanent") === "on",
    starts_at: String(formData.get("starts_at") || ""),
    access_ends_at: String(formData.get("access_ends_at") || ""),
    notes: String(formData.get("notes") || ""),
    allow_duplicate_plan: formData.get("allow_duplicate_plan") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const admin = createAdminClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("id, workspace_type")
    .eq("id", parsed.data.workspace_id)
    .maybeSingle();

  if (!workspace) return { error: "Workspace inexistent" };
  if (isProtectedSystemWorkspace(workspace)) {
    return { error: "Nu poți modifica workspace-uri de sistem (tip admin). Alege un workspace couple." };
  }

  const { data: plan } = await admin
    .from("billing_plans")
    .select("*")
    .eq("key", parsed.data.plan_key)
    .maybeSingle();

  if (!plan) return { error: "Plan inexistent" };

  const { data: existing } = await admin
    .from("subscriptions")
    .select("id, plan_key, status, soft_deleted_at")
    .eq("workspace_id", parsed.data.workspace_id)
    .is("soft_deleted_at", null)
    .maybeSingle();

  if (
    existing &&
    existing.plan_key === plan.key &&
    (existing.status === "active" || existing.status === "trialing") &&
    !parsed.data.allow_duplicate_plan
  ) {
    // Same workspace already has this active plan — update instead of blocking,
    // unless caller only wanted a no-op guard. We update in place.
  }

  let accessEnds: string | null = null;
  if (parsed.data.permanent) {
    accessEnds = null;
  } else if (parsed.data.access_ends_at) {
    accessEnds = new Date(parsed.data.access_ends_at).toISOString();
  } else {
    const months = parsed.data.access_months ?? plan.access_months ?? 12;
    const d = parsed.data.starts_at
      ? new Date(parsed.data.starts_at)
      : new Date();
    d.setMonth(d.getMonth() + months);
    accessEnds = d.toISOString();
  }

  const startsAt = parsed.data.starts_at
    ? new Date(parsed.data.starts_at).toISOString()
    : new Date().toISOString();
  void startsAt;

  const payload = {
    workspace_id: parsed.data.workspace_id,
    plan: plan.maps_to_subscription_plan as SubscriptionPlan,
    status: parsed.data.status,
    plan_key: plan.key,
    product_key: plan.key,
    billing_interval: plan.interval,
    access_source: parsed.data.access_source as AccessSource,
    access_ends_at: accessEnds,
    admin_notes: parsed.data.notes || null,
    granted_by: auth.user.id,
    soft_deleted_at: null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error: updErr } = await admin
      .from("subscriptions")
      .update(payload)
      .eq("id", existing.id);
    if (updErr) return { error: "Nu am putut actualiza accesul." };
  } else {
    const { error } = await admin.from("subscriptions").insert(payload);
    if (error) {
      const { error: upsertErr } = await admin
        .from("subscriptions")
        .upsert(payload, { onConflict: "workspace_id" });
      if (upsertErr) return { error: "Nu am putut acorda accesul." };
    }
  }

  await admin.rpc("sync_workspace_entitlements", {
    p_workspace_id: parsed.data.workspace_id,
  });

  await logAudit(
    parsed.data.workspace_id,
    auth.user.id,
    "admin.subscription.grant",
    "subscription",
    parsed.data.workspace_id,
    {
      plan_key: plan.key,
      access_ends: accessEnds,
      access_source: parsed.data.access_source,
      user_id: parsed.data.user_id || null,
    },
  );

  revalidatePath("/admin/subscriptions");
  revalidatePath(`/admin/workspaces/${parsed.data.workspace_id}`);
  return { success: "Acces acordat." };
}

export async function adminReactivateAccessAction(
  workspaceId: string,
): Promise<void> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return;

  const admin = createAdminClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("workspace_type")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!workspace || isProtectedSystemWorkspace(workspace)) return;

  await admin
    .from("subscriptions")
    .update({
      status: "active",
      soft_deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId);

  await admin.rpc("sync_workspace_entitlements", {
    p_workspace_id: workspaceId,
  });

  await logAudit(
    workspaceId,
    auth.user.id,
    "admin.subscription.reactivate",
    "subscription",
    workspaceId,
    {},
  );
  revalidatePath("/admin/subscriptions");
}

export async function adminReactivateAccessBound(
  workspaceId: string,
): Promise<void> {
  await adminReactivateAccessAction(workspaceId);
}

export async function adminExtendAccessFormAction(
  formData: FormData,
): Promise<void> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return;

  const parsed = z
    .object({
      workspace_id: z.string().uuid(),
      months: z.coerce.number().int().min(1).max(60).default(3),
    })
    .safeParse({
      workspace_id: formData.get("workspace_id"),
      months: formData.get("months") || 3,
    });
  if (!parsed.success) return;

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("access_ends_at")
    .eq("workspace_id", parsed.data.workspace_id)
    .is("soft_deleted_at", null)
    .maybeSingle();

  const base = sub?.access_ends_at
    ? new Date(sub.access_ends_at)
    : new Date();
  if (base < new Date()) {
    base.setTime(Date.now());
  }
  base.setMonth(base.getMonth() + parsed.data.months);

  await admin
    .from("subscriptions")
    .update({
      access_ends_at: base.toISOString(),
      status: "active",
      soft_deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", parsed.data.workspace_id);

  await admin.rpc("sync_workspace_entitlements", {
    p_workspace_id: parsed.data.workspace_id,
  });

  await logAudit(
    parsed.data.workspace_id,
    auth.user.id,
    "admin.subscription.extend",
    "subscription",
    parsed.data.workspace_id,
    { months: parsed.data.months },
  );
  revalidatePath("/admin/subscriptions");
}

export async function adminRevokeAccessAction(
  workspaceId: string,
): Promise<void> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return;

  const admin = createAdminClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("workspace_type")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!workspace || isProtectedSystemWorkspace(workspace)) return;

  await admin
    .from("subscriptions")
    .update({
      status: "canceled",
      soft_deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId);

  await admin.rpc("sync_workspace_entitlements", {
    p_workspace_id: workspaceId,
  });

  await logAudit(
    workspaceId,
    auth.user.id,
    "admin.subscription.revoke",
    "subscription",
    workspaceId,
    {},
  );
  revalidatePath("/admin/subscriptions");
}

export async function adminUpdateSubscriptionDatesAction(
  _prev: AdminBillingResult,
  formData: FormData,
): Promise<AdminBillingResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { error: auth.error };

  const parsed = z
    .object({
      workspace_id: z.string().uuid(),
      access_ends_at: z.string().optional(),
      admin_notes: z.string().max(2000).optional(),
    })
    .safeParse({
      workspace_id: formData.get("workspace_id"),
      access_ends_at: String(formData.get("access_ends_at") || ""),
      admin_notes: String(formData.get("admin_notes") || ""),
    });

  if (!parsed.success) return { error: "Date invalide" };

  const admin = createAdminClient();
  const ends = parsed.data.access_ends_at
    ? new Date(parsed.data.access_ends_at).toISOString()
    : null;

  const { error } = await admin
    .from("subscriptions")
    .update({
      access_ends_at: ends,
      admin_notes: parsed.data.admin_notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", parsed.data.workspace_id);

  if (error) return { error: "Nu am putut actualiza abonamentul." };

  await admin.rpc("sync_workspace_entitlements", {
    p_workspace_id: parsed.data.workspace_id,
  });

  await logAudit(
    parsed.data.workspace_id,
    auth.user.id,
    "admin.subscription.update",
    "subscription",
    parsed.data.workspace_id,
    { access_ends_at: ends },
  );

  revalidatePath("/admin/subscriptions");
  return { success: "Abonament actualizat." };
}

export async function adminSuspendUserAction(userId: string): Promise<void> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return;
  if (auth.user.id === userId) return;

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ suspended_at: new Date().toISOString() })
    .eq("id", userId);

  await logAudit(null, auth.user.id, "admin.user.suspend", "profile", userId, {});
  revalidatePath("/admin/users");
}

export async function adminReactivateUserAction(userId: string): Promise<void> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return;

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ suspended_at: null })
    .eq("id", userId);

  await logAudit(
    null,
    auth.user.id,
    "admin.user.reactivate",
    "profile",
    userId,
    {},
  );
  revalidatePath("/admin/users");
}

export async function adminGrantAccessFormAction(
  formData: FormData,
): Promise<void> {
  await adminGrantAccessAction({}, formData);
}

export async function adminUpdateSubscriptionDatesFormAction(
  formData: FormData,
): Promise<void> {
  await adminUpdateSubscriptionDatesAction({}, formData);
}

export async function adminUpsertContractFormAction(
  formData: FormData,
): Promise<void> {
  await adminUpsertContractAction({}, formData);
}

export async function adminReactivateUserBound(
  workspaceId: string,
  userId: string,
): Promise<void> {
  void workspaceId;
  await adminReactivateUserAction(userId);
}

export async function adminSuspendUserBound(
  workspaceId: string,
  userId: string,
): Promise<void> {
  void workspaceId;
  await adminSuspendUserAction(userId);
}

export async function adminRevokeAccessBound(
  workspaceId: string,
): Promise<void> {
  await adminRevokeAccessAction(workspaceId);
}

export async function adminSoftDeleteWorkspaceBound(
  workspaceId: string,
): Promise<void> {
  await adminSoftDeleteWorkspaceAction(workspaceId);
}

export async function adminSoftDeleteWorkspaceAction(
  workspaceId: string,
): Promise<void> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return;

  const admin = createAdminClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("workspace_type")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!workspace || isProtectedSystemWorkspace(workspace)) return;

  await admin
    .from("workspaces")
    .update({
      status: "archived",
      soft_deleted_at: new Date().toISOString(),
    })
    .eq("id", workspaceId);

  await logAudit(
    workspaceId,
    auth.user.id,
    "admin.workspace.soft_delete",
    "workspace",
    workspaceId,
    {},
  );
  revalidatePath("/admin/workspaces");
}

export async function adminUpsertContractAction(
  _prev: AdminBillingResult,
  formData: FormData,
): Promise<AdminBillingResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { error: auth.error };

  const parsed = z
    .object({
      id: z.string().uuid().optional().or(z.literal("")),
      user_id: z.string().uuid().optional().or(z.literal("")),
      workspace_id: z.string().uuid({ message: "Selectează workspace-ul" }),
      subscription_id: z.string().uuid().optional().or(z.literal("")),
      title: z.string().min(2).max(200),
      plan_key: z.string().optional(),
      status: z.enum([
        "draft",
        "pending_signature",
        "active",
        "expired",
        "canceled",
        "completed",
      ]),
      document_url: z.string().url().optional().or(z.literal("")),
      starts_at: z.string().optional(),
      ends_at: z.string().optional(),
      internal_notes: z.string().max(4000).optional(),
      signature_status: z
        .enum(["unsigned", "sent", "signed", "declined"])
        .default("unsigned"),
    })
    .safeParse({
      id: formData.get("id") || "",
      user_id: formData.get("user_id") || "",
      workspace_id: formData.get("workspace_id"),
      subscription_id: formData.get("subscription_id") || "",
      title: formData.get("title"),
      plan_key: formData.get("plan_key") || "",
      status: formData.get("status") || "draft",
      document_url: formData.get("document_url") || "",
      starts_at: formData.get("starts_at") || "",
      ends_at: formData.get("ends_at") || "",
      internal_notes: formData.get("internal_notes") || "",
      signature_status: formData.get("signature_status") || "unsigned",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const admin = createAdminClient();
  const row = {
    workspace_id: parsed.data.workspace_id,
    user_id: parsed.data.user_id || null,
    subscription_id: parsed.data.subscription_id || null,
    title: parsed.data.title,
    plan_key: parsed.data.plan_key || null,
    status: parsed.data.status as ContractStatus,
    document_url: parsed.data.document_url || null,
    starts_at: parsed.data.starts_at
      ? new Date(parsed.data.starts_at).toISOString()
      : null,
    ends_at: parsed.data.ends_at
      ? new Date(parsed.data.ends_at).toISOString()
      : null,
    internal_notes: parsed.data.internal_notes || null,
    signature_status: parsed.data.signature_status,
    created_by: auth.user.id,
    updated_at: new Date().toISOString(),
    soft_deleted_at: null,
  };

  if (parsed.data.id) {
    const { error } = await admin
      .from("contracts")
      .update(row)
      .eq("id", parsed.data.id);
    if (error) return { error: "Nu am putut actualiza contractul." };
  } else {
    const { error } = await admin.from("contracts").insert(row);
    if (error) return { error: "Nu am putut crea contractul." };
  }

  await logAudit(
    parsed.data.workspace_id,
    auth.user.id,
    "admin.contract.upsert",
    "contract",
    parsed.data.id || null,
    { status: parsed.data.status },
  );

  revalidatePath("/admin/contracts");
  return { success: "Contract salvat." };
}

export async function adminSoftDeleteContractAction(
  contractId: string,
): Promise<void> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return;

  const admin = createAdminClient();
  const { data: contract } = await admin
    .from("contracts")
    .select("id, workspace_id")
    .eq("id", contractId)
    .maybeSingle();
  if (!contract) return;

  await admin
    .from("contracts")
    .update({
      soft_deleted_at: new Date().toISOString(),
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId);

  await logAudit(
    contract.workspace_id,
    auth.user.id,
    "admin.contract.soft_delete",
    "contract",
    contractId,
    {},
  );
  revalidatePath("/admin/contracts");
}

export async function adminSoftDeleteContractBound(
  workspaceId: string,
  contractId: string,
): Promise<void> {
  void workspaceId;
  await adminSoftDeleteContractAction(contractId);
}

export async function adminUpdateBillingPlanStripeIdsAction(
  _prev: AdminBillingResult,
  formData: FormData,
): Promise<AdminBillingResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { error: auth.error };

  const {
    isValidStripePriceId,
    isValidStripeProductId,
  } = await import("@/lib/billing/stripe-ids");

  const key = String(formData.get("key") || "").trim();
  if (!key) return { error: "Plan key lipsește." };

  const productRaw = String(formData.get("stripe_product_id") || "").trim();
  const priceRaw = String(formData.get("stripe_price_id") || "").trim();

  if (productRaw && !isValidStripeProductId(productRaw)) {
    return {
      error:
        "Product ID invalid. Trebuie să înceapă cu prod_ (ex: prod_xxx).",
    };
  }
  if (priceRaw && !isValidStripePriceId(priceRaw)) {
    return {
      error:
        "Price ID invalid. Trebuie să înceapă cu price_ (ex: price_xxx). Nu folosi Product ID (prod_).",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("billing_plans")
    .update({
      stripe_product_id: productRaw || null,
      stripe_price_id: priceRaw || null,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);

  if (error) {
    return {
      error:
        error.message.includes("billing_plans_stripe_price_id_format") ||
        error.message.includes("check constraint")
          ? "Price ID invalid (trebuie price_…). Rulează migrația billing Stripe IDs dacă lipsește."
          : "Nu am putut salva planul. Asigură-te că migrația stripe_product_id / stripe_price_id este aplicată.",
    };
  }

  await logAudit(null, auth.user.id, "admin.billing_plan.update_stripe", "billing_plan", key, {
    stripe_product_id: productRaw || null,
    stripe_price_id: priceRaw || null,
  });

  revalidatePath("/admin/plans");
  revalidatePath("/dashboard/billing");
  revalidatePath("/pricing");
  return { success: `Plan ${key} actualizat.` };
}

export async function adminUpdateBillingPlanStripeIdsFormAction(
  formData: FormData,
): Promise<void> {
  await adminUpdateBillingPlanStripeIdsAction({}, formData);
}
