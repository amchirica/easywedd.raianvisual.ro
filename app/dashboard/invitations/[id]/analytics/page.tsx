import type { Metadata } from "next";

import { AnalyticsCards } from "@/components/invitations/analytics-cards";
import { EmptyState } from "@/components/planner/empty-state";
import { getProjectAnalyticsAction } from "@/lib/actions/invitations";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { loadInvitationProject } from "@/lib/invitations/load-project";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.invitations.analyticsMetaTitle };
}

type PageProps = { params: Promise<{ id: string }> };

export default async function InvitationAnalyticsPage({ params }: PageProps) {
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

  const { data: events } = limits.allowAdvancedAnalytics
    ? await ctx.supabase
        .from("invitation_events")
        .select("event_type, device_class, created_at")
        .eq("invitation_project_id", project.id)
        .eq("event_type", "open")
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const deviceCounts = (events ?? []).reduce<Record<string, number>>((acc, ev) => {
    const key = ev.device_class || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-4xl">{dict.invitations.analytics}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{project.name}</p>
      </header>
      <AnalyticsCards stats={stats} advanced={limits.allowAdvancedAnalytics} />
      {limits.allowAdvancedAnalytics ? (
        <section className="space-y-2">
          <h2 className="font-heading text-2xl">{dict.invitations.opensByDevice}</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {Object.entries(deviceCounts).length === 0 ? (
              <p className="text-muted-foreground">{dict.invitations.noOpensYet}</p>
            ) : (
              Object.entries(deviceCounts).map(([device, count]) => (
                <p key={device}>
                  {device}: {count}
                </p>
              ))
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
