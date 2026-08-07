import type { Metadata } from "next";

import { EmptyState } from "@/components/planner/empty-state";
import { requireFeature } from "@/lib/entitlements/service";
import { formatDateTime } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/t";
import { requireWeddingContext } from "@/lib/planner/context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.website.analyticsMetaTitle };
}

type PageProps = { params: Promise<{ id: string }> };

export default async function WebsiteAnalyticsPage({ params }: PageProps) {
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

  const feature = await requireFeature(ctx.context.workspaceId, "analytics");
  if (!feature.ok) {
    return (
      <EmptyState
        title={dict.website.analyticsUnavailable}
        description={feature.error}
      />
    );
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
        <h1 className="font-heading text-4xl">{dict.website.visitsTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(dict as never, "website.visitsSubtitle", {
            locale,
            params: { count: count ?? 0 },
          })}
        </p>
      </header>
      <div className="divide-y divide-border border-y border-border text-sm">
        {(recent ?? []).length === 0 ? (
          <p className="py-4 text-muted-foreground">{dict.website.noVisitsYet}</p>
        ) : (
          (recent ?? []).map((v, i) => (
            <div key={`${v.created_at}-${i}`} className="flex justify-between gap-4 py-3">
              <span>
                {v.page_path} · {v.device_type ?? "—"}
              </span>
              <span className="text-muted-foreground">
                {formatDateTime(v.created_at, locale)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
