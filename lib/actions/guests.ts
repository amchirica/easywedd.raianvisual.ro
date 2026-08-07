"use server";

import { revalidatePath } from "next/cache";

import { trackProductEvent } from "@/lib/analytics/product";
import {
  assertWithinLimit,
  requireFeature,
} from "@/lib/entitlements/service";
import type { ErrorCode } from "@/lib/i18n/errors";
import { canManageGuests } from "@/lib/planner/access";
import { logAudit, requireWeddingContext } from "@/lib/planner/context";
import { parseGuestCsv, toCsv } from "@/lib/planner/exports";
import { guestGroupSchema, guestSchema } from "@/lib/validations/guests";
import { getSiteUrl } from "@/lib/url";
import type { GuestSide } from "@/types/planner";

export type ActionState = {
  error?: string;
  errorCode?: ErrorCode;
  success?: string;
  csv?: string;
  rsvpUrl?: string;
};

export async function createGuestAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManageGuests(ctx.context.role)) return;

  const feature = await requireFeature(ctx.context.workspaceId, "guests");
  if (!feature.ok) return;

  const { count } = await ctx.context.supabase
    .from("guests")
    .select("*", { count: "exact", head: true })
    .eq("wedding_id", ctx.context.weddingId);
  if (!assertWithinLimit(feature.snapshot.rows, "guest_limit", count ?? 0)) {
    return;
  }

  const parsed = guestSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name") || "",
    email: String(formData.get("email") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    relationship: String(formData.get("relationship") || "") || undefined,
    side: formData.get("side") || "other",
    group_id: String(formData.get("group_id") || "") || undefined,
    invitation_status: formData.get("invitation_status") || "not_sent",
    rsvp_status: formData.get("rsvp_status") || "pending",
    attendance_count: formData.get("attendance_count") || 1,
    children_count: formData.get("children_count") || 0,
    meal_preference: String(formData.get("meal_preference") || "") || undefined,
    allergies: String(formData.get("allergies") || "") || undefined,
    accommodation_needed: formData.get("accommodation_needed") === "on",
    transport_needed: formData.get("transport_needed") === "on",
    notes: String(formData.get("notes") || "") || undefined,
    consent_to_contact: formData.get("consent_to_contact") === "on",
  });

  if (!parsed.success) {
    return;
  }

  const { error } = await ctx.context.supabase.from("guests").insert({
    workspace_id: ctx.context.workspaceId,
    wedding_id: ctx.context.weddingId,
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    relationship: parsed.data.relationship || null,
    side: parsed.data.side,
    group_id: parsed.data.group_id || null,
    invitation_status: parsed.data.invitation_status,
    rsvp_status: parsed.data.rsvp_status,
    attendance_count: parsed.data.attendance_count,
    children_count: parsed.data.children_count,
    meal_preference: parsed.data.meal_preference || null,
    allergies: parsed.data.allergies || null,
    accommodation_needed: parsed.data.accommodation_needed,
    transport_needed: parsed.data.transport_needed,
    notes: parsed.data.notes || null,
    consent_to_contact: parsed.data.consent_to_contact,
  });

  if (error) return;
  await trackProductEvent("guest_added", {
    workspaceId: ctx.context.workspaceId,
    userId: ctx.context.user!.id,
    properties: { side: parsed.data.side },
  });
  revalidatePath("/dashboard/guests");
  return;
}

export async function createGuestGroupAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManageGuests(ctx.context.role)) return;

  const parsed = guestGroupSchema.safeParse({
    name: formData.get("name"),
    notes: String(formData.get("notes") || "") || undefined,
  });
  if (!parsed.success) {
    return;
  }

  const { error } = await ctx.context.supabase.from("guest_groups").insert({
    workspace_id: ctx.context.workspaceId,
    wedding_id: ctx.context.weddingId,
    name: parsed.data.name,
    notes: parsed.data.notes ?? null,
  });

  if (error) return;
  revalidatePath("/dashboard/guests");
  return;
}

export async function importGuestsCsvAction(formData: FormData): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManageGuests(ctx.context.role)) return;

  const file = formData.get("file");
  if (!(file instanceof File)) return;
  const content = await file.text();

  let rows;
  try {
    rows = parseGuestCsv(content);
  } catch {
    return;
  }

  if (rows.length === 0) return;

  const payload = rows.map((row) => ({
    workspace_id: ctx.context!.workspaceId,
    wedding_id: ctx.context!.weddingId,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email || null,
    phone: row.phone || null,
    side: (["bride", "groom", "both", "other"].includes(row.side ?? "")
      ? row.side
      : "other") as GuestSide,
    relationship: row.relationship || null,
    meal_preference: row.meal_preference || null,
    allergies: row.allergies || null,
  }));

  const { error } = await ctx.context.supabase.from("guests").insert(payload);
  if (error) return;

  await logAudit(
    ctx.context.workspaceId,
    ctx.context.user!.id,
    "guests.import_csv",
    "guest",
    null,
    { count: payload.length },
  );

  await trackProductEvent("guest_imported", {
    workspaceId: ctx.context.workspaceId,
    userId: ctx.context.user!.id,
    properties: { count: payload.length },
  });

  revalidatePath("/dashboard/guests");
  return;
}

export async function exportGuestsCsvAction(): Promise<ActionState> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Eroare", errorCode: "generic" };
  }

  const { data } = await ctx.context.supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", ctx.context.weddingId)
    .order("last_name");

  const csv = toCsv(
    (data ?? []).map((g) => ({
      first_name: g.first_name,
      last_name: g.last_name,
      email: g.email,
      phone: g.phone,
      side: g.side,
      rsvp_status: g.rsvp_status,
      attendance_count: g.attendance_count,
      children_count: g.children_count,
      meal_preference: g.meal_preference,
      allergies: g.allergies,
    })),
  );

  await logAudit(
    ctx.context.workspaceId,
    ctx.context.user!.id,
    "export.csv",
    "guest",
    null,
    { rows: data?.length ?? 0 },
  );

  return { success: "Export generat.", csv };
}

export async function createRsvpLinkAction(guestId: string): Promise<ActionState> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Eroare", errorCode: "generic" };
  }
  if (!canManageGuests(ctx.context.role)) {
    return { error: "Fără permisiune.", errorCode: "permission_denied" };
  }

  const { data: token, error } = await ctx.context.supabase.rpc(
    "create_rsvp_token",
    { p_guest_id: guestId, p_expires_days: 60 },
  );

  if (error || !token) {
    return {
      error: error?.message ?? "Nu am putut crea linkul.",
      errorCode: "invite_failed",
    };
  }

  return {
    success: "Link RSVP creat.",
    rsvpUrl: `${getSiteUrl()}/rsvp/${token}`,
  };
}

export async function anonymizeGuestAction(guestId: string): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManageGuests(ctx.context.role)) return;

  await ctx.context.supabase.rpc("anonymize_guest", {
    p_guest_id: guestId,
  });

  revalidatePath("/dashboard/guests");
}

export async function deleteGuestAction(guestId: string): Promise<void> {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return;
  if (!canManageGuests(ctx.context.role)) return;

  await ctx.context.supabase
    .from("guests")
    .delete()
    .eq("id", guestId)
    .eq("workspace_id", ctx.context.workspaceId);

  revalidatePath("/dashboard/guests");
}
