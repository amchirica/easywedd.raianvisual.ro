"use server";

import { revalidatePath } from "next/cache";

import { CONSENT_VERSION } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/workspace";
import type { ConsentType, Json } from "@/types/database";

export async function updateConsentAction(formData: FormData): Promise<void> {
  const ctx = await getCurrentUserContext();
  if (!ctx.user) return;

  const consentType = String(formData.get("consent_type") || "") as ConsentType;
  const granted = formData.get("granted") === "on";
  const supabase = await createClient();
  const now = new Date().toISOString();

  await supabase.from("user_consents").insert({
    user_id: ctx.user.id,
    workspace_id: ctx.activeWorkspace?.id ?? null,
    consent_type: consentType,
    consent_version: CONSENT_VERSION,
    granted,
    granted_at: granted ? now : null,
    revoked_at: granted ? null : now,
    source: "privacy_center",
  });

  if (consentType === "anonymized_industry_research") {
    await supabase.from("gdpr_requests").insert({
      user_id: ctx.user.id,
      workspace_id: ctx.activeWorkspace?.id ?? null,
      request_type: "consent_revoke",
      status: "completed",
      notes: granted ? "consent_granted" : "consent_revoked",
      completed_at: now,
    });
  }

  revalidatePath("/dashboard/privacy");
}

export async function updateEmailPreferencesAction(formData: FormData): Promise<void> {
  const ctx = await getCurrentUserContext();
  if (!ctx.user) return;
  const supabase = await createClient();

  await supabase.from("email_preferences").upsert(
    {
      user_id: ctx.user.id,
      transactional_enabled: formData.get("transactional_enabled") === "on",
      marketing_enabled: formData.get("marketing_enabled") === "on",
      reminders_enabled: formData.get("reminders_enabled") === "on",
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/dashboard/privacy");
}

export async function requestGdprExportAction(): Promise<{
  payload?: Json;
  error?: string;
}> {
  const ctx = await getCurrentUserContext();
  if (!ctx.user) return { error: "Neautentificat" };

  const supabase = await createClient();
  const [
    { data: profile },
    { data: consents },
    { data: wedding },
  ] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, locale, timezone, created_at").eq("id", ctx.user.id).maybeSingle(),
    supabase
      .from("user_consents")
      .select("consent_type, granted, consent_version, granted_at, revoked_at, source")
      .eq("user_id", ctx.user.id),
    ctx.wedding
      ? supabase
          .from("weddings")
          .select(
            "id, couple_name_1, couple_name_2, wedding_date, city, venue_name, status",
          )
          .eq("id", ctx.wedding.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    profile,
    consents,
    wedding,
    note: "Export minimal — fără listă invitați în acest payload (cerere separată).",
  } as Json;

  await supabase.from("gdpr_requests").insert({
    user_id: ctx.user.id,
    workspace_id: ctx.activeWorkspace?.id ?? null,
    request_type: "export",
    status: "completed",
    result_payload: payload,
    completed_at: new Date().toISOString(),
  });

  revalidatePath("/dashboard/privacy");
  return { payload };
}

export async function requestWorkspaceDeletionAction(): Promise<void> {
  const ctx = await getCurrentUserContext();
  if (!ctx.user || !ctx.activeWorkspace) return;
  if (ctx.activeWorkspace.owner_id !== ctx.user.id) return;

  const supabase = await createClient();
  await supabase.from("gdpr_requests").insert({
    user_id: ctx.user.id,
    workspace_id: ctx.activeWorkspace.id,
    request_type: "delete",
    status: "pending",
    notes: "Workspace deletion requested. Admin/service-role cleanup includes storage paths.",
  });

  revalidatePath("/dashboard/privacy");
  revalidatePath("/admin/gdpr");
}
