import "server-only";

import { logAdminError, logAdminInfo } from "@/lib/admin/log";
import { createClient } from "@/lib/supabase/server";
import type { Workspace } from "@/types/database";

/**
 * Single platform-admin gate for server actions / loaders.
 * Uses the authenticated user session + RPC is_platform_admin().
 * Does NOT use the service-role client to decide admin status.
 */
export async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logAdminInfo(
      { route: "/admin", operation: "requirePlatformAdmin" },
      { ok: false, reason: "unauthenticated" },
    );
    return {
      ok: false as const,
      error: "Neautentificat",
      user: null,
      supabase,
      rpcError: null as { code?: string; message: string } | null,
    };
  }

  const { data: isAdmin, error } = await supabase.rpc("is_platform_admin");
  if (error) {
    logAdminError(
      { route: "/admin", operation: "is_platform_admin" },
      error,
    );
    return {
      ok: false as const,
      error: `Verificare admin eșuată: ${error.message}`,
      user,
      supabase,
      rpcError: {
        code: error.code,
        message: error.message,
      },
    };
  }
  if (!isAdmin) {
    logAdminInfo(
      { route: "/admin", operation: "requirePlatformAdmin" },
      { ok: false, reason: "not_platform_admin", userId: user.id },
    );
    return {
      ok: false as const,
      error: "Acces admin necesar",
      user,
      supabase,
      rpcError: null,
    };
  }

  logAdminInfo(
    { route: "/admin", operation: "requirePlatformAdmin" },
    { ok: true, userId: user.id },
  );
  return {
    ok: true as const,
    error: null,
    user,
    supabase,
    rpcError: null,
  };
}

export function isProtectedSystemWorkspace(
  workspace: Pick<Workspace, "workspace_type">,
) {
  return workspace.workspace_type === "admin";
}
