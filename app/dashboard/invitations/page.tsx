import type { Metadata } from "next";
import Link from "next/link";

import { ProjectCard } from "@/components/invitations/project-card";
import { EmptyState } from "@/components/planner/empty-state";
import { getInvitationLimits, canCreateProject } from "@/lib/invitations/plan-limits";
import { canAccessFeature, canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/t";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.invitations.title };
}

export default async function InvitationsPage() {
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

  const [{ data: projects }, { data: subscription }, { data: templates }] =
    await Promise.all([
      ctx.context.supabase
        .from("invitation_projects")
        .select("id, name, status, updated_at, template_id")
        .eq("workspace_id", ctx.context.workspaceId)
        .order("updated_at", { ascending: false }),
      ctx.context.supabase
        .from("subscriptions")
        .select("plan")
        .eq("workspace_id", ctx.context.workspaceId)
        .maybeSingle(),
      ctx.context.supabase
        .from("invitation_templates")
        .select("id, name")
        .eq("is_active", true),
    ]);

  const limits = getInvitationLimits(subscription?.plan);
  const templateMap = new Map((templates ?? []).map((t) => [t.id, t.name]));
  const activeCount = (projects ?? []).filter((p) => p.status !== "archived").length;
  const canWrite = canManagePlanner(ctx.context.role);
  const canCreate = canWrite && canCreateProject(activeCount, subscription?.plan);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl">{dict.invitations.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(dict as never, "invitations.planProjects", {
              locale,
              params: {
                tier: limits.tier,
                active: activeCount,
                max: limits.maxProjects,
              },
            })}
            {limits.watermark ? dict.invitations.watermarkActive : ""}
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/dashboard/invitations/new"
            className={cn(buttonVariants())}
          >
            {dict.invitations.create}
          </Link>
        ) : null}
      </header>

      {(projects ?? []).length === 0 ? (
        <EmptyState
          title={dict.invitations.emptyTitle}
          description={dict.invitations.emptyDescription}
        />
      ) : (
        <div>
          {(projects ?? []).map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              status={project.status}
              updatedAt={project.updated_at}
              templateName={
                project.template_id
                  ? templateMap.get(project.template_id)
                  : null
              }
              canDelete={canWrite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
