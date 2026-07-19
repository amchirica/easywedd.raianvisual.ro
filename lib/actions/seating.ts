"use server";

import { revalidatePath } from "next/cache";

import { canManageGuests } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { tableSchema } from "@/lib/validations/seating";

export type ActionState = { error?: string; success?: string };

export async function createTableAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManageGuests(ctx.context.role)) return;

  const parsed = tableSchema.safeParse({
    label: formData.get("label"),
    shape: formData.get("shape") || "round",
    capacity: formData.get("capacity") || 8,
  });

  if (!parsed.success) {
    return;
  }

  let layoutId: string | null = null;
  const { data: layouts } = await ctx.context.supabase
    .from("venue_layouts")
    .select("id")
    .eq("wedding_id", ctx.context.weddingId)
    .limit(1);

  if (layouts?.[0]) {
    layoutId = layouts[0].id;
  } else {
    const { data: layout, error: layoutError } = await ctx.context.supabase
      .from("venue_layouts")
      .insert({
        workspace_id: ctx.context.workspaceId,
        wedding_id: ctx.context.weddingId,
        name: "Layout principal",
      })
      .select("id")
      .single();
    if (layoutError) return;
    layoutId = layout.id;
  }

  const { error } = await ctx.context.supabase.from("tables").insert({
    workspace_id: ctx.context.workspaceId,
    wedding_id: ctx.context.weddingId,
    layout_id: layoutId,
    label: parsed.data.label,
    shape: parsed.data.shape,
    capacity: parsed.data.capacity,
  });

  if (error) return;
  revalidatePath("/dashboard/seating");
  return;
}

export async function assignGuestToTableAction(
  guestId: string,
  tableId: string | null,
): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManageGuests(ctx.context.role)) return;

  const { supabase, workspaceId } = ctx.context;

  await supabase.from("table_assignments").delete().eq("guest_id", guestId);

  if (tableId) {
    const { data: table } = await supabase
      .from("tables")
      .select("id, capacity")
      .eq("id", tableId)
      .maybeSingle();

    if (!table) return;

    const { count } = await supabase
      .from("table_assignments")
      .select("*", { count: "exact", head: true })
      .eq("table_id", tableId);

    if ((count ?? 0) >= table.capacity) {
      return;
    }

    const { error } = await supabase.from("table_assignments").insert({
      workspace_id: workspaceId,
      table_id: tableId,
      guest_id: guestId,
    });
    if (error) return;
  }

  await supabase
    .from("guests")
    .update({ table_id: tableId })
    .eq("id", guestId)
    .eq("workspace_id", workspaceId);

  revalidatePath("/dashboard/seating");
  revalidatePath("/dashboard/guests");
}

export async function deleteTableAction(tableId: string): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManageGuests(ctx.context.role)) return;

  await ctx.context.supabase
    .from("tables")
    .delete()
    .eq("id", tableId)
    .eq("workspace_id", ctx.context.workspaceId);

  revalidatePath("/dashboard/seating");
}
