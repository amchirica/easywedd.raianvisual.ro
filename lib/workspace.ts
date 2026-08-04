import { cache } from "react";
import { cookies } from "next/headers";

import { WORKSPACE_COOKIE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Wedding, Workspace } from "@/types/database";

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48);
}

export async function uniqueWorkspaceSlug(base: string) {
  const supabase = await createClient();
  const slug = slugify(base) || "workspace";
  let attempt = 0;

  while (attempt < 20) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`;
    const { data } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) return candidate;
    attempt += 1;
  }

  return `${slug}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function setActiveWorkspaceId(workspaceId: string) {
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function getActiveWorkspaceId() {
  const cookieStore = await cookies();
  return cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
}

/**
 * Deduped per request — layout + page + nested loaders share one context fetch.
 */
export const getCurrentUserContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      workspaces: [] as Workspace[],
      activeWorkspace: null as Workspace | null,
      wedding: null as Wedding | null,
      isPlatformAdmin: false,
    };
  }

  const [{ data: profile }, { data: memberships }, { data: isPlatformAdmin }, cookieWorkspaceId] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, email, full_name, phone, avatar_url, locale, timezone, onboarding_completed, account_status, account_status_note, account_status_updated_at, account_status_updated_by, suspended_at, soft_deleted_at, created_at, updated_at",
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .eq("invitation_status", "accepted"),
      supabase.rpc("is_platform_admin"),
      getActiveWorkspaceId(),
    ]);

  const workspaceIds = (memberships ?? []).map((m) => m.workspace_id);
  let workspaces: Workspace[] = [];

  if (workspaceIds.length > 0) {
    const { data } = await supabase
      .from("workspaces")
      .select(
        "id, name, slug, workspace_type, owner_id, status, soft_deleted_at, created_at, updated_at",
      )
      .in("id", workspaceIds)
      .order("created_at", { ascending: true });
    workspaces = (data ?? []) as Workspace[];
  }

  const activeWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ??
    workspaces[0] ??
    null;

  let wedding: Wedding | null = null;
  if (activeWorkspace) {
    const { data } = await supabase
      .from("weddings")
      .select(
        "id, workspace_id, couple_name_1, couple_name_2, wedding_date, civil_ceremony_date, religious_ceremony_date, city, venue_name, estimated_guest_count, currency, wedding_status, created_at, updated_at",
      )
      .eq("workspace_id", activeWorkspace.id)
      .maybeSingle();
    wedding = data as Wedding | null;
  }

  return {
    user,
    profile: profile as Profile | null,
    workspaces,
    activeWorkspace,
    wedding,
    isPlatformAdmin: Boolean(isPlatformAdmin),
  };
});

/** Shared entitlements fetch — layout + planner context share one query. */
export const getWorkspaceEntitlementRows = cache(async (workspaceId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("feature_entitlements")
    .select("feature_key, enabled, usage_limit, usage_value")
    .eq("workspace_id", workspaceId);
  return data ?? [];
});
