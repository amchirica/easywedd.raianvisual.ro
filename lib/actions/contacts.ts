"use server";

import { revalidatePath } from "next/cache";

import { canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { contactSchema } from "@/lib/validations/contacts";

export type ActionState = { error?: string; success?: string };

export async function createContactAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  const parsed = contactSchema.safeParse({
    contact_type: formData.get("contact_type") || "other",
    name: formData.get("name"),
    role_label: String(formData.get("role_label") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    email: String(formData.get("email") || "") || undefined,
    notes: String(formData.get("notes") || "") || undefined,
  });

  if (!parsed.success) {
    return;
  }

  const { error } = await ctx.context.supabase.from("wedding_contacts").insert({
    workspace_id: ctx.context.workspaceId,
    wedding_id: ctx.context.weddingId,
    contact_type: parsed.data.contact_type,
    name: parsed.data.name,
    role_label: parsed.data.role_label ?? null,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email || null,
    notes: parsed.data.notes ?? null,
  });

  if (error) return;
  revalidatePath("/dashboard/contacts");
  return;
}

export async function deleteContactAction(id: string): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManagePlanner(ctx.context.role)) return;

  await ctx.context.supabase
    .from("wedding_contacts")
    .delete()
    .eq("id", id)
    .eq("workspace_id", ctx.context.workspaceId);

  revalidatePath("/dashboard/contacts");
}
