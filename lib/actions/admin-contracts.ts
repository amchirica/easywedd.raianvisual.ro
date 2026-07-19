"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

import { sendTemplatedEmail } from "@/lib/emails/send";
import { syncWorkspaceEntitlements } from "@/lib/entitlements/service";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/url";
import { getCurrentUserContext } from "@/lib/workspace";
import type { SubscriptionPlan } from "@/types/database";
import { buildDefaultEntitlements } from "@/lib/entitlements";
import { TRIAL_DAYS } from "@/lib/constants";

async function requireAdminClient() {
  const ctx = await getCurrentUserContext();
  if (!ctx.user || !ctx.isPlatformAdmin) return null;
  return { supabase: await createClient(), user: ctx.user };
}

export async function createClientContractAction(formData: FormData): Promise<void> {
  const admin = await requireAdminClient();
  if (!admin) return;

  const workspaceName = String(formData.get("workspace_name") || "").trim();
  const clientEmail = String(formData.get("client_email") || "").trim();
  const packageName = String(formData.get("package_name") || "").trim();
  const accessPlan = String(formData.get("access_plan") || "premium") as SubscriptionPlan;
  const externalRef = String(formData.get("external_contract_reference") || "");
  const months = Number(formData.get("access_months") || 12);

  if (!workspaceName || !clientEmail) return;

  const slug = workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  // Placeholder owner = admin until client accepts invite
  const { data: workspace, error } = await admin.supabase
    .from("workspaces")
    .insert({
      name: workspaceName,
      slug: `${slug}-${Date.now().toString(36).slice(-4)}`,
      workspace_type: "raian_client",
      owner_id: admin.user.id,
      status: "onboarding",
    })
    .select("id")
    .single();

  if (error || !workspace) return;

  await admin.supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: admin.user.id,
    role: "admin",
    invitation_status: "accepted",
  });

  const starts = new Date();
  const ends = new Date();
  ends.setMonth(ends.getMonth() + months);

  await admin.supabase.from("subscriptions").insert({
    workspace_id: workspace.id,
    plan: accessPlan,
    status: "active",
    product_key: "partner",
    billing_interval: "grant",
    access_ends_at: ends.toISOString(),
    trial_ends_at: new Date(
      Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString(),
  });

  await admin.supabase
    .from("feature_entitlements")
    .insert(buildDefaultEntitlements(workspace.id));
  await syncWorkspaceEntitlements(workspace.id);

  const code = randomBytes(16).toString("hex");
  await admin.supabase.from("client_contract_links").insert({
    workspace_id: workspace.id,
    external_contract_reference: externalRef || null,
    package_name: packageName || null,
    access_plan: accessPlan,
    access_starts_at: starts.toISOString(),
    access_ends_at: ends.toISOString(),
    activation_code: code,
    created_by: admin.user.id,
  });

  await admin.supabase.from("weddings").insert({
    workspace_id: workspace.id,
    couple_name_1: workspaceName,
    wedding_status: "planning",
  });

  const token = randomBytes(24).toString("hex");
  await admin.supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: null,
    role: "owner",
    invitation_status: "pending",
    invite_email: clientEmail,
    invite_token: token,
    invited_by: admin.user.id,
  });

  await sendTemplatedEmail("partner_invite", {
    to: clientEmail,
    vars: { url: `${getSiteUrl()}/invite/${token}` },
  });

  revalidatePath("/admin/contracts");
}

export async function extendContractAccessAction(formData: FormData): Promise<void> {
  const admin = await requireAdminClient();
  if (!admin) return;

  const contractId = String(formData.get("contract_id") || "");
  const months = Number(formData.get("months") || 3);
  const { data: contract } = await admin.supabase
    .from("client_contract_links")
    .select("*")
    .eq("id", contractId)
    .maybeSingle();
  if (!contract) return;

  const base = contract.access_ends_at
    ? new Date(contract.access_ends_at)
    : new Date();
  base.setMonth(base.getMonth() + months);
  const ends = base.toISOString();

  await admin.supabase
    .from("client_contract_links")
    .update({ access_ends_at: ends })
    .eq("id", contractId);

  await admin.supabase
    .from("subscriptions")
    .update({ access_ends_at: ends, status: "active" })
    .eq("workspace_id", contract.workspace_id);

  await syncWorkspaceEntitlements(contract.workspace_id);
  revalidatePath("/admin/contracts");
}

export async function disableContractAccessAction(contractId: string): Promise<void> {
  const admin = await requireAdminClient();
  if (!admin) return;

  const { data: contract } = await admin.supabase
    .from("client_contract_links")
    .select("*")
    .eq("id", contractId)
    .maybeSingle();
  if (!contract) return;

  const now = new Date().toISOString();
  await admin.supabase
    .from("client_contract_links")
    .update({ access_ends_at: now })
    .eq("id", contractId);

  await admin.supabase
    .from("subscriptions")
    .update({ access_ends_at: now, status: "canceled" })
    .eq("workspace_id", contract.workspace_id);

  await syncWorkspaceEntitlements(contract.workspace_id);
  revalidatePath("/admin/contracts");
}
