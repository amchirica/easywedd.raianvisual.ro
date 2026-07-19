import { createClient } from "@/lib/supabase/server";
import type { EntitlementKey } from "@/lib/entitlements/keys";
import type { SubscriptionPlan } from "@/types/database";
import {
  getInvitationLimits,
  tierFromPlan,
} from "@/lib/invitations/plan-limits";

export type EntitlementRow = {
  feature_key: string;
  enabled: boolean;
  usage_limit?: number | null;
  usage_value?: number | null;
};

export type EntitlementSnapshot = {
  rows: EntitlementRow[];
  plan: SubscriptionPlan;
  accessEndsAt: string | null;
  expired: boolean;
};

export function isFeatureEnabled(
  rows: EntitlementRow[],
  key: EntitlementKey,
  fallback = false,
) {
  const row = rows.find((r) => r.feature_key === key);
  if (!row) return fallback;
  return row.enabled;
}

export function getUsageLimit(rows: EntitlementRow[], key: EntitlementKey) {
  const row = rows.find((r) => r.feature_key === key);
  return row?.usage_limit ?? null;
}

export function assertWithinLimit(
  rows: EntitlementRow[],
  key: EntitlementKey,
  currentUsage: number,
) {
  const limit = getUsageLimit(rows, key);
  if (limit == null) return true;
  return currentUsage < limit;
}

export async function getWorkspaceEntitlementSnapshot(
  workspaceId: string,
): Promise<EntitlementSnapshot> {
  const supabase = await createClient();
  const [{ data: rows }, { data: sub }] = await Promise.all([
    supabase
      .from("feature_entitlements")
      .select("feature_key, enabled, usage_limit, usage_value")
      .eq("workspace_id", workspaceId),
    supabase
      .from("subscriptions")
      .select("plan, access_ends_at, status")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
  ]);

  const plan = (sub?.plan ?? "trial") as SubscriptionPlan;
  const accessEndsAt = sub?.access_ends_at ?? null;
  const expired =
    Boolean(accessEndsAt && new Date(accessEndsAt) < new Date()) ||
    sub?.status === "canceled";

  return {
    rows: rows ?? [],
    plan,
    accessEndsAt,
    expired,
  };
}

export async function requireFeature(
  workspaceId: string,
  key: EntitlementKey,
): Promise<{ ok: true; snapshot: EntitlementSnapshot } | { ok: false; error: string }> {
  const snapshot = await getWorkspaceEntitlementSnapshot(workspaceId);
  if (snapshot.expired) {
    return { ok: false, error: "Accesul a expirat. Reînnoiește planul." };
  }
  if (!isFeatureEnabled(snapshot.rows, key, key === "planner")) {
    return { ok: false, error: `Funcția ${key} nu este inclusă în plan.` };
  }
  return { ok: true, snapshot };
}

export async function syncWorkspaceEntitlements(workspaceId: string) {
  const supabase = await createClient();
  await supabase.rpc("sync_workspace_entitlements", {
    p_workspace_id: workspaceId,
  });
}

/** Bridge for invitation studio limits derived from plan. */
export function invitationLimitsFromEntitlements(
  plan: SubscriptionPlan,
  rows: EntitlementRow[],
) {
  const base = getInvitationLimits(plan);
  return {
    ...base,
    maxProjects:
      getUsageLimit(rows, "invitation_projects") ?? base.maxProjects,
    maxRecipients: getUsageLimit(rows, "guest_limit") ?? base.maxRecipients,
    watermark: !isFeatureEnabled(rows, "remove_branding", false),
    allowPdf: isFeatureEnabled(rows, "pdf_export", base.allowPdf),
    allowPremiumTemplates: isFeatureEnabled(
      rows,
      "premium_templates",
      base.allowPremiumTemplates,
    ),
    allowAdvancedAnalytics: isFeatureEnabled(
      rows,
      "analytics",
      base.allowAdvancedAnalytics,
    ),
    customDomainReady: isFeatureEnabled(rows, "custom_domain", false),
    tier: tierFromPlan(plan),
  };
}
