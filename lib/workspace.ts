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

export async function getCurrentUserContext() {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .eq("invitation_status", "accepted");

  const workspaceIds = (memberships ?? []).map((m) => m.workspace_id);
  let workspaces: Workspace[] = [];

  if (workspaceIds.length > 0) {
    const { data } = await supabase
      .from("workspaces")
      .select("*")
      .in("id", workspaceIds)
      .order("created_at", { ascending: true });
    workspaces = data ?? [];
  }

  const cookieWorkspaceId = await getActiveWorkspaceId();
  const activeWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ??
    workspaces[0] ??
    null;

  let wedding: Wedding | null = null;
  if (activeWorkspace) {
    const { data } = await supabase
      .from("weddings")
      .select("*")
      .eq("workspace_id", activeWorkspace.id)
      .maybeSingle();
    wedding = data;
  }

  const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");

  return {
    user,
    profile: profile as Profile | null,
    workspaces,
    activeWorkspace,
    wedding,
    isPlatformAdmin: Boolean(isPlatformAdmin),
  };
}
