"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { trackProductEvent } from "@/lib/analytics/product";
import { logAudit, requireWeddingContext } from "@/lib/planner/context";
import { canManagePlanner } from "@/lib/planner/access";
import { computeInvitationAnalytics } from "@/lib/invitations/analytics";
import {
  canCreateProject,
  getInvitationLimits,
} from "@/lib/invitations/plan-limits";
import {
  mergeTemplateDefaults,
  sanitizeContent,
  themeConfigSchema,
  contentConfigSchema,
} from "@/lib/invitations/schema";
import { sendTransactionalEmail } from "@/lib/resend";
import { createProjectSchema, saveProjectSchema } from "@/lib/validations/invitations";
import type { Database, Json, SubscriptionPlan } from "@/types/database";
import type {
  InvitationContentConfig,
  InvitationThemeConfig,
} from "@/types/invitations";

type WeddingSupabase = Awaited<
  ReturnType<typeof requireWeddingContext>
>["context"] extends { supabase: infer S } | null
  ? S
  : never;

async function getPlan(
  supabase: WeddingSupabase,
  workspaceId: string,
): Promise<SubscriptionPlan> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return data?.plan ?? "trial";
}

export async function createInvitationProjectAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    template_id: formData.get("template_id"),
  });
  if (!parsed.success) return;

  const plan = await getPlan(ctx.context.supabase, ctx.context.workspaceId);
  const limits = getInvitationLimits(plan);

  const { count } = await ctx.context.supabase
    .from("invitation_projects")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", ctx.context.workspaceId)
    .neq("status", "archived");

  if (!canCreateProject(count ?? 0, plan)) return;

  const { data: template } = await ctx.context.supabase
    .from("invitation_templates")
    .select(
      "id, name, slug, category, template_schema, is_premium, is_active, usage_count",
    )
    .eq("id", parsed.data.template_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!template) return;
  if (template.is_premium && !limits.allowPremiumTemplates) return;

  const schema = (template.template_schema ?? {}) as {
    sections?: InvitationContentConfig["enabledSections"];
    theme?: Partial<InvitationThemeConfig>;
  };

  const merged = mergeTemplateDefaults(
    schema.theme,
    schema.sections,
    ctx.context.wedding,
  );

  const { data: project, error } = await ctx.context.supabase
    .from("invitation_projects")
    .insert({
      workspace_id: ctx.context.workspaceId,
      wedding_id: ctx.context.weddingId,
      name: parsed.data.name,
      template_id: template.id,
      theme_config: merged.theme as unknown as Json,
      content_config: merged.content as unknown as Json,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !project) return;

  await ctx.context.supabase
    .from("invitation_templates")
    .update({ usage_count: (template.usage_count ?? 0) + 1 })
    .eq("id", template.id);

  await ctx.context.supabase.from("feature_entitlements").upsert(
    {
      workspace_id: ctx.context.workspaceId,
      feature_key: "invitations",
      enabled: true,
      usage_limit: limits.maxProjects,
      usage_value: (count ?? 0) + 1,
    },
    { onConflict: "workspace_id,feature_key" },
  );

  await trackProductEvent("invitation_created", {
    workspaceId: ctx.context.workspaceId,
    userId: ctx.context.user!.id,
    properties: { template_id: template.id },
  });

  revalidatePath("/dashboard/invitations");
  redirect(`/dashboard/invitations/${project.id}/edit`);
}

export async function saveInvitationProjectAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  let theme_config;
  let content_config;
  try {
    theme_config = formData.get("theme_config")
      ? themeConfigSchema.parse(JSON.parse(String(formData.get("theme_config"))))
      : undefined;
    content_config = formData.get("content_config")
      ? contentConfigSchema.parse(JSON.parse(String(formData.get("content_config"))))
      : undefined;
  } catch {
    return;
  }

  const parsed = saveProjectSchema.safeParse({
    project_id: formData.get("project_id"),
    name: formData.get("name") || undefined,
    theme_config,
    content_config,
    rsvp_deadline: formData.get("rsvp_deadline") || null,
  });
  if (!parsed.success) return;

  const update: Database["public"]["Tables"]["invitation_projects"]["Update"] =
    {};
  if (parsed.data.name) update.name = parsed.data.name;
  if (parsed.data.theme_config) {
    update.theme_config = parsed.data.theme_config as unknown as Json;
  }
  if (parsed.data.content_config) {
    update.content_config = sanitizeContent(
      parsed.data.content_config,
    ) as unknown as Json;
  }
  if (parsed.data.rsvp_deadline !== undefined) {
    update.rsvp_deadline = parsed.data.rsvp_deadline || null;
  }

  await ctx.context.supabase
    .from("invitation_projects")
    .update(update)
    .eq("id", parsed.data.project_id)
    .eq("workspace_id", ctx.context.workspaceId);

  revalidatePath(`/dashboard/invitations/${parsed.data.project_id}`);
  revalidatePath(`/dashboard/invitations/${parsed.data.project_id}/edit`);
  revalidatePath(`/dashboard/invitations/${parsed.data.project_id}/preview`);
}

export async function publishInvitationProjectAction(projectId: string): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const { data: project } = await ctx.context.supabase
    .from("invitation_projects")
    .select("*")
    .eq("id", projectId)
    .eq("workspace_id", ctx.context.workspaceId)
    .maybeSingle();

  if (!project) return;

  const { count } = await ctx.context.supabase
    .from("invitation_versions")
    .select("*", { count: "exact", head: true })
    .eq("invitation_project_id", projectId);

  const versionNumber = (count ?? 0) + 1;

  await ctx.context.supabase.from("invitation_versions").insert({
    invitation_project_id: projectId,
    workspace_id: ctx.context.workspaceId,
    version_number: versionNumber,
    content_snapshot: {
      theme_config: project.theme_config,
      content_config: project.content_config,
    } as unknown as Json,
    created_by: ctx.context.user!.id,
  });

  await ctx.context.supabase
    .from("invitation_projects")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  await ctx.context.supabase.from("invitation_events").insert({
    workspace_id: ctx.context.workspaceId,
    invitation_project_id: projectId,
    event_type: "publish",
  });

  await logAudit(
    ctx.context.workspaceId,
    ctx.context.user!.id,
    "invitation.publish",
    "invitation_project",
    projectId,
  );

  await trackProductEvent("invitation_published", {
    workspaceId: ctx.context.workspaceId,
    userId: ctx.context.user!.id,
    properties: { project_id: projectId },
  });

  revalidatePath(`/dashboard/invitations/${projectId}`);
}

export async function addRecipientsFromGuestsAction(
  projectId: string,
  guestIds: string[],
): Promise<{ created: number; tokens: { guestId: string; token: string }[] }> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return { created: 0, tokens: [] };
  if (!canManagePlanner(ctx.context.role)) return { created: 0, tokens: [] };

  const plan = await getPlan(ctx.context.supabase, ctx.context.workspaceId);
  const limits = getInvitationLimits(plan);

  const { count } = await ctx.context.supabase
    .from("invitation_recipients")
    .select("*", { count: "exact", head: true })
    .eq("invitation_project_id", projectId);

  const remaining = limits.maxRecipients - (count ?? 0);
  const selected = guestIds.slice(0, Math.max(remaining, 0));
  const tokens: { guestId: string; token: string }[] = [];

  for (const guestId of selected) {
    const { data: token, error } = await ctx.context.supabase.rpc(
      "create_invitation_recipient_token",
      { p_project_id: projectId, p_guest_id: guestId },
    );
    if (!error && token) {
      tokens.push({ guestId, token });
    }
  }

  revalidatePath(`/dashboard/invitations/${projectId}/distribute`);
  return { created: tokens.length, tokens };
}

export async function sendInvitationEmailAction(
  projectId: string,
  recipientId: string,
  destination: string,
  invitationUrl: string,
): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const result = await sendTransactionalEmail({
    to: destination,
    subject: "Invitație la nuntă",
    html: `<p>Ai primit o invitație digitală.</p><p><a href="${invitationUrl}">Deschide invitația</a></p>`,
  });

  await ctx.context.supabase.from("invitation_deliveries").insert({
    recipient_id: recipientId,
    workspace_id: ctx.context.workspaceId,
    channel: "email",
    destination,
    delivery_status: result.ok ? "sent" : "skipped",
    sent_at: result.ok ? new Date().toISOString() : null,
    error_message: result.ok ? null : "resend_not_configured_or_failed",
  });

  await ctx.context.supabase.from("invitation_events").insert({
    workspace_id: ctx.context.workspaceId,
    invitation_project_id: projectId,
    recipient_id: recipientId,
    event_type: "email_sent",
  });

  await logAudit(
    ctx.context.workspaceId,
    ctx.context.user!.id,
    "invitation.email",
    "invitation_recipient",
    recipientId,
  );

  revalidatePath(`/dashboard/invitations/${projectId}/distribute`);
}

export async function logInvitationExportAction(
  projectId: string,
  format: string,
): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;

  await ctx.context.supabase.from("invitation_events").insert({
    workspace_id: ctx.context.workspaceId,
    invitation_project_id: projectId,
    event_type: "export",
    metadata: { format },
  });

  await logAudit(
    ctx.context.workspaceId,
    ctx.context.user!.id,
    `export.${format}`,
    "invitation_project",
    projectId,
  );
}

export async function getProjectAnalyticsAction(projectId: string) {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return computeInvitationAnalytics({
      deliveriesSent: 0,
      opens: 0,
      rsvps: 0,
      recipientsTotal: 0,
    });
  }

  const [{ count: recipientsTotal }, { count: rsvps }, { count: opens }, { count: sent }] =
    await Promise.all([
      ctx.context.supabase
        .from("invitation_recipients")
        .select("*", { count: "exact", head: true })
        .eq("invitation_project_id", projectId),
      ctx.context.supabase
        .from("invitation_recipients")
        .select("*", { count: "exact", head: true })
        .eq("invitation_project_id", projectId)
        .not("rsvp_completed_at", "is", null),
      ctx.context.supabase
        .from("invitation_events")
        .select("*", { count: "exact", head: true })
        .eq("invitation_project_id", projectId)
        .eq("event_type", "open"),
      ctx.context.supabase
        .from("invitation_deliveries")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", ctx.context.workspaceId)
        .eq("delivery_status", "sent"),
    ]);

  return computeInvitationAnalytics({
    deliveriesSent: sent ?? 0,
    opens: opens ?? 0,
    rsvps: rsvps ?? 0,
    recipientsTotal: recipientsTotal ?? 0,
  });
}
