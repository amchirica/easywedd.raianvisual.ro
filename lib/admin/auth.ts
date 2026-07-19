import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Workspace } from "@/types/database";

export async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Neautentificat", user: null, supabase };
  }

  const { data: isAdmin, error } = await supabase.rpc("is_platform_admin");
  if (error || !isAdmin) {
    return {
      ok: false as const,
      error: "Acces admin necesar",
      user: null,
      supabase,
    };
  }

  return { ok: true as const, error: null, user, supabase };
}

export function isProtectedSystemWorkspace(workspace: Pick<Workspace, "workspace_type">) {
  return workspace.workspace_type === "admin";
}
