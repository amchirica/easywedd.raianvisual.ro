import type { Metadata } from "next";
import Link from "next/link";

import { AnalyticsCards } from "@/components/invitations/analytics-cards";
import { InvitationDeleteControls } from "@/components/invitations/invitation-delete-controls";
import { EmptyState } from "@/components/planner/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getProjectAnalyticsAction } from "@/lib/actions/invitations";
import { loadInvitationProject } from "@/lib/invitations/load-project";
import { canManagePlanner } from "@/lib/planner/access";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Proiect invitație" };

type PageProps = { params: Promise<{ id: string }> };

export default async function InvitationProjectPage({ params }: PageProps) {
  const { id } = await params;
  const loaded = await loadInvitationProject(id);
  if (loaded.error || !loaded.data) {
    return <EmptyState title="Proiect indisponibil" description={loaded.error ?? ""} />;
  }

  const { project, limits, ctx } = loaded.data;
  const stats = await getProjectAnalyticsAction(id);
  const canWrite = canManagePlanner(ctx.role);
  const isArchived =
    project.status === "archived" ||
    Boolean((project as { soft_deleted_at?: string | null }).soft_deleted_at);

  const links = [
    { href: `/dashboard/invitations/${id}/edit`, label: "Editor" },
    { href: `/dashboard/invitations/${id}/preview`, label: "Preview" },
    { href: `/dashboard/invitations/${id}/distribute`, label: "Distribuire" },
    { href: `/dashboard/invitations/${id}/export`, label: "Export" },
    { href: `/dashboard/invitations/${id}/analytics`, label: "Analytics" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {project.status}
          </p>
          <h1 className="font-heading text-4xl">{project.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Plan {limits.tier}
            {limits.customDomainReady
              ? " · custom domain pregătit (fără DNS live)"
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/invitations"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Înapoi
          </Link>
          {canWrite ? (
            <InvitationDeleteControls
              projectId={project.id}
              projectName={project.name}
              isArchived={isArchived}
            />
          ) : null}
        </div>
      </header>

      <nav className="flex flex-wrap gap-4 text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <AnalyticsCards stats={stats} advanced={limits.allowAdvancedAnalytics} />
    </div>
  );
}