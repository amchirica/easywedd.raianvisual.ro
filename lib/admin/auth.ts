import "server-only";

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
    return {
      ok: false as const,
      error: "Neautentificat",
      user: null,
      supabase,
    };
  }

  const { data: isAdmin, error } = await supabase.rpc("is_platform_admin");
  if (error) {
    return {
      ok: false as const,
      error: `Verificare admin eșuată: ${error.message}`,
      user,
      supabase,
    };
  }
  if (!isAdmin) {
    return {
      ok: false as const,
      error: "Acces admin necesar",
      user,
      supabase,
    };
  }

  return { ok: true as const, error: null, user, supabase };
}

export function isProtectedSystemWorkspace(
  workspace: Pick<Workspace, "workspace_type">,
) {
  return workspace.workspace_type === "admin";
}
