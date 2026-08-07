import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { StatCard } from "@/components/dashboard/stat-card";
import { RaianVisualPromo } from "@/components/marketing/raian-visual-promo";
import { buttonVariants } from "@/components/ui/button";
import { buildDashboardAnalytics } from "@/lib/planner/analytics";
import { formatMoney } from "@/lib/planner/budget-math";
import { requireWeddingContext } from "@/lib/planner/context";
import {
  getCountdownLabel,
  getWeddingTitle,
} from "@/lib/dashboard-metrics";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getStatusLabel } from "@/lib/i18n/status-labels";
import { t } from "@/lib/i18n/t";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.dashboard.title };
}

export default async function DashboardPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const cookieStore = await cookies();
  const onboardingWarning = cookieStore.get("ew_onboarding_warning")?.value;
  if (onboardingWarning) {
    cookieStore.delete("ew_onboarding_warning");
  }

  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-4xl">{dict.dashboard.title}</h1>
        <p className="text-muted-foreground">
          {ctx.error ?? dict.dashboard.onboardingRequired}
        </p>
        <Link href="/dashboard/onboarding" className={cn(buttonVariants())}>
          {dict.dashboard.continueOnboarding}
        </Link>
      </div>
    );
  }

  const { wedding, profile, activeWorkspace, weddingId, supabase } = ctx.context;
  const countdown = getCountdownLabel(wedding?.wedding_date, locale);
  const title = getWeddingTitle(wedding, locale);

  const [{ data: tasks }, { data: guests }, { data: vendors }, { data: budgetItems }] =
    await Promise.all([
      supabase
        .from("wedding_tasks")
        .select("id, title, status, due_date")
        .eq("wedding_id", weddingId),
      supabase
        .from("guests")
        .select("id, rsvp_status, side")
        .eq("wedding_id", weddingId),
      supabase
        .from("vendors")
        .select("id, company_name, status")
        .eq("wedding_id", weddingId),
      supabase
        .from("budget_items")
        .select(
          "id, name, currency, estimated_amount, contracted_amount, paid_amount, due_amount, payment_status",
        )
        .eq("wedding_id", weddingId),
    ]);

  const analytics = buildDashboardAnalytics({
    tasks: (tasks ?? []) as never,
    guests: (guests ?? []) as never,
    vendors: (vendors ?? []) as never,
    budgetItems: (budgetItems ?? []) as never,
  });

  const currency = wedding?.currency ?? "RON";

  return (
    <div className="space-y-8">
      {onboardingWarning ? (
        <p className="rounded-md border border-amber-600/30 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {onboardingWarning}
        </p>
      ) : null}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {dict.dashboard.welcome}
            {profile?.full_name ? `, ${profile.full_name}` : ""}
          </p>
          <h1 className="font-heading text-4xl tracking-tight">{title}</h1>
          <p className="mt-2 text-muted-foreground">
            {activeWorkspace?.name ?? "Workspace"}
            {wedding?.city ? ` · ${wedding.city}` : ""}
          </p>
        </div>
        <Link
          href="/dashboard/wedding"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {dict.dashboard.editWedding}
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={dict.dashboard.countdown}
          value={countdown.value}
          hint={countdown.hint}
        />
        <StatCard
          title={dict.dashboard.progress}
          value={`${analytics.progress}%`}
          hint={dict.dashboard.progressHint}
        />
        <StatCard
          title={dict.dashboard.budgetPaid}
          value={formatMoney(analytics.budget.paid, currency, locale)}
          hint={t(dict as never, "dashboard.remainingHint", {
            locale,
            params: {
              amount: formatMoney(analytics.budget.remaining, currency, locale),
            },
          })}
        />
        <StatCard
          title={dict.dashboard.confirmedGuests}
          value={`${analytics.rsvp.confirmed}`}
          hint={t(dict as never, "dashboard.rsvpPendingHint", {
            locale,
            params: {
              pending: analytics.rsvp.pending,
              declined: analytics.rsvp.declined,
            },
          })}
        />
      </section>

      <RaianVisualPromo
        variant="card"
        source="dashboard"
        workspaceId={activeWorkspace?.id}
        weddingDate={wedding?.wedding_date}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-border bg-card p-6">
          <h2 className="font-heading text-2xl">
            {dict.dashboard.upcomingTasksTitle}
          </h2>
          {analytics.overdueTasks.length === 0 &&
          analytics.upcomingTasks.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {dict.dashboard.noTaskAlerts}
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {analytics.overdueTasks.slice(0, 4).map((task) => (
                <li key={task.id} className="text-destructive">
                  {dict.dashboard.overduePrefix}: {task.title} ({task.due_date})
                </li>
              ))}
              {analytics.upcomingTasks.slice(0, 4).map((task) => (
                <li key={task.id}>
                  {task.title} · {task.due_date}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/planner"
            className="mt-4 inline-block text-sm underline underline-offset-4"
          >
            {dict.dashboard.openPlanner}
          </Link>
        </article>

        <article className="border border-border bg-card p-6">
          <h2 className="font-heading text-2xl">{dict.dashboard.rsvpTitle}</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {t(dict as never, "dashboard.rsvpSummary", {
              locale,
              params: {
                confirmed: analytics.rsvp.confirmed,
                pending: analytics.rsvp.pending,
                declined: analytics.rsvp.declined,
                maybe: analytics.rsvp.maybe,
              },
            })}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(dict as never, "dashboard.sideSummary", {
              locale,
              params: {
                bride: analytics.sideDistribution.bride,
                groom: analytics.sideDistribution.groom,
                both: analytics.sideDistribution.both,
              },
            })}
          </p>
          <Link
            href="/dashboard/guests"
            className="mt-4 inline-block text-sm underline underline-offset-4"
          >
            {dict.dashboard.manageGuests}
          </Link>
        </article>

        <article className="border border-border bg-card p-6">
          <h2 className="font-heading text-2xl">
            {dict.dashboard.upcomingPayments}
          </h2>
          {analytics.upcomingPayments.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {dict.dashboard.noUpcomingPayments}
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {analytics.upcomingPayments.map((item) => (
                <li key={item.id}>
                  {item.name}:{" "}
                  {formatMoney(Number(item.due_amount), item.currency, locale)}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/budget"
            className="mt-4 inline-block text-sm underline underline-offset-4"
          >
            {dict.dashboard.openBudget}
          </Link>
        </article>

        <article className="border border-border bg-card p-6">
          <h2 className="font-heading text-2xl">
            {dict.dashboard.vendorsWithoutContract}
          </h2>
          {analytics.vendorsWithoutContract.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {dict.dashboard.noOpenVendors}
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {analytics.vendorsWithoutContract.slice(0, 5).map((vendor) => (
                <li key={vendor.id}>
                  {vendor.company_name} ·{" "}
                  {getStatusLabel("vendor", vendor.status, locale)}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/vendors"
            className="mt-4 inline-block text-sm underline underline-offset-4"
          >
            {dict.dashboard.openVendors}
          </Link>
        </article>
      </section>
    </div>
  );
}
