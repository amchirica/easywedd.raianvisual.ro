"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  listAdminUserOptions,
  listContractsDirectory,
  listSubscriptionsForWorkspace,
  listWorkspacesForUser,
} from "@/lib/admin/admin-directory";
import type {
  AdminContractOption,
  AdminSubscriptionOption,
  AdminUserOption,
  AdminWorkspaceOption,
} from "@/lib/admin/admin-directory-types";
import {
  isProtectedSystemWorkspace,
  requirePlatformAdmin,
} from "@/lib/admin/auth";
import { logAudit } from "@/lib/planner/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/workspace";
import type { WorkspaceType } from "@/types/database";

export type AdminDirectoryResult<T> = {
  error?: string;
  data?: T;
};

async function assertAdmin() {
  const auth = await requirePlatformAdmin();
  if (!auth.ok || !auth.user) {
    return { ok: false as const, error: auth.error ?? "Acces admin necesar" };
  }
  return { ok: true as const, user: auth.user };
}

async function uniqueSlugAdmin(base: string) {
  const admin = createAdminClient();
  const slug = slugify(base) || "workspace";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`;
    const { data } = await admin
      .from("workspaces")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${slug}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function searchAdminUsersAction(
  q: string,
): Promise<AdminDirectoryResult<AdminUserOption[]>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  try {
    const data = await listAdminUserOptions(q);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare la căutare" };
  }
}

export async function getUserWorkspacesAction(
  userId: string,
): Promise<AdminDirectoryResult<AdminWorkspaceOption[]>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = z.string().uuid().safeParse(userId);
  if (!parsed.success) return { error: "Utilizator invalid" };

  try {
    const data = await listWorkspacesForUser(parsed.data);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare workspace-uri" };
  }
}

export async function getWorkspaceSubscriptionsAction(
  workspaceId: string,
): Promise<AdminDirectoryResult<AdminSubscriptionOption[]>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = z.string().uuid().safeParse(workspaceId);
  if (!parsed.success) return { error: "Workspace invalid" };

  try {
    const data = await listSubscriptionsForWorkspace(parsed.data);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare abonamente" };
  }
}

export async function listAdminContractsAction(
  q?: string,
): Promise<AdminDirectoryResult<AdminContractOption[]>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };
  try {
    const data = await listContractsDirectory({ q });
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare contracte" };
  }
}

export async function adminCreateWorkspaceForUserAction(
  _prev: { error?: string; success?: string; workspaceId?: string },
  formData: FormData,
): Promise<{ error?: string; success?: string; workspaceId?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const schema = z.object({
    user_id: z.string().uuid(),
    name: z.string().min(2).max(120),
    workspace_type: z.enum(["couple", "planner", "raian_client"]),
  });

  const parsed = schema.safeParse({
    user_id: formData.get("user_id"),
    name: formData.get("name"),
    workspace_type: formData.get("workspace_type") || "couple",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "validation.invalid" };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email")
    .eq("id", parsed.data.user_id)
    .maybeSingle();
  if (!profile) return { error: "Utilizator inexistent" };

  const slug = await uniqueSlugAdmin(parsed.data.name);
  const { data: workspace, error } = await admin
    .from("workspaces")
    .insert({
      name: parsed.data.name,
      slug,
      workspace_type: parsed.data.workspace_type as WorkspaceType,
      owner_id: parsed.data.user_id,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !workspace) {
    return { error: "Nu am putut crea workspace-ul." };
  }

  await admin.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: parsed.data.user_id,
    role: "owner",
    invitation_status: "accepted",
  });

  await admin.from("weddings").insert({
    workspace_id: workspace.id,
    couple_name_1: parsed.data.name,
    wedding_status: "planning",
  });

  await admin.from("subscriptions").insert({
    workspace_id: workspace.id,
    plan: "trial",
    status: "trialing",
    plan_key: "trial",
    product_key: "trial",
    access_source: "trial",
  });

  await admin.rpc("sync_workspace_entitlements", {
    p_workspace_id: workspace.id,
  });

  await logAudit(
    workspace.id,
    auth.user.id,
    "admin.workspace.create_for_user",
    "workspace",
    workspace.id,
    { user_id: parsed.data.user_id },
  );

  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/workspaces");
  revalidatePath("/admin/users");
  return {
    success: "Workspace creat.",
    workspaceId: workspace.id,
  };
}

export async function adminCreateWorkspaceForUserFormAction(
  formData: FormData,
): Promise<void> {
  await adminCreateWorkspaceForUserAction({}, formData);
}

/** Guard helper for client forms — verifies admin + protected workspace. */
export async function assertAdminCanMutateWorkspace(
  workspaceId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const admin = createAdminClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("workspace_type")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace) return { ok: false, error: "Workspace inexistent" };
  if (isProtectedSystemWorkspace(workspace)) {
    return { ok: false, error: "Nu poți modifica workspace-uri de sistem." };
  }
  return { ok: true };
}
