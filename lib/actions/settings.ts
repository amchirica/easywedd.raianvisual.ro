"use server";

import { revalidatePath } from "next/cache";

import { canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import { createClient } from "@/lib/supabase/server";
import {
  notificationPreferencesSchema,
  profileSettingsSchema,
  updatePasswordSchema,
  workspaceSettingsSchema,
} from "@/lib/validations/settings";
import { weddingDetailsSchema } from "@/lib/validations/wedding";
import { setActiveWorkspaceId } from "@/lib/workspace";

export type SettingsActionResult = {
  error?: string;
  success?: string;
};

export async function updateProfileSettingsAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesiunea a expirat. Autentifică-te din nou." };

  const parsed = profileSettingsSchema.safeParse({
    full_name: formData.get("full_name"),
    locale: formData.get("locale") || "ro",
    timezone: formData.get("timezone") || "Europe/Bucharest",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      locale: parsed.data.locale,
      timezone: parsed.data.timezone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[settings:profile]", { code: error.code, message: error.message });
    return { error: "Nu am putut actualiza profilul." };
  }

  revalidatePath("/dashboard/settings");
  return { success: "Profilul a fost actualizat." };
}

export async function updateWorkspaceSettingsAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesiunea a expirat. Autentifică-te din nou." };

  const parsed = workspaceSettingsSchema.safeParse({
    workspace_id: formData.get("workspace_id"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, workspace_type, name")
    .eq("id", parsed.data.workspace_id)
    .maybeSingle();

  if (!workspace) {
    return { error: "Workspace-ul nu a fost găsit." };
  }

  if (workspace.workspace_type === "admin") {
    const { data: isAdmin } = await supabase.rpc("is_platform_admin");
    if (!isAdmin) {
      return {
        error: "Workspace-urile de tip admin nu pot fi redenumite din Setări.",
      };
    }
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", parsed.data.workspace_id)
    .eq("user_id", user.id)
    .eq("invitation_status", "accepted")
    .maybeSingle();

  if (
    !membership ||
    !["owner", "partner", "admin"].includes(membership.role)
  ) {
    return { error: "Nu ai permisiunea de a edita acest workspace." };
  }

  // Never allow workspace_type changes from this action
  const { error } = await supabase
    .from("workspaces")
    .update({
      name: parsed.data.name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.workspace_id);

  if (error) {
    console.error("[settings:workspace]", { code: error.code, message: error.message });
    return { error: "Nu am putut actualiza workspace-ul." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: "Numele workspace-ului a fost actualizat." };
}

export async function updateWeddingPreferencesAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Workspace incomplet" };
  }
  if (!canManagePlanner(ctx.context.role)) {
    return { error: "Nu ai permisiunea de a edita preferințele nunții." };
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
    return { error: "Nu am putut salva preferințele nunții." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/wedding");
  return { success: "Preferințele nunții au fost actualizate." };
}

export async function updateNotificationPreferencesAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesiunea a expirat. Autentifică-te din nou." };

  const parsed = notificationPreferencesSchema.safeParse({
    transactional_enabled: formData.get("transactional_enabled") === "on",
    reminders_enabled: formData.get("reminders_enabled") === "on",
    marketing_enabled: formData.get("marketing_enabled") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { error } = await supabase.from("email_preferences").upsert(
    {
      user_id: user.id,
      transactional_enabled: parsed.data.transactional_enabled,
      reminders_enabled: parsed.data.reminders_enabled,
      marketing_enabled: parsed.data.marketing_enabled,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[settings:notifications]", {
      code: error.code,
      message: error.message,
    });
    return { error: "Nu am putut salva preferințele de notificare." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/privacy");
  return { success: "Preferințele de notificare au fost actualizate." };
}

export async function updatePasswordAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesiunea a expirat. Autentifică-te din nou." };

  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    console.error("[settings:password]", { message: error.message });
    return {
      error:
        error.message.toLowerCase().includes("same")
          ? "Parola nouă trebuie să fie diferită de cea actuală."
          : "Nu am putut actualiza parola. Încearcă din nou.",
    };
  }

  revalidatePath("/dashboard/settings");
  return { success: "Parola a fost actualizată." };
}

export async function switchWorkspaceFormAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const workspaceId = String(formData.get("workspace_id") ?? "");
  if (!workspaceId) return { error: "Workspace invalid." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesiunea a expirat." };

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .eq("invitation_status", "accepted")
    .maybeSingle();

  if (!membership) {
    return { error: "Nu ai acces la acest workspace." };
  }

  await setActiveWorkspaceId(workspaceId);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { success: "Workspace-ul activ a fost schimbat." };
}
