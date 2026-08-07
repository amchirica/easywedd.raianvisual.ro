import type { Metadata } from "next";

import { mrrEstimateRon } from "@/lib/billing/catalog";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.admin.title };
}

export default async function AdminHomePage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { admin } = dict;
  const supabase = await createClient();

  const [
    { count: usersCount },
    { count: workspacesCount },
    { count: consentsCount },
    { count: weddingsCount },
    { count: sitesCount },
    { count: invitationsCount },
    { count: rsvpsCount },
    { count: gdprCount },
    { count: trialsCount },
    { count: starterCount },
    { count: premiumCount },
    { count: churnedCount },
    { data: activeSubsForMrr },
    { data: oneTime },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("workspaces").select("*", { count: "exact", head: true }),
    supabase.from("user_consents").select("*", { count: "exact", head: true }),
    supabase
      .from("weddings")
      .select("*", { count: "exact", head: true })
      .eq("wedding_status", "planning"),
    supabase
      .from("wedding_sites")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("invitation_projects")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("invitation_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "rsvp"),
    supabase
      .from("gdpr_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "trialing"),
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("plan", "starter")
      .in("status", ["active", "trialing"]),
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("plan", "premium")
      .in("status", ["active", "trialing"]),
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "canceled"),
    // Cap MRR sample — full table scan avoided for overview.
    supabase
      .from("subscriptions")
      .select("plan, status")
      .in("status", ["active", "trialing"])
      .limit(500),
    supabase
      .from("one_time_payments")
      .select("amount_ron")
      .eq("status", "succeeded")
      .limit(500),
  ]);

  const trials = trialsCount ?? 0;
  const mrr =
    activeSubsForMrr?.reduce(
      (sum, s) => sum + mrrEstimateRon(s.plan, s.status),
      0,
    ) ?? 0;
  const oneTimeRevenue =
    oneTime?.reduce((sum, p) => sum + (p.amount_ron ?? 0), 0) ?? 0;
  const starter = starterCount ?? 0;
  const premium = premiumCount ?? 0;
  const churned = churnedCount ?? 0;

  const cards = [
    { label: admin.users, value: usersCount ?? 0 },
    { label: admin.workspaces, value: workspacesCount ?? 0 },
    { label: admin.kpiActiveWeddings, value: weddingsCount ?? 0 },
    { label: admin.kpiTrials, value: trials },
    { label: admin.kpiMrr, value: mrr },
    { label: admin.kpiOneTime, value: oneTimeRevenue },
    {
      label: admin.kpiStarterPremium,
      value: `${starter}/${premium}`,
    },
    { label: admin.kpiChurn, value: churned },
    { label: admin.kpiSitesPublished, value: sitesCount ?? 0 },
    { label: admin.kpiInvitationsCreated, value: invitationsCount ?? 0 },
    { label: admin.kpiRsvpsProcessed, value: rsvpsCount ?? 0 },
    { label: admin.consents, value: consentsCount ?? 0 },
    { label: admin.kpiGdprPending, value: gdprCount ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-4xl">{admin.overviewTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {admin.overviewSubtitle}
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="border-b border-border pb-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-2 font-heading text-3xl">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
