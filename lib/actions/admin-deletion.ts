"use server";

import { revalidatePath } from "next/cache";

import { isProtectedSystemWorkspace, requirePlatformAdmin } from "@/lib/admin/auth";
import { emptyImpact, type DeleteImpact, type DeleteResult } from "@/lib/deletion/types";
import { logAudit } from "@/lib/planner/context";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertAdmin() {
  const auth = await requirePlatformAdmin();
  if (!auth.ok || !auth.user) {
    return { ok: false as const, user: null };
  }
  return { ok: true as const, user: auth.user };
}

/** Soft-delete user profile (recoverable). Auto-archives owned workspaces. */
export async function adminSoftDeleteUserAction(
  userId: string,
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };
  if (auth.user.id === userId) {
    return { ok: false, error: "Nu poți șterge propriul cont admin." };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Archive any workspaces this user owns (skip protected admin workspaces)
  const { data: owned } = await admin
    .from("workspaces")
    .select("id, workspace_type")
    .eq("owner_id", userId)
    .is("soft_deleted_at", null);

  for (const ws of owned ?? []) {
    if (isProtectedSystemWorkspace(ws)) continue;
    await admin
      .from("workspaces")
      .update({ status: "archived", soft_deleted_at: now })
      .eq("id", ws.id);
  }

  await admin
    .from("profiles")
    .update({
      soft_deleted_at: now,
      suspended_at: now,
      account_status: "suspended",
    })
    .eq("id", userId);

  await logAudit(null, auth.user.id, "admin.user.soft_delete", "profile", userId, {
    archived_workspaces: (owned ?? []).length,
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/workspaces");
  return { ok: true, mode: "soft" };
}

/** Deactivate = suspend without soft-delete */
export async function adminDeactivateUserAction(
  userId: string,
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };
  if (auth.user.id === userId) {
    return { ok: false, error: "Nu poți dezactiva propriul cont." };
  }

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      suspended_at: new Date().toISOString(),
      account_status: "suspended",
    })
    .eq("id", userId);

  await logAudit(null, auth.user.id, "admin.user.deactivate", "profile", userId, {});
  revalidatePath("/admin/users");
  return { ok: true, mode: "soft" };
}

export async function adminRestoreUserAction(
  userId: string,
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      soft_deleted_at: null,
      suspended_at: null,
      account_status: "approved",
    })
    .eq("id", userId);

  await logAudit(null, auth.user.id, "admin.user.restore", "profile", userId, {});
  revalidatePath("/admin/users");
  return { ok: true, restored: true };
}

/**
 * Hard-delete / anonymize user.
 * Always archives owned workspaces first — no transfer step required.
 */
export async function adminHardDeleteUserAction(
  userId: string,
  _opts?: { force?: boolean },
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };
  if (auth.user.id === userId) {
    return { ok: false, error: "Nu poți șterge propriul cont admin." };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: owned } = await admin
    .from("workspaces")
    .select("id, workspace_type")
    .eq("owner_id", userId);

  for (const ws of owned ?? []) {
    if (isProtectedSystemWorkspace(ws)) continue;
    await admin
      .from("workspaces")
      .update({ status: "archived", soft_deleted_at: now })
      .eq("id", ws.id);
  }

  await admin
    .from("profiles")
    .update({
      soft_deleted_at: now,
      suspended_at: now,
      account_status: "suspended",
      email: `deleted+${userId.slice(0, 8)}@easywedd.invalid`,
      full_name: "Utilizator șters",
    })
    .eq("id", userId);

  try {
    await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
  } catch {
    // Auth ban is best-effort
  }

  await logAudit(null, auth.user.id, "admin.user.hard_delete", "profile", userId, {
    archived_workspaces: (owned ?? []).length,
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/workspaces");
  return { ok: true, mode: "hard" };
}

export async function adminTransferWorkspaceOwnershipAction(
  workspaceId: string,
  newOwnerId: string,
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };

  const admin = createAdminClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("id, owner_id, workspace_type, soft_deleted_at")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace || isProtectedSystemWorkspace(workspace)) {
    return { ok: false, error: "Workspace protejat sau inexistent." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, soft_deleted_at, suspended_at")
    .eq("id", newOwnerId)
    .maybeSingle();
  if (!profile || profile.soft_deleted_at || profile.suspended_at) {
    return { ok: false, error: "Noul owner trebuie să fie un utilizator activ." };
  }

  await admin
    .from("workspaces")
    .update({ owner_id: newOwnerId })
    .eq("id", workspaceId);

  // Ensure membership
  await admin.from("workspace_members").upsert(
    {
      workspace_id: workspaceId,
      user_id: newOwnerId,
      role: "owner",
    },
    { onConflict: "workspace_id,user_id" },
  );

  await logAudit(
    workspaceId,
    auth.user.id,
    "admin.workspace.transfer_ownership",
    "workspace",
    workspaceId,
    { from: workspace.owner_id, to: newOwnerId },
  );

  revalidatePath("/admin/workspaces");
  revalidatePath(`/admin/workspaces/${workspaceId}`);
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function getUserDeleteImpact(
  userId: string,
): Promise<DeleteImpact | null> {
  const auth = await assertAdmin();
  if (!auth.ok) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, full_name, soft_deleted_at, suspended_at")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;

  const { data: workspaces } = await admin
    .from("workspaces")
    .select("id, soft_deleted_at, status")
    .eq("owner_id", userId);

  const activeOwned = (workspaces ?? []).filter(
    (w) => !w.soft_deleted_at && w.status !== "archived",
  );
  const isSoft = Boolean(profile.soft_deleted_at);

  return emptyImpact({
    resourceLabel: "utilizator",
    resourceName: profile.full_name || profile.email,
    canSoftDelete: !isSoft,
    canHardDelete: true,
    canRestore: isSoft,
    requiresTypedConfirm: true,
    typedConfirmPhrase: "STERGE",
    blockers: [],
    warnings: [
      ...(activeOwned.length > 0
        ? [
            `${activeOwned.length} workspace-uri active vor fi arhivate automat.`,
          ]
        : []),
      ...(profile.suspended_at
        ? ["Utilizatorul este deja suspendat."]
        : []),
    ],
    items: [
      {
        label: "Workspace-uri deținute",
        count: (workspaces ?? []).length,
        severity: activeOwned.length ? "warn" : "info",
      },
      {
        label: "Active (se arhivează)",
        count: activeOwned.length,
        severity: activeOwned.length ? "warn" : "info",
      },
    ],
  });
}

export async function adminDeleteInvitationTemplateAction(
  templateId: string,
  opts?: { force?: boolean },
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };

  const admin = createAdminClient();
  const { count } = await admin
    .from("invitation_projects")
    .select("*", { count: "exact", head: true })
    .eq("template_id", templateId)
    .is("soft_deleted_at", null);

  if ((count ?? 0) > 0 && !opts?.force) {
    // Soft-deactivate instead
    await admin
      .from("invitation_templates")
      .update({ is_active: false })
      .eq("id", templateId);
    await logAudit(
      null,
      auth.user.id,
      "admin.template.deactivate",
      "invitation_template",
      templateId,
      { reason: "in_use" },
    );
    revalidatePath("/admin/templates");
    return {
      ok: true,
      mode: "soft",
      error: undefined,
    };
  }

  if ((count ?? 0) > 0 && opts?.force) {
    await admin
      .from("invitation_projects")
      .update({ template_id: null })
      .eq("template_id", templateId);
  }

  const { error } = await admin
    .from("invitation_templates")
    .delete()
    .eq("id", templateId);

  if (error) return { ok: false, error: "Nu s-a putut șterge template-ul." };

  await logAudit(
    null,
    auth.user.id,
    "admin.template.delete",
    "invitation_template",
    templateId,
    { force: Boolean(opts?.force) },
  );
  revalidatePath("/admin/templates");
  return { ok: true, mode: "hard" };
}

export async function adminDeleteWebsiteTemplateAction(
  templateId: string,
  opts?: { force?: boolean },
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };

  const admin = createAdminClient();
  const { count } = await admin
    .from("wedding_sites")
    .select("*", { count: "exact", head: true })
    .eq("template_id", templateId)
    .is("soft_deleted_at", null);

  if ((count ?? 0) > 0 && !opts?.force) {
    await admin
      .from("wedding_site_templates")
      .update({ is_active: false })
      .eq("id", templateId);
    await logAudit(
      null,
      auth.user.id,
      "admin.site_template.deactivate",
      "wedding_site_template",
      templateId,
      { reason: "in_use" },
    );
    revalidatePath("/admin/templates");
    return { ok: true, mode: "soft" };
  }

  if ((count ?? 0) > 0 && opts?.force) {
    await admin
      .from("wedding_sites")
      .update({ template_id: null })
      .eq("template_id", templateId);
  }

  const { error } = await admin
    .from("wedding_site_templates")
    .delete()
    .eq("id", templateId);

  if (error) return { ok: false, error: "Nu s-a putut șterge template-ul." };

  await logAudit(
    null,
    auth.user.id,
    "admin.site_template.delete",
    "wedding_site_template",
    templateId,
    {},
  );
  revalidatePath("/admin/templates");
  return { ok: true, mode: "hard" };
}

export async function adminHardDeleteAccessGrantAction(
  grantId: string,
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };

  const admin = createAdminClient();
  const { error } = await admin.from("access_grants").delete().eq("id", grantId);
  if (error) return { ok: false, error: "Nu s-a putut șterge grant-ul." };

  await logAudit(null, auth.user.id, "admin.grant.delete", "access_grant", grantId, {});
  revalidatePath("/admin/access");
  return { ok: true, mode: "hard" };
}

export async function adminDeleteSubscriptionAction(
  subscriptionId: string,
  mode: "soft" | "hard" = "soft",
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };

  const admin = createAdminClient();
  if (mode === "soft") {
    await admin
      .from("subscriptions")
      .update({
        status: "canceled",
        soft_deleted_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);
  } else {
    const { error } = await admin
      .from("subscriptions")
      .delete()
      .eq("id", subscriptionId);
    if (error) return { ok: false, error: "Nu s-a putut șterge abonamentul." };
  }

  await logAudit(
    null,
    auth.user.id,
    mode === "soft" ? "admin.subscription.soft_delete" : "admin.subscription.hard_delete",
    "subscription",
    subscriptionId,
    {},
  );
  revalidatePath("/admin/subscriptions");
  return { ok: true, mode };
}

export async function adminDeleteGdprRequestAction(
  requestId: string,
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };

  const admin = createAdminClient();
  const { error } = await admin.from("gdpr_requests").delete().eq("id", requestId);
  if (error) return { ok: false, error: "Nu s-a putut șterge cererea." };

  await logAudit(null, auth.user.id, "admin.gdpr.delete", "gdpr_request", requestId, {});
  revalidatePath("/admin/gdpr");
  return { ok: true, mode: "hard" };
}

export async function adminFulfillGdprDeleteAction(
  requestId: string,
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };

  const admin = createAdminClient();
  const { data: req } = await admin
    .from("gdpr_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  if (!req || req.status !== "pending") {
    return { ok: false, error: "Cerere invalidă sau deja procesată." };
  }

  if (req.workspace_id) {
    const { data: ws } = await admin
      .from("workspaces")
      .select("id, workspace_type")
      .eq("id", req.workspace_id)
      .maybeSingle();
    if (ws && !isProtectedSystemWorkspace(ws)) {
      await admin
        .from("workspaces")
        .update({
          status: "archived",
          soft_deleted_at: new Date().toISOString(),
        })
        .eq("id", req.workspace_id);
    }
  }

  await admin
    .from("gdpr_requests")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      notes: `${req.notes ?? ""}\nFulfilled by admin soft-delete.`.trim(),
    })
    .eq("id", requestId);

  await logAudit(
    req.workspace_id,
    auth.user.id,
    "admin.gdpr.fulfill_delete",
    "gdpr_request",
    requestId,
    {},
  );
  revalidatePath("/admin/gdpr");
  revalidatePath("/admin/workspaces");
  return { ok: true, mode: "soft" };
}

export async function adminBulkSoftDeleteWorkspacesAction(
  workspaceIds: string[],
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };

  const admin = createAdminClient();
  const now = new Date().toISOString();
  let deleted = 0;

  for (const id of workspaceIds) {
    const { data: ws } = await admin
      .from("workspaces")
      .select("id, workspace_type")
      .eq("id", id)
      .maybeSingle();
    if (!ws || isProtectedSystemWorkspace(ws)) continue;
    await admin
      .from("workspaces")
      .update({ status: "archived", soft_deleted_at: now })
      .eq("id", id);
    deleted += 1;
    await logAudit(
      id,
      auth.user.id,
      "admin.workspace.soft_delete",
      "workspace",
      id,
      { bulk: true },
    );
  }

  revalidatePath("/admin/workspaces");
  return deleted
    ? { ok: true, mode: "soft" }
    : { ok: false, error: "Niciun workspace șters." };
}

export async function adminDeleteFeatureEntitlementAction(
  workspaceId: string,
  featureKey: string,
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("feature_entitlements")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("feature_key", featureKey);

  if (error) return { ok: false, error: "Nu s-a putut șterge entitlement-ul." };

  await logAudit(
    workspaceId,
    auth.user.id,
    "admin.entitlement.delete",
    "feature_entitlement",
    featureKey,
    { workspaceId },
  );
  revalidatePath("/admin/subscriptions");
  revalidatePath(`/admin/workspaces/${workspaceId}`);
  return { ok: true, mode: "hard" };
}

export async function adminDeleteSiteVersionAction(
  versionId: string,
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("wedding_site_versions")
    .delete()
    .eq("id", versionId);
  if (error) return { ok: false, error: "Nu s-a putut șterge versiunea." };

  await logAudit(
    null,
    auth.user.id,
    "admin.site_version.delete",
    "wedding_site_version",
    versionId,
    {},
  );
  return { ok: true, mode: "hard" };
}

export async function adminDeleteInvitationVersionAction(
  versionId: string,
): Promise<DeleteResult> {
  const auth = await assertAdmin();
  if (!auth.ok || !auth.user) return { ok: false, error: "Neautorizat" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("invitation_versions")
    .delete()
    .eq("id", versionId);
  if (error) return { ok: false, error: "Nu s-a putut șterge versiunea." };

  await logAudit(
    null,
    auth.user.id,
    "admin.invitation_version.delete",
    "invitation_version",
    versionId,
    {},
  );
  return { ok: true, mode: "hard" };
}

/** Bound helpers for AdminConfirmDelete / dialogs */
export async function adminSoftDeleteUserBound(
  _workspaceId: string,
  userId: string,
): Promise<void> {
  await adminSoftDeleteUserAction(userId);
}

export async function adminDeactivateUserBound(
  _workspaceId: string,
  userId: string,
): Promise<void> {
  await adminDeactivateUserAction(userId);
}

export async function adminRestoreUserBound(
  _workspaceId: string,
  userId: string,
): Promise<void> {
  await adminRestoreUserAction(userId);
}

export async function adminDeleteInvitationTemplateBound(
  _workspaceId: string,
  templateId: string,
): Promise<void> {
  await adminDeleteInvitationTemplateAction(templateId);
}

export async function adminHardDeleteAccessGrantBound(
  _workspaceId: string,
  grantId: string,
): Promise<void> {
  await adminHardDeleteAccessGrantAction(grantId);
}

export async function adminDeleteGdprRequestBound(
  _workspaceId: string,
  requestId: string,
): Promise<void> {
  await adminDeleteGdprRequestAction(requestId);
}

export async function adminFulfillGdprDeleteBound(
  _workspaceId: string,
  requestId: string,
): Promise<void> {
  await adminFulfillGdprDeleteAction(requestId);
}
