"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/workspace";

export async function refreshIndustryInsightsAction(): Promise<void> {
  const ctx = await getCurrentUserContext();
  if (!ctx.user || !ctx.isPlatformAdmin) return;

  const supabase = await createClient();
  await supabase.rpc("refresh_industry_metrics_monthly", {
    p_period: new Date().toISOString().slice(0, 7),
  });

  revalidatePath("/admin/insights");
}

export async function logAdminAccessReasonAction(formData: FormData): Promise<void> {
  const ctx = await getCurrentUserContext();
  if (!ctx.user || !ctx.isPlatformAdmin) return;

  const reason = String(formData.get("reason") || "").trim();
  const targetType = String(formData.get("target_type") || "workspace");
  const targetId = String(formData.get("target_id") || "") || null;
  if (!reason) return;

  const supabase = await createClient();
  await supabase.from("admin_access_reasons").insert({
    admin_user_id: ctx.user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
  });

  await supabase.from("audit_logs").insert({
    workspace_id: targetType === "workspace" ? targetId : null,
    user_id: ctx.user.id,
    action: "admin.sensitive_access",
    entity_type: targetType,
    entity_id: targetId,
    metadata: { reason },
  });

  revalidatePath(`/admin/workspaces/${targetId ?? ""}`);
}
