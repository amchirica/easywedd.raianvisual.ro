import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Product analytics" };

export default async function AdminAnalyticsPage() {
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

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-4xl">Product analytics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Evenimente operaționale · fără PII în properties
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

      {(events ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Niciun eveniment încă.</p>
      ) : null}
    </div>
  );
}
