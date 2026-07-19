"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  logAdminMutation,
  requireAdminWorkspace,
} from "@/lib/admin/workspace-context";
import { weddingDetailsSchema } from "@/lib/validations/wedding";

export type AdminActionResult = { error?: string; success?: string };

function revalidateAdminWorkspace(workspaceId: string) {
  revalidatePath(`/admin/workspaces/${workspaceId}`);
  revalidatePath(`/admin/workspaces/${workspaceId}`, "layout");
}

export async function adminUpdateWeddingAction(
  workspaceId: string,
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const ctx = await requireAdminWorkspace(workspaceId);
  if (!ctx.ok || !ctx.context) return { error: ctx.error };
  if (!ctx.context.wedding) return { error: "Nu există nuntă pentru workspace." };

  const parsed = weddingDetailsSchema.safeParse({
    couple_name_1: formData.get("couple_name_1"),
    couple_name_2: formData.get("couple_name_2"),
    wedding_date: formData.get("wedding_date") || "",
    city: formData.get("city") || "",
    venue_name: formData.get("venue_name") || "",
    estimated_guest_count: formData.get("estimated_guest_count") || null,
    currency: formData.get("currency") || "RON",
    wedding_status: formData.get("wedding_status") || "planning",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { error } = await ctx.context.supabase
    .from("weddings")
    .update({
      couple_name_1: parsed.data.couple_name_1,
      couple_name_2: parsed.data.couple_name_2,
      wedding_date: parsed.data.wedding_date,
      city: parsed.data.city,
      venue_name: parsed.data.venue_name,
      estimated_guest_count: parsed.data.estimated_guest_count,
      currency: parsed.data.currency,
      wedding_status: parsed.data.wedding_status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.context.wedding.id)
    .eq("workspace_id", workspaceId);

  if (error) return { error: "Nu am putut actualiza nunta." };

  await logAdminMutation(
    workspaceId,
    ctx.context.userId,
    "wedding.update",
    "wedding",
    ctx.context.wedding.id,
  );
  revalidateAdminWorkspace(workspaceId);
  return { success: "Nunta a fost actualizată." };
}

export async function adminDeleteGuestAction(
  workspaceId: string,
  guestId: string,
): Promise<void> {
  const ctx = await requireAdminWorkspace(workspaceId);
  if (!ctx.ok || !ctx.context) return;

  const parsed = z.string().uuid().safeParse(guestId);
  if (!parsed.success) return;

  await ctx.context.supabase
    .from("guests")
    .delete()
    .eq("id", parsed.data)
    .eq("workspace_id", workspaceId);

  await logAdminMutation(
    workspaceId,
    ctx.context.userId,
    "guest.delete",
    "guest",
    parsed.data,
  );
  revalidateAdminWorkspace(workspaceId);
}

export async function adminDeleteTableAction(
  workspaceId: string,
  tableId: string,
): Promise<void> {
  const ctx = await requireAdminWorkspace(workspaceId);
  if (!ctx.ok || !ctx.context) return;

  const parsed = z.string().uuid().safeParse(tableId);
  if (!parsed.success) return;

  await ctx.context.supabase
    .from("tables")
    .delete()
    .eq("id", parsed.data)
    .eq("workspace_id", workspaceId);

  await logAdminMutation(
    workspaceId,
    ctx.context.userId,
    "table.delete",
    "table",
    parsed.data,
  );
  revalidateAdminWorkspace(workspaceId);
}

export async function adminDeleteVendorAction(
  workspaceId: string,
  vendorId: string,
): Promise<void> {
  const ctx = await requireAdminWorkspace(workspaceId);
  if (!ctx.ok || !ctx.context) return;

  const parsed = z.string().uuid().safeParse(vendorId);
  if (!parsed.success) return;

  await ctx.context.supabase
    .from("vendors")
    .delete()
    .eq("id", parsed.data)
    .eq("workspace_id", workspaceId);

  await logAdminMutation(
    workspaceId,
    ctx.context.userId,
    "vendor.delete",
    "vendor",
    parsed.data,
  );
  revalidateAdminWorkspace(workspaceId);
}

export async function adminDeleteContactAction(
  workspaceId: string,
  contactId: string,
): Promise<void> {
  const ctx = await requireAdminWorkspace(workspaceId);
  if (!ctx.ok || !ctx.context) return;

  const parsed = z.string().uuid().safeParse(contactId);
  if (!parsed.success) return;

  await ctx.context.supabase
    .from("wedding_contacts")
    .delete()
    .eq("id", parsed.data)
    .eq("workspace_id", workspaceId);

  await logAdminMutation(
    workspaceId,
    ctx.context.userId,
    "contact.delete",
    "wedding_contact",
    parsed.data,
  );
  revalidateAdminWorkspace(workspaceId);
}

export async function adminUpdateWorkspaceNameAction(
  workspaceId: string,
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const ctx = await requireAdminWorkspace(workspaceId);
  if (!ctx.ok || !ctx.context) return { error: ctx.error };

  const name = z
    .string()
    .trim()
    .min(2, "Numele este prea scurt")
    .max(120)
    .safeParse(formData.get("name"));

  if (!name.success) {
    return { error: name.error.issues[0]?.message ?? "Nume invalid" };
  }

  const { error } = await ctx.context.supabase
    .from("workspaces")
    .update({ name: name.data, updated_at: new Date().toISOString() })
    .eq("id", workspaceId);

  if (error) return { error: "Nu am putut actualiza workspace-ul." };

  await logAdminMutation(
    workspaceId,
    ctx.context.userId,
    "workspace.rename",
    "workspace",
    workspaceId,
    { name: name.data },
  );
  revalidateAdminWorkspace(workspaceId);
  return { success: "Numele workspace-ului a fost actualizat." };
}

export async function adminArchiveWorkspaceAction(
  workspaceId: string,
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const ctx = await requireAdminWorkspace(workspaceId);
  if (!ctx.ok || !ctx.context) return { error: ctx.error };

  const confirm = String(formData.get("confirm") || "");
  if (confirm !== "ARHIVEAZA") {
    return { error: "Tastează ARHIVEAZA pentru a confirma." };
  }

  const { error } = await ctx.context.supabase
    .from("workspaces")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", workspaceId);

  if (error) return { error: "Nu am putut arhiva workspace-ul." };

  await logAdminMutation(
    workspaceId,
    ctx.context.userId,
    "workspace.archive",
    "workspace",
    workspaceId,
  );
  revalidateAdminWorkspace(workspaceId);
  return { success: "Workspace arhivat." };
}
