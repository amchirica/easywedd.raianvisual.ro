import { getInvitationLimits } from "@/lib/invitations/plan-limits";
import {
  parseContentConfig,
  parseThemeConfig,
} from "@/lib/invitations/renderer-defaults";
import { requireWeddingContext } from "@/lib/planner/context";

export async function loadInvitationProject(projectId: string) {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Context unavailable", data: null };
  }

  const [{ data: project }, { data: subscription }] = await Promise.all([
    ctx.context.supabase
      .from("invitation_projects")
      .select("*")
      .eq("id", projectId)
      .eq("workspace_id", ctx.context.workspaceId)
      .maybeSingle(),
    ctx.context.supabase
      .from("subscriptions")
      .select("plan")
      .eq("workspace_id", ctx.context.workspaceId)
      .maybeSingle(),
  ]);

  if (!project) {
    return { error: "Proiectul nu a fost găsit.", data: null };
  }

  const limits = getInvitationLimits(subscription?.plan);
  const theme = parseThemeConfig(project.theme_config);
  const content = parseContentConfig(project.content_config);

  return {
    error: null,
    data: {
      ctx: ctx.context,
      project,
      theme,
      content,
      limits,
      plan: subscription?.plan ?? "trial",
    },
  };
}

export function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
