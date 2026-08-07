"use server";

import { revalidatePath } from "next/cache";

import { canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import type { ErrorCode } from "@/lib/i18n/errors";
import { timelineItemSchema } from "@/lib/validations/timeline";

export type ActionState = {
  error?: string;
  errorCode?: ErrorCode;
  success?: string;
};

export async function createTimelineItemAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const parsed = timelineItemSchema.safeParse({
    title: formData.get("title"),
    location: String(formData.get("location") || "") || undefined,
    start_time: String(formData.get("start_time") || "") || undefined,
    end_time: String(formData.get("end_time") || "") || undefined,
    responsible_person:
      String(formData.get("responsible_person") || "") || undefined,
    contact_phone: String(formData.get("contact_phone") || "") || undefined,
    vendor_id: String(formData.get("vendor_id") || "") || undefined,
    notes: String(formData.get("notes") || "") || undefined,
    visibility: formData.get("visibility") || "couple",
    sort_order: formData.get("sort_order") || 0,
  });

  if (!parsed.success) {
    return;
  }

  const { error } = await ctx.context.supabase
    .from("wedding_timeline_items")
    .insert({
      workspace_id: ctx.context.workspaceId,
      wedding_id: ctx.context.weddingId,
      title: parsed.data.title,
      location: parsed.data.location ?? null,
      start_time: parsed.data.start_time
        ? new Date(parsed.data.start_time).toISOString()
        : null,
      end_time: parsed.data.end_time
        ? new Date(parsed.data.end_time).toISOString()
        : null,
      responsible_person: parsed.data.responsible_person ?? null,
      contact_phone: parsed.data.contact_phone ?? null,
      vendor_id: parsed.data.vendor_id || null,
      notes: parsed.data.notes ?? null,
      visibility: parsed.data.visibility,
      sort_order: parsed.data.sort_order,
    });

  if (error) return;
  revalidatePath("/dashboard/timeline");
  return;
}

export async function reorderTimelineAction(
  orderedIds: string[],
): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  await Promise.all(
    orderedIds.map((id, index) =>
      ctx.context!.supabase
        .from("wedding_timeline_items")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("workspace_id", ctx.context!.workspaceId),
    ),
  );

  revalidatePath("/dashboard/timeline");
}

export async function deleteTimelineItemAction(id: string): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  await ctx.context.supabase
    .from("wedding_timeline_items")
    .delete()
    .eq("id", id)
    .eq("workspace_id", ctx.context.workspaceId);

  revalidatePath("/dashboard/timeline");
}
