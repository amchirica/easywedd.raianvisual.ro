import "server-only";

import {
  isProtectedSystemWorkspace,
  requirePlatformAdmin,
} from "@/lib/admin/auth";
import { logAudit } from "@/lib/planner/context";
import type { Json, Wedding, Workspace } from "@/types/database";

export type AdminWorkspaceContext = {
  userId: string;
  workspace: Workspace;
  wedding: Wedding | null;
  supabase: Awaited<ReturnType<typeof requirePlatformAdmin>>["supabase"];
};

export async function requireAdminWorkspace(
  workspaceId: string,
  options?: { allowSystem?: boolean },
): Promise<
  | { ok: true; context: AdminWorkspaceContext; error: null }
  | { ok: false; context: null; error: string }
> {
  const auth = await requirePlatformAdmin();
  if (!auth.ok || !auth.user) {
    return { ok: false, context: null, error: auth.error };
  }

  const { data: workspace } = await auth.supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace) {
    return { ok: false, context: null, error: "Workspace inexistent" };
  }

  if (
    !options?.allowSystem &&
    isProtectedSystemWorkspace(workspace)
  ) {
    return {
      ok: false,
      context: null,
      error: "Workspace-urile de tip admin/sistem nu pot fi gestionate aici.",
    };
  }

  const { data: wedding } = await auth.supabase
    .from("weddings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return {
    ok: true,
    error: null,
    context: {
      userId: auth.user.id,
      workspace,
      wedding: wedding ?? null,
      supabase: auth.supabase,
    },
  };
}

export async function logAdminMutation(
  workspaceId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Json = {},
) {
  await logAudit(workspaceId, userId, `admin.${action}`, entityType, entityId, {
    ...((typeof metadata === "object" && metadata && !Array.isArray(metadata)
      ? metadata
      : {}) as Record<string, Json>),
    via: "admin_console",
  });
}

export const ADMIN_WORKSPACE_SECTIONS = [
  { key: "wedding", label: "Nuntă" },
  { key: "guests", label: "Invitați" },
  { key: "budget", label: "Buget" },
  { key: "seating", label: "Seating" },
  { key: "vendors", label: "Vendori" },
  { key: "timeline", label: "Timeline" },
  { key: "contacts", label: "Contacte" },
  { key: "invitations", label: "Invitații" },
  { key: "website", label: "Website" },
  { key: "settings", label: "Setări" },
] as const;

export type AdminWorkspaceSection =
  (typeof ADMIN_WORKSPACE_SECTIONS)[number]["key"];
