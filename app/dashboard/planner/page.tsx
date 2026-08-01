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
import { requireWeddingContext } from "@/lib/planner/context";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from "@/types/planner";

export const metadata: Metadata = { title: "Planner" };

type PlannerPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function PlannerPage({ searchParams }: PlannerPageProps) {
  const params = await searchParams;
  const view =
    params.view === "kanban" || params.view === "calendar"
      ? params.view
      : "list";

  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return (
      <EmptyState
        title="Workspace incomplet"
        description={ctx.error ?? "Finalizează onboarding-ul."}
      />
    );
  }

  if (!canAccessFeature(ctx.context.entitlements, "planner")) {
    return (
      <EmptyState
        title="Modul dezactivat"
        description="Entitlement-ul planner nu este activ pentru acest workspace."
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
          <h1 className="font-heading text-4xl">Wedding Planner</h1>
          <p className="mt-2 text-muted-foreground">
            Task-uri, priorități, checklist și template pe baza datei nunții.
          </p>
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
              {v === "list" ? "Listă" : v === "kanban" ? "Kanban" : "Calendar"}
            </Link>
          ))}
          {canWrite ? (
            <form action={seedTaskTemplateAction}>
              <Button type="submit" variant="outline">
                Generează template
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
          {overdue.length} task-uri întârziate necesită atenție.
        </div>
      ) : null}

      {canWrite ? (
        <form
          action={createTaskAction}
          className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="title">Titlu</Label>
            <Input id="title" name="title" required placeholder="Ex. Rezervare bandă" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">Categorie</Label>
            <select
              id="category"
              name="category"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="other"
            >
              {TASK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="priority">Prioritate</Label>
            <select
              id="priority"
              name="priority"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="medium"
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="todo"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="due_date">Termen</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="recurrence">Recurență</Label>
            <select
              id="recurrence"
              name="recurrence"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="none"
            >
              <option value="none">Fără</option>
              <option value="weekly">Săptămânal</option>
              <option value="monthly">Lunar</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit">Adaugă task</Button>
          </div>
        </form>
      ) : null}

      {(tasks ?? []).length === 0 ? (
        <EmptyState
          title="Niciun task încă"
          description="Generează template-ul automat sau adaugă primul task."
        />
      ) : (
        <TaskBoard tasks={tasks ?? []} view={view} />
      )}
    </div>
  );
}
