import type { Metadata } from "next";
import Link from "next/link";

import { RaianVisualPromo } from "@/components/marketing/raian-visual-promo";
import { EmptyState } from "@/components/planner/empty-state";
import { TaskBoard } from "@/components/planner/task-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTaskAction,
  seedTaskTemplateAction,
} from "@/lib/actions/tasks";
import { canAccessFeature, canManagePlanner } from "@/lib/planner/access";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { requireWeddingContext } from "@/lib/planner/context";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from "@/types/planner";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.planner.title };
}

type PlannerPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function PlannerPage({ searchParams }: PlannerPageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const params = await searchParams;
  const view =
    params.view === "kanban" || params.view === "calendar"
      ? params.view
      : "list";

  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return (
      <EmptyState
        title={dict.shell.workspaceIncomplete}
        description={ctx.error ?? ""}
      />
    );
  }

  if (!canAccessFeature(ctx.context.entitlements, "planner")) {
    return (
      <EmptyState
        title={dict.shell.moduleDisabled}
        description={dict.shell.moduleDisabledDesc}
      />
    );
  }

  const { data: tasks } = await ctx.context.supabase
    .from("wedding_tasks")
    .select("*")
    .eq("wedding_id", ctx.context.weddingId)
    .order("due_date", { ascending: true });

  const overdue = (tasks ?? []).filter(
    (t) =>
      t.due_date &&
      t.status !== "done" &&
      t.status !== "cancelled" &&
      new Date(t.due_date) < new Date(),
  );

  const canWrite = canManagePlanner(ctx.context.role);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-4xl">{dict.planner.title}</h1>
          <p className="mt-2 text-muted-foreground">{dict.planner.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["list", "kanban", "calendar"] as const).map((v) => (
            <Link
              key={v}
              href={`/dashboard/planner?view=${v}`}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                view === v
                  ? "border-champagne bg-secondary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {v === "list" ? dict.planner.viewList : v === "kanban" ? dict.planner.viewKanban : dict.planner.viewCalendar}
            </Link>
          ))}
          {canWrite ? (
            <form action={seedTaskTemplateAction}>
              <Button type="submit" variant="outline">
                {dict.planner.generateTemplate}
              </Button>
            </form>
          ) : null}
        </div>
      </header>

      <RaianVisualPromo
        variant="compact"
        source="planner"
        workspaceId={ctx.context.workspaceId}
        weddingDate={ctx.context.wedding?.wedding_date}
      />

      {overdue.length > 0 ? (
        <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          {dict.planner.overdueAlert.replace("{count}", String(overdue.length))}
        </div>
      ) : null}

      {canWrite ? (
        <form
          action={createTaskAction}
          className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="title">{dict.planner.titleLabel}</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder={dict.planner.titlePlaceholder}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">{dict.planner.categoryLabel}</Label>
            <select
              id="category"
              name="category"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="other"
            >
              {TASK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {dict.planner.categories[
                    c.value as keyof typeof dict.planner.categories
                  ] ?? c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="priority">{dict.planner.priorityLabel}</Label>
            <select
              id="priority"
              name="priority"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="medium"
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {dict.planner.priorities[
                    p.value as keyof typeof dict.planner.priorities
                  ] ?? p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="status">{dict.planner.statusLabel}</Label>
            <select
              id="status"
              name="status"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="todo"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {dict.statuses.task[s.value as keyof typeof dict.statuses.task] ??
                    s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="due_date">{dict.planner.dueLabel}</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="recurrence">{dict.planner.recurrence}</Label>
            <select
              id="recurrence"
              name="recurrence"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="none"
            >
              <option value="none">{dict.planner.recurrenceNone}</option>
              <option value="weekly">{dict.planner.recurrenceWeekly}</option>
              <option value="monthly">{dict.planner.recurrenceMonthly}</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit">{dict.planner.add}</Button>
          </div>
        </form>
      ) : null}

      {(tasks ?? []).length === 0 ? (
        <EmptyState
          title={dict.planner.emptyTitle}
          description={dict.planner.emptyDescription}
        />
      ) : (
        <TaskBoard tasks={tasks ?? []} view={view} />
      )}
    </div>
  );
}
