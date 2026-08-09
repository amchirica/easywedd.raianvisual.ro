import { createClient } from "@/lib/supabase/server";
import type { EntitlementKey } from "@/lib/entitlements/keys";
import { FEATURE_LABELS_RO, requiredPlanHint } from "@/lib/entitlements/policy";
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
  planKey: string | null;
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

type SubRow = {
  plan: SubscriptionPlan;
  plan_key?: string | null;
  access_ends_at: string | null;
  trial_ends_at?: string | null;
  status: string;
  soft_deleted_at?: string | null;
};

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
      .select("plan, plan_key, access_ends_at, trial_ends_at, status, soft_deleted_at")
      .eq("workspace_id", workspaceId)
      .is("soft_deleted_at", null)
      .maybeSingle(),
  ]);

  const subscription = sub as SubRow | null;
  const plan = (subscription?.plan ?? "trial") as SubscriptionPlan;
  const accessEndsAt = subscription?.access_ends_at ?? null;
  const now = Date.now();
  const paidExpired =
    Boolean(subscription) &&
    (subscription!.status === "canceled" ||
      subscription!.status === "incomplete" ||
      Boolean(accessEndsAt && new Date(accessEndsAt).getTime() < now) ||
      Boolean(
        subscription!.status === "trialing" &&
          subscription!.trial_ends_at &&
          new Date(subscription!.trial_ends_at).getTime() < now,
      ));

  return {
    rows: rows ?? [],
    plan,
    planKey: subscription?.plan_key ?? null,
    accessEndsAt,
    expired: paidExpired && subscription?.plan_key !== "free",
  };
}

/**
 * Central server gate. Fail-closed: missing entitlement = denied.
 */
export async function requireFeature(
  workspaceId: string,
  key: EntitlementKey,
): Promise<
  { ok: true; snapshot: EntitlementSnapshot } | { ok: false; error: string }
> {
  let snapshot = await getWorkspaceEntitlementSnapshot(workspaceId);

  if (!snapshot.rows.length) {
    await syncWorkspaceEntitlements(workspaceId);
    snapshot = await getWorkspaceEntitlementSnapshot(workspaceId);
  }

  if (!isFeatureEnabled(snapshot.rows, key, false)) {
    return {
      ok: false,
      error: `${FEATURE_LABELS_RO[key]} nu este inclusă. ${requiredPlanHint(key)}.`,
    };
  }
  return { ok: true, snapshot };
}

export async function syncWorkspaceEntitlements(workspaceId: string) {
  const supabase = await createClient();
  await supabase.rpc("sync_workspace_entitlements", {
    p_workspace_id: workspaceId,
  });
}

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
    allowPdf: isFeatureEnabled(rows, "pdf_export", false),
    allowPremiumTemplates: isFeatureEnabled(rows, "premium_templates", false),
    allowAdvancedAnalytics: isFeatureEnabled(rows, "analytics", false),
    customDomainReady: isFeatureEnabled(rows, "custom_domain", false),
    tier: tierFromPlan(plan),
  };
}
