"use client";

import { useMemo, useState, useTransition } from "react";

import { ConfirmDeleteButton } from "@/components/planner/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteTaskAction,
  updateTaskStatusAction,
} from "@/lib/actions/tasks";
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskStatus,
  type WeddingTask,
} from "@/types/planner";

type TaskBoardProps = {
  tasks: WeddingTask[];
  view: "list" | "kanban" | "calendar";
};

export function TaskBoard({ tasks, view }: TaskBoardProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (categoryFilter !== "all" && task.category !== categoryFilter) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      if (
        query &&
        !`${task.title} ${task.description ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [tasks, statusFilter, categoryFilter, priorityFilter, query]);

  function setStatus(taskId: string, status: TaskStatus) {
    startTransition(() => {
      void updateTaskStatusAction(taskId, status);
    });
  }

  const filters = (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
      <Input
        placeholder="Caută task..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="all">Toate statusurile</option>
        {TASK_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <select
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
      >
        <option value="all">Toate categoriile</option>
        {TASK_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <select
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        value={priorityFilter}
        onChange={(e) => setPriorityFilter(e.target.value)}
      >
        <option value="all">Toate prioritățile</option>
        {TASK_PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );

  if (view === "kanban") {
    const columns: TaskStatus[] = ["todo", "in_progress", "waiting", "done"];
    return (
      <div className="space-y-4">
        {filters}
        <div className="grid gap-4 lg:grid-cols-4">
          {columns.map((column) => (
            <section key={column} className="border border-border bg-card p-3">
              <h3 className="text-sm font-medium">
                {TASK_STATUSES.find((s) => s.value === column)?.label}
              </h3>
              <div className="mt-3 space-y-2">
                {filtered
                  .filter((t) => t.status === column)
                  .map((task) => (
                    <article
                      key={task.id}
                      className="border border-border bg-background p-3"
                    >
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {task.due_date ?? "Fără termen"} · {task.priority}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {columns
                          .filter((c) => c !== task.status)
                          .slice(0, 2)
                          .map((next) => (
                            <Button
                              key={next}
                              size="xs"
                              variant="outline"
                              onClick={() => setStatus(task.id, next)}
                            >
                              →{" "}
                              {TASK_STATUSES.find((s) => s.value === next)?.label}
                            </Button>
                          ))}
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  if (view === "calendar") {
    const byDate = new Map<string, WeddingTask[]>();
    for (const task of filtered) {
      const key = task.due_date ?? "Fără dată";
      byDate.set(key, [...(byDate.get(key) ?? []), task]);
    }
    const dates = Array.from(byDate.keys()).sort();

    return (
      <div className="space-y-4">
        {filters}
        <div className="space-y-4">
          {dates.map((date) => (
            <section key={date} className="border border-border bg-card p-4">
              <h3 className="font-heading text-xl">{date}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {(byDate.get(date) ?? []).map((task) => (
                  <li key={task.id} className="flex justify-between gap-3">
                    <span>{task.title}</span>
                    <span className="text-muted-foreground">{task.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filters}
      <div className="hidden overflow-x-auto border border-border bg-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Titlu</th>
              <th className="px-4 py-3">Categorie</th>
              <th className="px-4 py-3">Prioritate</th>
              <th className="px-4 py-3">Termen</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => (
              <tr key={task.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{task.title}</td>
                <td className="px-4 py-3">{task.category}</td>
                <td className="px-4 py-3">{task.priority}</td>
                <td className="px-4 py-3">{task.due_date ?? "—"}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded border border-input bg-background px-2 py-1"
                    value={task.status}
                    onChange={(e) =>
                      setStatus(task.id, e.target.value as TaskStatus)
                    }
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <ConfirmDeleteButton id={task.id} action={deleteTaskAction} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {filtered.map((task) => (
          <article key={task.id} className="border border-border bg-card p-4">
            <p className="font-medium">{task.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {task.category} · {task.priority} · {task.due_date ?? "Fără termen"}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <select
                className="rounded border border-input bg-background px-2 py-1 text-sm"
                value={task.status}
                onChange={(e) =>
                  setStatus(task.id, e.target.value as TaskStatus)
                }
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ConfirmDeleteButton id={task.id} action={deleteTaskAction} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
