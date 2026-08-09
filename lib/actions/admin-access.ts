"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { ENTITLEMENT_KEYS } from "@/lib/entitlements/keys";
import { logAudit } from "@/lib/planner/context";
import { createAdminClientAsync } from "@/lib/supabase/admin";

export type AdminAccessResult = { error?: string; success?: string };

async function assertAdmin() {
  const auth = await requirePlatformAdmin();
  if (!auth.ok || !auth.user) {
    return { ok: false as const, error: auth.error ?? "Neautorizat", user: null };
  }
  return { ok: true as const, error: null, user: auth.user };
}

export async function adminUpdateAccountStatusAction(
  _prev: AdminAccessResult,
  formData: FormData,
): Promise<AdminAccessResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { error: auth.error ?? "Neautorizat" };

  const schema = z.object({
    user_id: z.string().uuid(),
    account_status: z.enum(["pending", "limited", "approved", "suspended"]),
    note: z.string().max(2000).optional(),
  });

  const parsed = schema.safeParse({
    user_id: formData.get("user_id"),
    account_status: formData.get("account_status"),
    note: String(formData.get("note") || ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "validation.invalid" };
  }

  const admin = await createAdminClientAsync();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("profiles")
    .update({
      account_status: parsed.data.account_status,
      account_status_note: parsed.data.note || null,
      account_status_updated_at: now,
      account_status_updated_by: auth.user.id,
      updated_at: now,
      suspended_at:
        parsed.data.account_status === "suspended" ? now : null,
    })
    .eq("id", parsed.data.user_id);

  if (error) return { error: error.message };

  await logAudit(
    null,
    auth.user.id,
    "admin.account_status",
    "profile",
    parsed.data.user_id,
    {
      account_status: parsed.data.account_status,
      note: parsed.data.note,
    },
  );

  revalidatePath("/admin/users");
  revalidatePath("/admin/access");
  return { success: "Status cont actualizat." };
}

export async function adminCreateAccessGrantAction(
  _prev: AdminAccessResult,
  formData: FormData,
): Promise<AdminAccessResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { error: auth.error ?? "Neautorizat" };

  const schema = z.object({
    workspace_id: z.string().uuid(),
    feature_key: z.enum(ENTITLEMENT_KEYS as unknown as [string, ...string[]]),
    enabled: z.boolean().default(true),
    usage_limit: z.coerce.number().int().min(0).optional(),
    ends_at: z.string().optional(),
    reason: z.string().min(3).max(2000),
  });

  const parsed = schema.safeParse({
    workspace_id: formData.get("workspace_id"),
    feature_key: formData.get("feature_key"),
    enabled: formData.get("enabled") !== "off",
    usage_limit: formData.get("usage_limit") || undefined,
    ends_at: String(formData.get("ends_at") || ""),
    reason: String(formData.get("reason") || ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "validation.invalid" };
  }

  const admin = await createAdminClientAsync();
  const { error } = await admin.from("access_grants").insert({
    workspace_id: parsed.data.workspace_id,
    feature_key: parsed.data.feature_key,
    enabled: parsed.data.enabled,
    usage_limit: parsed.data.usage_limit ?? null,
    ends_at: parsed.data.ends_at
      ? new Date(parsed.data.ends_at).toISOString()
      : null,
    reason: parsed.data.reason,
    granted_by: auth.user.id,
  });

  if (error) return { error: error.message };

  await admin.rpc("sync_workspace_entitlements", {
    p_workspace_id: parsed.data.workspace_id,
  });

  await logAudit(
    parsed.data.workspace_id,
    auth.user.id,
    "admin.access_grant",
    "access_grant",
    parsed.data.workspace_id,
    parsed.data,
  );

  revalidatePath("/admin/access");
  revalidatePath("/admin/subscriptions");
  return { success: "Acces acordat. Entitlements resincronizate." };
}

export async function adminRevokeAccessGrantAction(
  _prev: AdminAccessResult,
  formData: FormData,
): Promise<AdminAccessResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { error: auth.error ?? "Neautorizat" };

  const id = String(formData.get("grant_id") || "");
  const reason = String(formData.get("revoke_reason") || "Revocat de admin");
  if (!z.string().uuid().safeParse(id).success) {
    return { error: "Grant invalid" };
  }

  const admin = await createAdminClientAsync();
  const { data: grant } = await admin
    .from("access_grants")
    .select("id, workspace_id")
    .eq("id", id)
    .maybeSingle();
  if (!grant) return { error: "Grant inexistent" };

  const { error } = await admin
    .from("access_grants")
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: auth.user.id,
      revoke_reason: reason,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await admin.rpc("sync_workspace_entitlements", {
    p_workspace_id: grant.workspace_id,
  });
  revalidatePath("/admin/access");
  return { success: "Grant revocat." };
}
