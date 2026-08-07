import type { Metadata } from "next";
import Link from "next/link";

import { AnalyticsCards } from "@/components/invitations/analytics-cards";
import { InvitationDeleteControls } from "@/components/invitations/invitation-delete-controls";
import { EmptyState } from "@/components/planner/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getProjectAnalyticsAction } from "@/lib/actions/invitations";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { loadInvitationProject } from "@/lib/invitations/load-project";
import { canManagePlanner } from "@/lib/planner/access";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.invitations.projectMetaTitle };
}

type PageProps = { params: Promise<{ id: string }> };

export default async function InvitationProjectPage({ params }: PageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { id } = await params;
  const loaded = await loadInvitationProject(id);
  if (loaded.error || !loaded.data) {
    return (
      <EmptyState
        title={dict.invitations.projectUnavailable}
        description={loaded.error ?? ""}
      />
    );
  }

  const { project, limits, ctx } = loaded.data;
  const stats = await getProjectAnalyticsAction(id);
  const canWrite = canManagePlanner(ctx.role);
  const isArchived =
    project.status === "archived" ||
    Boolean((project as { soft_deleted_at?: string | null }).soft_deleted_at);

  const links = [
    { href: `/dashboard/invitations/${id}/edit`, label: dict.invitations.editor.label },
    { href: `/dashboard/invitations/${id}/preview`, label: dict.invitations.preview },
    {
      href: `/dashboard/invitations/${id}/distribute`,
      label: dict.invitations.distributeTitle,
    },
    { href: `/dashboard/invitations/${id}/export`, label: dict.invitations.export },
    {
      href: `/dashboard/invitations/${id}/analytics`,
      label: dict.invitations.analytics,
    },
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
            {limits.customDomainReady ? dict.invitations.customDomainReady : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/invitations"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {dict.dialog.back}
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
