"use server";

import { headers } from "next/headers";
import { createHash } from "crypto";

import { trackProductEvent } from "@/lib/analytics/product";
import { deviceClassFromUa } from "@/lib/invitations/analytics";
import { sanitizePlainText } from "@/lib/invitations/schema";
import { sendTransactionalEmail } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";
import { invitationRsvpSchema } from "@/lib/validations/invitations";

export type InvitationRsvpState = { error?: string; success?: string };

function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export async function submitInvitationRsvpAction(
  _prev: InvitationRsvpState,
  formData: FormData,
): Promise<InvitationRsvpState> {
  const parsed = invitationRsvpSchema.safeParse({
    token: formData.get("token"),
    rsvp_status: formData.get("rsvp_status"),
    attendance_count: formData.get("attendance_count") || 1,
    children_count: formData.get("children_count") || 0,
    meal_preference: String(formData.get("meal_preference") || "") || undefined,
    allergies: String(formData.get("allergies") || "") || undefined,
    transport_needed: formData.get("transport_needed") === "on",
    accommodation_needed: formData.get("accommodation_needed") === "on",
    message: String(formData.get("message") || "") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "validation.invalid" };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown";

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_invitation_rsvp", {
    p_token: parsed.data.token,
    p_rsvp_status: parsed.data.rsvp_status,
    p_attendance_count: parsed.data.attendance_count,
    p_children_count: parsed.data.children_count,
    p_meal_preference: parsed.data.meal_preference
      ? sanitizePlainText(parsed.data.meal_preference)
      : null,
    p_allergies: parsed.data.allergies
      ? sanitizePlainText(parsed.data.allergies)
      : null,
    p_transport_needed: parsed.data.transport_needed,
    p_accommodation_needed: parsed.data.accommodation_needed,
    p_message: parsed.data.message
      ? sanitizePlainText(parsed.data.message)
      : null,
    p_ip_hash: hashIp(ip),
  });

  if (error) {
    const map: Record<string, string> = {
      invalid_token: "Link invalid.",
      deadline_passed: "Termenul de RSVP a trecut.",
      rate_limited: "Prea multe încercări. Încearcă mai târziu.",
      invalid_status: "Status RSVP invalid.",
    };
    return { error: map[error.message] ?? error.message };
  }

  const email = String(formData.get("confirm_email") || "");
  if (email.includes("@")) {
    await sendTransactionalEmail({
      to: email,
      subject: "Confirmare RSVP",
      html: `<p>Mulțumim! Răspunsul tău (${parsed.data.rsvp_status}) a fost înregistrat.</p>`,
    });
  }

  await trackProductEvent("rsvp_submitted", {
    properties: { status: parsed.data.rsvp_status, source: "invitation" },
  });

  return { success: "Mulțumim! Răspunsul tău a fost înregistrat." };
}

export async function recordInvitationOpenAction(token: string) {
  const headerStore = await headers();
  const ua = headerStore.get("user-agent");
  const supabase = await createClient();
  await supabase.rpc("record_invitation_open", {
    p_token: token,
    p_device_class: deviceClassFromUa(ua),
  });
  await trackProductEvent("invitation_opened", {
    properties: { device: deviceClassFromUa(ua) },
  });
}
