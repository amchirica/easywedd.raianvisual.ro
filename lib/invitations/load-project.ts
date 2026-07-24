import { getInvitationLimits } from "@/lib/invitations/plan-limits";
import {
  parseContentConfig,
  parseThemeConfig,
} from "@/lib/invitations/renderer-defaults";
import { upgradeContentForTemplate } from "@/lib/invitations/sections";
import { requireWeddingContext } from "@/lib/planner/context";
import { getSiteUrl } from "@/lib/url";

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

  let templateSections: string[] | null = null;
  if (project.template_id) {
    const { data: template } = await ctx.context.supabase
      .from("invitation_templates")
      .select("template_schema")
      .eq("id", project.template_id)
      .maybeSingle();
    const schema = (template?.template_schema ?? {}) as { sections?: string[] };
    if (schema.sections?.length) {
      templateSections = schema.sections;
    }
  }

  const limits = getInvitationLimits(subscription?.plan);
  const theme = parseThemeConfig(project.theme_config);
  let content = parseContentConfig(project.content_config, {
    wedding: {
      couple_name_1: ctx.context.wedding?.couple_name_1,
      couple_name_2: ctx.context.wedding?.couple_name_2,
      wedding_date: ctx.context.wedding?.wedding_date,
    },
    templateSections,
  });

  if (templateSections?.length) {
    content = upgradeContentForTemplate(content, templateSections, {
      couple_name_1: ctx.context.wedding?.couple_name_1,
      couple_name_2: ctx.context.wedding?.couple_name_2,
      wedding_date: ctx.context.wedding?.wedding_date,
    });
  }

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
  return getSiteUrl();
}
