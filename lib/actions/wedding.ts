"use server";

import { revalidatePath } from "next/cache";

import { canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { weddingDetailsSchema } from "@/lib/validations/wedding";

export type WeddingActionResult = {
  error?: string;
  success?: string;
};

export async function updateWeddingDetailsAction(
  _prev: WeddingActionResult,
  formData: FormData,
): Promise<WeddingActionResult> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Workspace incomplet" };
  }
  if (!canManagePlanner(ctx.context.role)) {
    return { error: "Nu ai permisiunea de a edita detaliile nunții." };
  }

  const guestRaw = String(formData.get("estimated_guest_count") ?? "").trim();
  const parsed = weddingDetailsSchema.safeParse({
    couple_name_1: formData.get("couple_name_1"),
    couple_name_2: formData.get("couple_name_2"),
    wedding_date: String(formData.get("wedding_date") || "") || "",
    city: String(formData.get("city") || "") || "",
    venue_name: String(formData.get("venue_name") || "") || "",
    estimated_guest_count: guestRaw === "" ? null : Number(guestRaw),
    currency: formData.get("currency") || "RON",
    wedding_status: formData.get("wedding_status") || "planning",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const data = parsed.data;
  const { error } = await ctx.context.supabase
    .from("weddings")
    .update({
      couple_name_1: data.couple_name_1,
      couple_name_2: data.couple_name_2,
      wedding_date: data.wedding_date,
      city: data.city,
      venue_name: data.venue_name,
      estimated_guest_count: data.estimated_guest_count ?? null,
      currency: data.currency,
      wedding_status: data.wedding_status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.context.weddingId)
    .eq("workspace_id", ctx.context.workspaceId);

  if (error) {
    console.error("[wedding:update]", { code: error.code, message: error.message });
    return { error: "Nu am putut salva detaliile nunții. Încearcă din nou." };
  }

  revalidatePath("/dashboard/wedding");
  return { success: "Detaliile nunții au fost actualizate." };
}
