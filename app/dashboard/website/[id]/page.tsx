import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/planner/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { SiteDeleteControls } from "@/components/website/site-delete-controls";
import { duplicateWeddingSiteAction } from "@/lib/actions/website";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.website.metaTitle };
}

type PageProps = { params: Promise<{ id: string }> };

export default async function WebsiteOverviewPage({ params }: PageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { id } = await params;
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return (
      <EmptyState
        title={dict.shell.workspaceIncomplete}
        description={ctx.error ?? ""}
      />
    );
  }

  const { data: site } = await ctx.context.supabase
    .from("wedding_sites")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ctx.context.workspaceId)
    .maybeSingle();

  if (!site) {
    return <EmptyState title={dict.website.notFound} description="" />;
  }

  const canWrite = canManagePlanner(ctx.context.role);
  const isArchived =
    site.status === "archived" ||
    Boolean((site as { soft_deleted_at?: string | null }).soft_deleted_at);

  const links = [
    { href: `/dashboard/website/${id}/edit`, label: dict.website.editor },
    { href: `/dashboard/website/${id}/preview`, label: dict.website.preview },
    { href: `/dashboard/website/${id}/settings`, label: dict.website.settingsSeo },
    { href: `/dashboard/website/${id}/analytics`, label: dict.website.analytics },
    { href: `/w/${site.slug}`, label: dict.website.viewPublic },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {site.status}
          </p>
          <h1 className="font-heading text-4xl">/w/{site.slug}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite ? (
            <form action={duplicateWeddingSiteAction.bind(null, site.id)}>
              <button
                type="submit"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                {dict.website.duplicate}
              </button>
            </form>
          ) : null}
          {canWrite ? (
            <SiteDeleteControls
              siteId={site.id}
              siteSlug={site.slug}
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
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
