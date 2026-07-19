import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { StatCard } from "@/components/dashboard/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { buildDashboardAnalytics } from "@/lib/planner/analytics";
import { formatMoney } from "@/lib/planner/budget-math";
import { requireWeddingContext } from "@/lib/planner/context";
import {
  getCountdownLabel,
  getWeddingTitle,
} from "@/lib/dashboard-metrics";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const onboardingWarning = cookieStore.get("ew_onboarding_warning")?.value;
  if (onboardingWarning) {
    cookieStore.delete("ew_onboarding_warning");
  }

  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-4xl">Dashboard</h1>
        <p className="text-muted-foreground">
          {ctx.error ?? "Completează onboarding-ul pentru a vedea analytics."}
        </p>
        <Link href="/dashboard/onboarding" className={cn(buttonVariants())}>
          Continuă onboarding
        </Link>
      </div>
    );
  }

  const { wedding, profile, activeWorkspace, weddingId, supabase } = ctx.context;
  const countdown = getCountdownLabel(wedding?.wedding_date);
  const title = getWeddingTitle(wedding);

  const [{ data: tasks }, { data: guests }, { data: vendors }, { data: budgetItems }] =
    await Promise.all([
      supabase.from("wedding_tasks").select("*").eq("wedding_id", weddingId),
      supabase.from("guests").select("*").eq("wedding_id", weddingId),
      supabase.from("vendors").select("*").eq("wedding_id", weddingId),
      supabase.from("budget_items").select("*").eq("wedding_id", weddingId),
    ]);

  const analytics = buildDashboardAnalytics({
    tasks: tasks ?? [],
    guests: guests ?? [],
    vendors: vendors ?? [],
    budgetItems: budgetItems ?? [],
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
            Bun venit{profile?.full_name ? `, ${profile.full_name}` : ""}
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
          Editează detaliile nunții
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Countdown"
          value={countdown.value}
          hint={countdown.hint}
        />
        <StatCard
          title="Progres organizare"
          value={`${analytics.progress}%`}
          hint="Calculat din task-uri, RSVP și furnizori contractați"
        />
        <StatCard
          title="Buget plătit"
          value={formatMoney(analytics.budget.paid, currency)}
          hint={`Rămas ${formatMoney(analytics.budget.remaining, currency)}`}
        />
        <StatCard
          title="Invitați confirmați"
          value={`${analytics.rsvp.confirmed}`}
          hint={`${analytics.rsvp.pending} în așteptare · ${analytics.rsvp.declined} refuzați`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-border bg-card p-6">
          <h2 className="font-heading text-2xl">Task-uri apropiate / întârziate</h2>
          {analytics.overdueTasks.length === 0 &&
          analytics.upcomingTasks.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nicio notificare de termen momentan.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {analytics.overdueTasks.slice(0, 4).map((task) => (
                <li key={task.id} className="text-destructive">
                  Întârziat: {task.title} ({task.due_date})
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
            Deschide planner
          </Link>
        </article>

        <article className="border border-border bg-card p-6">
          <h2 className="font-heading text-2xl">RSVP & distribuție</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {analytics.rsvp.confirmed} confirmați · {analytics.rsvp.pending}{" "}
            așteptare · {analytics.rsvp.declined} refuz · {analytics.rsvp.maybe}{" "}
            poate
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Parte mireasă {analytics.sideDistribution.bride} · mire{" "}
            {analytics.sideDistribution.groom} · amândoi{" "}
            {analytics.sideDistribution.both}
          </p>
          <Link
            href="/dashboard/guests"
            className="mt-4 inline-block text-sm underline underline-offset-4"
          >
            Gestionează invitații
          </Link>
        </article>

        <article className="border border-border bg-card p-6">
          <h2 className="font-heading text-2xl">Plăți apropiate</h2>
          {analytics.upcomingPayments.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nu există sume restante înregistrate.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {analytics.upcomingPayments.map((item) => (
                <li key={item.id}>
                  {item.name}: {formatMoney(Number(item.due_amount), item.currency)}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/budget"
            className="mt-4 inline-block text-sm underline underline-offset-4"
          >
            Deschide buget
          </Link>
        </article>

        <article className="border border-border bg-card p-6">
          <h2 className="font-heading text-2xl">Furnizori fără contract</h2>
          {analytics.vendorsWithoutContract.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nu există furnizori în pipeline deschis.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {analytics.vendorsWithoutContract.slice(0, 5).map((vendor) => (
                <li key={vendor.id}>
                  {vendor.company_name} · {vendor.status}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/vendors"
            className="mt-4 inline-block text-sm underline underline-offset-4"
          >
            Vendor CRM
          </Link>
        </article>
      </section>
    </div>
  );
}
