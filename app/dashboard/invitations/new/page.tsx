import type { Metadata } from "next";

import { TemplateGallery } from "@/components/invitations/template-gallery";
import { EmptyState } from "@/components/planner/empty-state";
import {
  canCreateProject,
  getInvitationLimits,
} from "@/lib/invitations/plan-limits";
import { canAccessFeature, canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import type { InvitationTemplate } from "@/types/invitations";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.invitations.newTitle };
}

export default async function NewInvitationPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title={dict.shell.workspaceIncomplete} description={ctx.error ?? ""} />;
  }
  if (!canAccessFeature(ctx.context.entitlements, "invitations")) {
    return (
      <EmptyState
        title={dict.shell.moduleDisabled}
        description={dict.shell.moduleDisabledDesc}
      />
    );
  }
  if (!canManagePlanner(ctx.context.role)) {
    return (
      <EmptyState
        title={dict.shell.noPermission}
        description=""
      />
    );
  }

  const [{ data: templates }, { data: subscription }, { count }] = await Promise.all([
    ctx.context.supabase
      .from("invitation_templates")
      .select("*")
      .eq("is_active", true)
      .order("name"),
    ctx.context.supabase
      .from("subscriptions")
      .select("plan")
      .eq("workspace_id", ctx.context.workspaceId)
      .maybeSingle(),
    ctx.context.supabase
      .from("invitation_projects")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", ctx.context.workspaceId)
      .neq("status", "archived"),
  ]);

  const limits = getInvitationLimits(subscription?.plan);
  const mapped = (templates ?? []).map(
    (t) =>
      ({
        ...t,
        template_schema: (t.template_schema ?? {}) as InvitationTemplate["template_schema"],
      }) satisfies InvitationTemplate,
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">{dict.invitations.newTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {dict.invitations.newSubtitle}
        </p>
      </header>
      <TemplateGallery
        templates={mapped}
        allowPremium={limits.allowPremiumTemplates}
        canCreate={canCreateProject(count ?? 0, subscription?.plan)}
      />
    </div>
  );
}
