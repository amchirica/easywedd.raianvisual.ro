import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/planner/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { requireFeature } from "@/lib/entitlements/service";
import { canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Wedding Website" };

export default async function WebsitePage() {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title="Workspace incomplet" description={ctx.error ?? ""} />;
  }

  const feature = await requireFeature(ctx.context.workspaceId, "website");
  if (!feature.ok) {
    return (
      <EmptyState
        title="Website dezactivat"
        description={feature.error}
      />
    );
  }

  const { data: sites } = await ctx.context.supabase
    .from("wedding_sites")
    .select("id, slug, status, updated_at, published_at")
    .eq("workspace_id", ctx.context.workspaceId)
    .order("updated_at", { ascending: false });

  const canWrite = canManagePlanner(ctx.context.role);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl">Wedding Website</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Site public pe /w/[slug] · editor pe secțiuni
          </p>
        </div>
        {canWrite ? (
          <Link href="/dashboard/website/new" className={cn(buttonVariants())}>
            Site nou
          </Link>
        ) : null}
      </header>

      {(sites ?? []).length === 0 ? (
        <EmptyState
          title="Niciun site încă"
          description="Alege un template și publică site-ul nunții."
        />
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {(sites ?? []).map((site) => (
            <Link
              key={site.id}
              href={`/dashboard/website/${site.id}`}
              className="block py-4 hover:bg-secondary/40"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-heading text-2xl">/w/{site.slug}</p>
                  <p className="text-sm text-muted-foreground">
                    actualizat{" "}
                    {new Date(site.updated_at).toLocaleDateString("ro-RO")}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {site.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
