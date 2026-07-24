import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUserContext,
  getWorkspaceEntitlementRows,
} from "@/lib/workspace";
import type { Json, MemberRole } from "@/types/database";

/**
 * Deduped per request when layout + page both need wedding context.
 */
export const requireWeddingContext = cache(async () => {
  const context = await getCurrentUserContext();
  if (!context.user) {
    return { error: "Neautentificat" as const, context: null };
  }
  if (!context.activeWorkspace || !context.wedding) {
    return {
      error: "Completează onboarding-ul pentru a continua." as const,
      context: null,
    };
  }

  const supabase = await createClient();
  const [{ data: membership }, entitlements, { data: subscription }] =
    await Promise.all([
      supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", context.activeWorkspace.id)
        .eq("user_id", context.user.id)
        .eq("invitation_status", "accepted")
        .maybeSingle(),
      getWorkspaceEntitlementRows(context.activeWorkspace.id),
      supabase
        .from("subscriptions")
        .select("access_ends_at, status")
        .eq("workspace_id", context.activeWorkspace.id)
        .maybeSingle(),
    ]);

  const accessExpired =
    Boolean(
      subscription?.access_ends_at &&
        new Date(subscription.access_ends_at) < new Date(),
    ) && subscription?.status !== "trialing";

  if (accessExpired) {
    await supabase.rpc("sync_workspace_entitlements", {
      p_workspace_id: context.activeWorkspace.id,
    });
  }

  return {
    error: null,
    context: {
      ...context,
      role: (membership?.role ?? null) as MemberRole | null,
      entitlements,
      accessExpired,
      supabase,
      workspaceId: context.activeWorkspace.id,
      weddingId: context.wedding.id,
    },
  };
});

export async function logAudit(
  workspaceId: string | null,
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Json = {},
) {
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    workspace_id: workspaceId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}
