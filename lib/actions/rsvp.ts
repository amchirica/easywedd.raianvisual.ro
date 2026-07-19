"use server";

import { createClient } from "@/lib/supabase/server";
import { rsvpPublicSchema } from "@/lib/validations/guests";

export type RsvpActionState = { error?: string; success?: string };

export async function submitPublicRsvpAction(
  _prev: RsvpActionState,
  formData: FormData,
): Promise<RsvpActionState> {
  const parsed = rsvpPublicSchema.safeParse({
    token: formData.get("token"),
    rsvp_status: formData.get("rsvp_status"),
    attendance_count: formData.get("attendance_count") || 1,
    children_count: formData.get("children_count") || 0,
    meal_preference: String(formData.get("meal_preference") || "") || undefined,
    allergies: String(formData.get("allergies") || "") || undefined,
    message: String(formData.get("message") || "") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_rsvp", {
    p_token: parsed.data.token,
    p_rsvp_status: parsed.data.rsvp_status,
    p_attendance_count: parsed.data.attendance_count,
    p_children_count: parsed.data.children_count,
    p_meal_preference: parsed.data.meal_preference ?? null,
    p_allergies: parsed.data.allergies ?? null,
    p_message: parsed.data.message ?? null,
  });

  if (error) {
    const map: Record<string, string> = {
      invalid_token: "Link invalid.",
      token_revoked: "Link revocat.",
      token_expired: "Link expirat.",
      token_used: "Acest link a fost deja folosit.",
      invalid_status: "Status RSVP invalid.",
    };
    return { error: map[error.message] ?? error.message };
  }

  return { success: "Mulțumim! Răspunsul tău a fost înregistrat." };
}
