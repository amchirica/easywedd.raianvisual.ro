"use server";

import { revalidatePath } from "next/cache";
import { addWeeks, addMonths, parseISO } from "date-fns";

import { canManagePlanner } from "@/lib/planner/access";
import { logAudit, requireWeddingContext } from "@/lib/planner/context";
import type { ErrorCode } from "@/lib/i18n/errors";
import { taskSchema } from "@/lib/validations/tasks";
import type { TaskStatus } from "@/types/planner";

export type ActionState = {
  error?: string;
  errorCode?: ErrorCode;
  success?: string;
};

export async function createTaskAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) {
    return;
  }

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: String(formData.get("description") || "") || undefined,
    category: formData.get("category") || "other",
    status: formData.get("status") || "todo",
    priority: formData.get("priority") || "medium",
    due_date: String(formData.get("due_date") || "") || undefined,
    assigned_to: String(formData.get("assigned_to") || "") || undefined,
    estimated_cost: formData.get("estimated_cost") || undefined,
    actual_cost: formData.get("actual_cost") || undefined,
    recurrence: formData.get("recurrence") || "none",
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, workspaceId, weddingId, user } = ctx.context;
  const { error } = await supabase.from("wedding_tasks").insert({
    workspace_id: workspaceId,
    wedding_id: weddingId,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    category: parsed.data.category,
    status: parsed.data.status,
    priority: parsed.data.priority,
    due_date: parsed.data.due_date || null,
    assigned_to: parsed.data.assigned_to || null,
    estimated_cost: parsed.data.estimated_cost ?? null,
    actual_cost: parsed.data.actual_cost ?? null,
    recurrence: parsed.data.recurrence,
    completed_at: parsed.data.status === "done" ? new Date().toISOString() : null,
  });

  if (error) return;
  await logAudit(workspaceId, user!.id, "task.create", "wedding_task", null);
  revalidatePath("/dashboard/planner");
  return;
}

export async function updateTaskStatusAction(
  taskId: string,
  status: TaskStatus,
): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const { supabase, workspaceId, user } = ctx.context;
  const { data: existing } = await supabase
    .from("wedding_tasks")
    .select("*")
    .eq("id", taskId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!existing) return;

  const completed_at =
    status === "done" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("wedding_tasks")
    .update({ status, completed_at })
    .eq("id", taskId);

  if (error) return;

  if (status === "done" && existing.recurrence !== "none" && existing.due_date) {
    const base = parseISO(existing.due_date);
    const nextDue =
      existing.recurrence === "weekly"
        ? addWeeks(base, 1)
        : addMonths(base, 1);

    await supabase.from("wedding_tasks").insert({
      workspace_id: existing.workspace_id,
      wedding_id: existing.wedding_id,
      title: existing.title,
      description: existing.description,
      category: existing.category,
      status: "todo",
      priority: existing.priority,
      due_date: nextDue.toISOString().slice(0, 10),
      assigned_to: existing.assigned_to,
      estimated_cost: existing.estimated_cost,
      recurrence: existing.recurrence,
      recurrence_parent_id: existing.id,
    });
  }

  await logAudit(workspaceId, user!.id, "task.status", "wedding_task", taskId, {
    status,
  });
  revalidatePath("/dashboard/planner");
}

export async function deleteTaskAction(taskId: string): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  await ctx.context.supabase
    .from("wedding_tasks")
    .delete()
    .eq("id", taskId)
    .eq("workspace_id", ctx.context.workspaceId);

  revalidatePath("/dashboard/planner");
}

export async function seedTaskTemplateAction(): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const { error } = await ctx.context.supabase.rpc("seed_wedding_task_template", {
    p_workspace_id: ctx.context.workspaceId,
    p_wedding_id: ctx.context.weddingId,
    p_wedding_date: ctx.context.wedding?.wedding_date ?? null,
  });

  if (error) return;
  revalidatePath("/dashboard/planner");
}

export async function addChecklistItemAction(
  taskId: string,
  title: string,
): Promise<ActionState> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Eroare", errorCode: "generic" };
  }
  if (!canManagePlanner(ctx.context.role)) {
    return { error: "Fără permisiune.", errorCode: "permission_denied" };
  }

  const { error } = await ctx.context.supabase
    .from("wedding_task_checklist_items")
    .insert({
      task_id: taskId,
      workspace_id: ctx.context.workspaceId,
      title,
    });

  if (error) {
    return { error: error.message, errorCode: "task_save_failed" };
  }
  revalidatePath("/dashboard/planner");
  return { success: "Checklist actualizat." };
}

export async function toggleChecklistItemAction(
  itemId: string,
  isDone: boolean,
): Promise<ActionState> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Eroare", errorCode: "generic" };
  }
  if (!canManagePlanner(ctx.context.role)) {
    return { error: "Fără permisiune.", errorCode: "permission_denied" };
  }

  const { error } = await ctx.context.supabase
    .from("wedding_task_checklist_items")
    .update({ is_done: isDone })
    .eq("id", itemId)
    .eq("workspace_id", ctx.context.workspaceId);

  if (error) {
    return { error: error.message, errorCode: "task_save_failed" };
  }
  revalidatePath("/dashboard/planner");
  return { success: "Salvat." };
}
