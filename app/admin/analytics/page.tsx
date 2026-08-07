import type { Metadata } from "next";

import { getAssistantAdminStats } from "@/lib/assistant/admin-stats";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.admin.analyticsTitle };
}

export default async function AdminAnalyticsPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("product_events")
    .select("event_name, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(500);

  const counts = (events ?? []).reduce<Record<string, number>>((acc, ev) => {
    acc[ev.event_name] = (acc[ev.event_name] ?? 0) + 1;
    return acc;
  }, {});

  const assistantStats = await getAssistantAdminStats();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-4xl">{dict.admin.analyticsTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {dict.admin.analyticsSubtitle}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(counts).map(([name, count]) => (
          <div key={name} className="border-b border-border pb-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {name}
            </p>
            <p className="mt-2 font-heading text-3xl">{count}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="font-heading text-2xl">{dict.admin.assistantSection}</h2>
        <p className="text-sm text-muted-foreground">{dict.admin.assistantHint}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-border pb-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {dict.admin.unanswered}
            </p>
            <p className="mt-2 font-heading text-3xl">
              {assistantStats.unansweredCount}
            </p>
          </div>
          <div className="border-b border-border pb-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {dict.admin.negativeFeedback}
            </p>
            <p className="mt-2 font-heading text-3xl">
              {assistantStats.negativeFeedbackCount}
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium">{dict.admin.topCategories}</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {assistantStats.topCategories.length === 0 ? (
                <li>—</li>
              ) : (
                assistantStats.topCategories.map((row) => (
                  <li key={row.category}>
                    {row.category}: {row.count}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium">{dict.admin.topPages}</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {assistantStats.topPages.length === 0 ? (
                <li>—</li>
              ) : (
                assistantStats.topPages.map((row) => (
                  <li key={row.page}>
                    {row.page}: {row.count}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      {(events ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">{dict.admin.noEvents}</p>
      ) : null}
    </div>
  );
}
