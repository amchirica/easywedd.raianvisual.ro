"use server";

import { revalidatePath } from "next/cache";

import { canManageGuests } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { tableSchema, updateTableSchema } from "@/lib/validations/seating";

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

  if (!parsed.success) return;

  const { supabase, workspaceId, weddingId } = ctx.context;
  let layoutId: string | null = null;
  const { data: layouts } = await supabase
    .from("venue_layouts")
    .select("id")
    .eq("wedding_id", weddingId)
    .limit(1);

  if (layouts?.[0]) {
    layoutId = layouts[0].id;
  } else {
    const { data: layout, error: layoutError } = await supabase
      .from("venue_layouts")
      .insert({
        workspace_id: workspaceId,
        wedding_id: weddingId,
        name: "Layout principal",
      })
      .select("id")
      .single();
    if (layoutError || !layout) return;
    layoutId = layout.id;
  }

  const countExisting = await supabase
    .from("tables")
    .select("*", { count: "exact", head: true })
    .eq("wedding_id", weddingId);

  const index = countExisting.count ?? 0;
  const col = index % 3;
  const row = Math.floor(index / 3);
  const defaultX = 24 + col * 220;
  const defaultY = 24 + row * 180;

  await supabase.from("tables").insert({
    workspace_id: workspaceId,
    wedding_id: weddingId,
    layout_id: layoutId,
    label: parsed.data.label,
    shape: parsed.data.shape,
    capacity: parsed.data.capacity,
    pos_x: parsed.data.pos_x ?? defaultX,
    pos_y: parsed.data.pos_y ?? defaultY,
    sort_order: index + 1,
  });

  revalidatePath("/dashboard/seating");
}

export async function updateTableAction(
  input: {
    table_id: string;
    label?: string;
    shape?: "round" | "rectangle";
    capacity?: number;
    pos_x?: number;
    pos_y?: number;
  },
): Promise<ActionState> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Workspace incomplet" };
  }
  if (!canManageGuests(ctx.context.role)) {
    return { error: "Nu ai permisiunea de a edita mesele." };
  }

  const parsed = updateTableSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { error } = await ctx.context.supabase
    .from("tables")
    .update({
      ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
      ...(parsed.data.shape !== undefined ? { shape: parsed.data.shape } : {}),
      ...(parsed.data.capacity !== undefined
        ? { capacity: parsed.data.capacity }
        : {}),
      ...(parsed.data.pos_x !== undefined ? { pos_x: parsed.data.pos_x } : {}),
      ...(parsed.data.pos_y !== undefined ? { pos_y: parsed.data.pos_y } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.table_id)
    .eq("workspace_id", ctx.context.workspaceId);

  if (error) {
    return { error: "Nu am putut actualiza masa." };
  }

  revalidatePath("/dashboard/seating");
  return { success: "Masa a fost actualizată." };
}

export async function updateTablePositionAction(
  tableId: string,
  posX: number,
  posY: number,
): Promise<ActionState> {
  return updateTableAction({
    table_id: tableId,
    pos_x: Math.max(0, Math.round(posX)),
    pos_y: Math.max(0, Math.round(posY)),
  });
}

export async function assignGuestToTableAction(
  guestId: string,
  tableId: string | null,
): Promise<ActionState> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Workspace incomplet" };
  }
  if (!canManageGuests(ctx.context.role)) {
    return { error: "Nu ai permisiunea de a aloca invitați." };
  }

  const { supabase, workspaceId } = ctx.context;

  await supabase.from("table_assignments").delete().eq("guest_id", guestId);

  if (tableId) {
    const { data: table } = await supabase
      .from("tables")
      .select("id, capacity")
      .eq("id", tableId)
      .maybeSingle();

    if (!table) return { error: "Masa nu există." };

    const { count } = await supabase
      .from("table_assignments")
      .select("*", { count: "exact", head: true })
      .eq("table_id", tableId);

    if ((count ?? 0) >= table.capacity) {
      return { error: "Capacitatea mesei este atinsă." };
    }

    const { error } = await supabase.from("table_assignments").insert({
      workspace_id: workspaceId,
      table_id: tableId,
      guest_id: guestId,
    });
    if (error) return { error: "Nu am putut aloca invitatul." };
  }

  await supabase
    .from("guests")
    .update({ table_id: tableId })
    .eq("id", guestId)
    .eq("workspace_id", workspaceId);

  revalidatePath("/dashboard/seating");
  revalidatePath("/dashboard/guests");
  return { success: "Alocare actualizată." };
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
