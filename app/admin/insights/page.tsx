import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { refreshIndustryInsightsAction } from "@/lib/actions/admin-insights";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Industry insights" };

export default async function AdminInsightsPage() {
  const supabase = await createClient();
  const { data: metrics } = await supabase
    .from("industry_metrics_monthly")
    .select("*")
    .gte("wedding_count", 20)
    .order("period", { ascending: false })
    .limit(24);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl">Industry insights</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Agregări anonimizate · min 20 workspace-uri · doar cu consimțământ
          </p>
        </div>
        <form action={refreshIndustryInsightsAction}>
          <Button type="submit">Rulează agregare</Button>
        </form>
      </header>

      {(metrics ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nicio cohortă publicabilă încă (prag &lt; 20 sau fără consimțăminte).
        </p>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {(metrics ?? []).map((m) => (
            <div key={m.id} className="grid gap-2 py-4 text-sm sm:grid-cols-4">
              <p className="font-heading text-xl">
                {m.period} · {m.region}
              </p>
              <p>Nunți: {m.wedding_count}</p>
              <p>
                Buget mediu:{" "}
                {m.average_budget != null
                  ? Math.round(Number(m.average_budget))
                  : "—"}
              </p>
              <p>
                Invitați medii:{" "}
                {m.average_guest_count != null
                  ? Number(m.average_guest_count).toFixed(1)
                  : "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
