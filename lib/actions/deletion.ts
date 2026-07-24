"use server";

import { revalidatePath } from "next/cache";

import { emptyImpact, type DeleteImpact, type DeleteResult } from "@/lib/deletion/types";
import { canManagePlanner } from "@/lib/planner/access";
import { logAudit, requireWeddingContext } from "@/lib/planner/context";

async function requireManager() {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) return null;
  if (!canManagePlanner(ctx.context.role)) return null;
  return ctx.context;
}

export async function getWeddingSiteDeleteImpact(
  siteId: string,
): Promise<DeleteImpact | null> {
  const context = await requireManager();
  if (!context) return null;

  const { data: site } = await context.supabase
    .from("wedding_sites")
    .select("id, slug, status, soft_deleted_at")
    .eq("id", siteId)
    .eq("workspace_id", context.workspaceId)
    .maybeSingle();
  if (!site) return null;

  const [
    { count: sections },
    { count: pages },
    { count: media },
    { count: versions },
  ] = await Promise.all([
    context.supabase
      .from("wedding_site_sections")
      .select("*", { count: "exact", head: true })
      .eq("wedding_site_id", siteId),
    context.supabase
      .from("wedding_site_pages")
      .select("*", { count: "exact", head: true })
      .eq("wedding_site_id", siteId),
    context.supabase
      .from("wedding_site_media")
      .select("*", { count: "exact", head: true })
      .eq("wedding_site_id", siteId),
    context.supabase
      .from("wedding_site_versions")
      .select("*", { count: "exact", head: true })
      .eq("wedding_site_id", siteId),
  ]);

  const isSoft = Boolean(site.soft_deleted_at) || site.status === "archived";
  const warnings: string[] = [];
  if (site.status === "published") {
    warnings.push("Site-ul este publicat — linkul public nu va mai funcționa.");
  }

  return emptyImpact({
    resourceLabel: "website",
    resourceName: `/w/${site.slug}`,
    mode: isSoft ? "hard" : "soft",
    canSoftDelete: !isSoft,
    canHardDelete: true,
    canRestore: isSoft,
    requiresTypedConfirm: false,
    typedConfirmPhrase: "STERGE",
    warnings,
    items: [
      { label: "Secțiuni", count: sections ?? 0 },
      { label: "Pagini", count: pages ?? 0 },
      { label: "Media", count: media ?? 0, severity: (media ?? 0) > 0 ? "warn" : "info" },
      { label: "Versiuni", count: versions ?? 0 },
    ],
  });
}

export async function softDeleteWeddingSiteAction(
  siteId: string,
): Promise<DeleteResult> {
  const context = await requireManager();
  if (!context) return { ok: false, error: "Fără permisiune" };

  const now = new Date().toISOString();
  const { data, error } = await context.supabase
    .from("wedding_sites")
    .update({
      status: "archived",
      soft_deleted_at: now,
      published_at: null,
    })
    .eq("id", siteId)
    .eq("workspace_id", context.workspaceId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "Nu s-a putut arhiva site-ul." };

  await logAudit(
    context.workspaceId,
    context.user!.id,
    "website.soft_delete",
    "wedding_site",
    siteId,
    {},
  );

  revalidatePath("/dashboard/website");
  revalidatePath(`/dashboard/website/${siteId}`);
  return { ok: true, mode: "soft" };
}

export async function hardDeleteWeddingSiteAction(
  siteId: string,
): Promise<DeleteResult> {
  const context = await requireManager();
  if (!context) return { ok: false, error: "Fără permisiune" };

  const { error } = await context.supabase
    .from("wedding_sites")
    .delete()
    .eq("id", siteId)
    .eq("workspace_id", context.workspaceId);

  if (error) return { ok: false, error: "Nu s-a putut șterge site-ul." };

  await logAudit(
    context.workspaceId,
    context.user!.id,
    "website.hard_delete",
    "wedding_site",
    siteId,
    {},
  );

  revalidatePath("/dashboard/website");
  return { ok: true, mode: "hard" };
}

export async function restoreWeddingSiteAction(
  siteId: string,
): Promise<DeleteResult> {
  const context = await requireManager();
  if (!context) return { ok: false, error: "Fără permisiune" };

  const { data, error } = await context.supabase
    .from("wedding_sites")
    .update({
      status: "draft",
      soft_deleted_at: null,
    })
    .eq("id", siteId)
    .eq("workspace_id", context.workspaceId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "Nu s-a putut restaura." };

  await logAudit(
    context.workspaceId,
    context.user!.id,
    "website.restore",
    "wedding_site",
    siteId,
    {},
  );

  revalidatePath("/dashboard/website");
  revalidatePath(`/dashboard/website/${siteId}`);
  return { ok: true, restored: true };
}

export async function getInvitationProjectDeleteImpact(
  projectId: string,
): Promise<DeleteImpact | null> {
  const context = await requireManager();
  if (!context) return null;

  const { data: project } = await context.supabase
    .from("invitation_projects")
    .select("id, name, status, soft_deleted_at")
    .eq("id", projectId)
    .eq("workspace_id", context.workspaceId)
    .maybeSingle();
  if (!project) return null;

  const [
    { count: recipients },
    { count: events },
    { count: versions },
  ] = await Promise.all([
    context.supabase
      .from("invitation_recipients")
      .select("*", { count: "exact", head: true })
      .eq("invitation_project_id", projectId),
    context.supabase
      .from("invitation_events")
      .select("*", { count: "exact", head: true })
      .eq("invitation_project_id", projectId),
    context.supabase
      .from("invitation_versions")
      .select("*", { count: "exact", head: true })
      .eq("invitation_project_id", projectId),
  ]);

  const isSoft =
    Boolean(project.soft_deleted_at) || project.status === "archived";
  const warnings: string[] = [];
  if (project.status === "published") {
    warnings.push("Invitația este publicată — linkurile de distribuire vor înceta.");
  }
  if ((recipients ?? 0) > 0) {
    warnings.push(
      "Există destinatari / RSVP asociate care vor fi eliminate la ștergerea permanentă.",
    );
  }

  return emptyImpact({
    resourceLabel: "invitație",
    resourceName: project.name,
    mode: isSoft ? "hard" : "soft",
    canSoftDelete: !isSoft,
    canHardDelete: true,
    canRestore: isSoft,
    requiresTypedConfirm: (recipients ?? 0) > 0,
    typedConfirmPhrase: "STERGE",
    warnings,
    items: [
      { label: "Destinatari", count: recipients ?? 0, severity: (recipients ?? 0) > 0 ? "warn" : "info" },
      { label: "Evenimente tracking", count: events ?? 0 },
      { label: "Versiuni", count: versions ?? 0 },
    ],
  });
}

export async function softDeleteInvitationProjectAction(
  projectId: string,
): Promise<DeleteResult> {
  const context = await requireManager();
  if (!context) return { ok: false, error: "Fără permisiune" };

  const now = new Date().toISOString();
  const { data, error } = await context.supabase
    .from("invitation_projects")
    .update({
      status: "archived",
      soft_deleted_at: now,
      published_at: null,
    })
    .eq("id", projectId)
    .eq("workspace_id", context.workspaceId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Nu s-a putut arhiva invitația." };
  }

  await logAudit(
    context.workspaceId,
    context.user!.id,
    "invitation.soft_delete",
    "invitation_project",
    projectId,
    {},
  );

  revalidatePath("/dashboard/invitations");
  revalidatePath(`/dashboard/invitations/${projectId}`);
  return { ok: true, mode: "soft" };
}

export async function hardDeleteInvitationProjectAction(
  projectId: string,
): Promise<DeleteResult> {
  const context = await requireManager();
  if (!context) return { ok: false, error: "Fără permisiune" };

  const { error } = await context.supabase
    .from("invitation_projects")
    .delete()
    .eq("id", projectId)
    .eq("workspace_id", context.workspaceId);

  if (error) return { ok: false, error: "Nu s-a putut șterge invitația." };

  await logAudit(
    context.workspaceId,
    context.user!.id,
    "invitation.hard_delete",
    "invitation_project",
    projectId,
    {},
  );

  revalidatePath("/dashboard/invitations");
  return { ok: true, mode: "hard" };
}

export async function restoreInvitationProjectAction(
  projectId: string,
): Promise<DeleteResult> {
  const context = await requireManager();
  if (!context) return { ok: false, error: "Fără permisiune" };

  const { data, error } = await context.supabase
    .from("invitation_projects")
    .update({
      status: "draft",
      soft_deleted_at: null,
    })
    .eq("id", projectId)
    .eq("workspace_id", context.workspaceId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "Nu s-a putut restaura." };

  await logAudit(
    context.workspaceId,
    context.user!.id,
    "invitation.restore",
    "invitation_project",
    projectId,
    {},
  );

  revalidatePath("/dashboard/invitations");
  revalidatePath(`/dashboard/invitations/${projectId}`);
  return { ok: true, restored: true };
}

/** Delete a single wedding site section row */
export async function deleteWeddingSiteSectionAction(
  siteId: string,
  sectionId: string,
): Promise<DeleteResult> {
  const context = await requireManager();
  if (!context) return { ok: false, error: "Fără permisiune" };

  const { data: site } = await context.supabase
    .from("wedding_sites")
    .select("id")
    .eq("id", siteId)
    .eq("workspace_id", context.workspaceId)
    .maybeSingle();
  if (!site) return { ok: false, error: "Site negăsit" };

  const { error } = await context.supabase
    .from("wedding_site_sections")
    .delete()
    .eq("id", sectionId)
    .eq("wedding_site_id", siteId);

  if (error) return { ok: false, error: "Nu s-a putut șterge secțiunea." };

  await logAudit(
    context.workspaceId,
    context.user!.id,
    "website.section.delete",
    "wedding_site_section",
    sectionId,
    { siteId },
  );

  revalidatePath(`/dashboard/website/${siteId}/edit`);
  return { ok: true, mode: "hard" };
}
