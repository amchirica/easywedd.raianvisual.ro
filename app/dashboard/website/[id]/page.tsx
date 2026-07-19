import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/planner/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { duplicateWeddingSiteAction } from "@/lib/actions/website";
import { requireWeddingContext } from "@/lib/planner/context";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Website nuntă" };

type PageProps = { params: Promise<{ id: string }> };

export default async function WebsiteOverviewPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title="Workspace incomplet" description={ctx.error ?? ""} />;
  }

  const { data: site } = await ctx.context.supabase
    .from("wedding_sites")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ctx.context.workspaceId)
    .maybeSingle();

  if (!site) {
    return <EmptyState title="Site negăsit" description="" />;
  }

  const links = [
    { href: `/dashboard/website/${id}/edit`, label: "Editor" },
    { href: `/dashboard/website/${id}/preview`, label: "Preview" },
    { href: `/dashboard/website/${id}/settings`, label: "Setări / SEO" },
    { href: `/dashboard/website/${id}/analytics`, label: "Analytics" },
    { href: `/w/${site.slug}`, label: "Vezi public" },
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
        <form action={duplicateWeddingSiteAction.bind(null, site.id)}>
          <button type="submit" className={cn(buttonVariants({ variant: "outline" }))}>
            Duplică
          </button>
        </form>
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
