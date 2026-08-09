import type { Metadata } from "next";

import { mrrEstimateRon } from "@/lib/billing/catalog";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import {
  AdminDiagnosticPanel,
  captureAdminLoadError,
} from "@/lib/admin/diagnostic";
import { logAdminError } from "@/lib/admin/log";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import {
  getRuntimeEnvSourceFlags,
  getSupabaseEnvPresence,
} from "@/lib/runtime-env";
import { createAdminClientAsync } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.admin.title };
}

export default async function AdminHomePage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { admin } = dict;

  try {
    const auth = await requirePlatformAdmin();
    if (!auth.ok) {
      return (
        <AdminDiagnosticPanel
          route="/admin"
          message={auth.error ?? "Acces admin necesar"}
        />
      );
    }

    const supabase = await createAdminClientAsync();
    const envPresence = getSupabaseEnvPresence();
    const envFlags = getRuntimeEnvSourceFlags();

    const [
      { count: usersCount, error: usersErr },
      { count: workspacesCount, error: wsErr },
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

    if (usersErr) {
      logAdminError({ route: "/admin", operation: "profiles.count" }, usersErr);
      return (
        <AdminDiagnosticPanel
          route="/admin"
          code={usersErr.code}
          message={`Nu am putut încărca overview: ${usersErr.message}`}
        />
      );
    }
    if (wsErr) {
      logAdminError({ route: "/admin", operation: "workspaces.count" }, wsErr);
      return (
        <AdminDiagnosticPanel
          route="/admin"
          code={wsErr.code}
          message={`Nu am putut încărca overview: ${wsErr.message}`}
        />
      );
    }

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
        <p className="text-xs text-muted-foreground">
          Runtime env (presence): URL=
          {envPresence.NEXT_PUBLIC_SUPABASE_URL ? "ok" : "missing"} · anon=
          {envPresence.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "ok" : "missing"} ·
          service_role=
          {envPresence.SUPABASE_SERVICE_ROLE_KEY ? "ok" : "missing"} · als=
          {envFlags.hasAlsContext ? "yes" : "no"}
        </p>
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
  } catch (error) {
    const captured = captureAdminLoadError("/admin", "page.load", error);
    return (
      <AdminDiagnosticPanel
        route="/admin"
        code={captured.code}
        message={captured.message}
      />
    );
  }
}
