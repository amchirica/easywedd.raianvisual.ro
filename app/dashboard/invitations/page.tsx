import type { Metadata } from "next";
import Link from "next/link";

import { ProjectCard } from "@/components/invitations/project-card";
import { EmptyState } from "@/components/planner/empty-state";
import { getInvitationLimits, canCreateProject } from "@/lib/invitations/plan-limits";
import { canAccessFeature, canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Invitation Studio" };

export default async function InvitationsPage() {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title="Workspace incomplet" description={ctx.error ?? ""} />;
  }
  if (!canAccessFeature(ctx.context.entitlements, "invitations")) {
    return (
      <EmptyState
        title="Modul dezactivat"
        description="Entitlement-ul invitations nu este activ pentru acest workspace."
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
          <h1 className="font-heading text-4xl">Invitation Studio</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Plan {limits.tier} · {activeCount}/{limits.maxProjects} proiecte
            {limits.watermark ? " · watermark activ" : ""}
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/dashboard/invitations/new"
            className={cn(buttonVariants())}
          >
            Template nou
          </Link>
        ) : null}
      </header>

      {(projects ?? []).length === 0 ? (
        <EmptyState
          title="Nicio invitație încă"
          description="Alege un template și creează primul proiect."
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
