import type { Metadata } from "next";

import { EmptyState } from "@/components/planner/empty-state";
import { requireFeature } from "@/lib/entitlements/service";
import { requireWeddingContext } from "@/lib/planner/context";

export const metadata: Metadata = { title: "Analytics website" };

type PageProps = { params: Promise<{ id: string }> };

export default async function WebsiteAnalyticsPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title="Workspace incomplet" description={ctx.error ?? ""} />;
  }

  const feature = await requireFeature(ctx.context.workspaceId, "analytics");
  if (!feature.ok) {
    return <EmptyState title="Analytics indisponibil" description={feature.error} />;
  }

  const { count } = await ctx.context.supabase
    .from("site_visits")
    .select("*", { count: "exact", head: true })
    .eq("wedding_site_id", id);

  const { data: recent } = await ctx.context.supabase
    .from("site_visits")
    .select("page_path, device_type, referrer_domain, created_at")
    .eq("wedding_site_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">Vizite</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fără IP integral · session hash · {count ?? 0} total
        </p>
      </header>
      <div className="divide-y divide-border border-y border-border text-sm">
        {(recent ?? []).length === 0 ? (
          <p className="py-4 text-muted-foreground">Nicio vizită încă.</p>
        ) : (
          (recent ?? []).map((v, i) => (
            <div key={`${v.created_at}-${i}`} className="flex justify-between gap-4 py-3">
              <span>
                {v.page_path} · {v.device_type ?? "—"}
              </span>
              <span className="text-muted-foreground">
                {new Date(v.created_at).toLocaleString("ro-RO")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
