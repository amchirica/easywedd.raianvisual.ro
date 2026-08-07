import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";

import { AdminWorkspacesBulkTable } from "@/components/admin/admin-workspaces-bulk-table";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceStatus, WorkspaceType } from "@/types/database";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.admin.workspacesMetaTitle };
}

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
};

export default async function AdminWorkspacesPage({ searchParams }: PageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("workspaces")
    .select(
      "id, name, slug, workspace_type, status, soft_deleted_at, owner_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (params.q) {
    query = query.or(
      `name.ilike.%${params.q}%,slug.ilike.%${params.q}%`,
    );
  }
  if (params.type && params.type !== "all") {
    query = query.eq("workspace_type", params.type as WorkspaceType);
  }
  if (params.status === "deleted") {
    query = query.not("soft_deleted_at", "is", null);
  } else if (params.status !== "all") {
    query = query.is("soft_deleted_at", null);
    if (params.status && params.status !== "active") {
      query = query.eq("status", params.status as WorkspaceStatus);
    }
  }

  const { data: workspaces } = await query;

  const ownerIds = [
    ...new Set((workspaces ?? []).map((w) => w.owner_id).filter(Boolean)),
  ];
  const workspaceIds = (workspaces ?? []).map((w) => w.id);

  const [{ data: owners }, { data: subs }] = await Promise.all([
    ownerIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", ownerIds)
      : Promise.resolve({ data: [] as { id: string; email: string; full_name: string | null }[] }),
    workspaceIds.length > 0
      ? supabase
          .from("subscriptions")
          .select("workspace_id, plan_key, plan, status, access_source")
          .in("workspace_id", workspaceIds)
          .is("soft_deleted_at", null)
      : Promise.resolve({ data: [] as { workspace_id: string; plan_key: string | null; plan: string | null; status: string | null; access_source: string | null }[] }),
  ]);

  const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));
  const subByWs = new Map((subs ?? []).map((s) => [s.workspace_id, s]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">{dict.admin.workspaces}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Caută, filtrează, deschide și arhivează (soft delete) spațiile de
          lucru.
        </p>
      </header>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Nume sau slug…"
          className="h-9 min-w-[220px] rounded-lg border border-input bg-background px-3 text-sm"
        />
        <select
          name="type"
          defaultValue={params.type ?? "all"}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="all">Toate tipurile</option>
          <option value="couple">couple</option>
          <option value="planner">planner</option>
          <option value="admin">admin</option>
        </select>
        <select
          name="status"
          defaultValue={params.status ?? "active"}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="active">{dict.admin.activeNotDeleted}</option>
          <option value="all">Toate</option>
          <option value="archived">Arhivate</option>
          <option value="deleted">Soft delete</option>
        </select>
        <button
          type="submit"
          className="h-9 rounded-lg bg-foreground px-4 text-sm text-background"
        >
          Filtrează
        </button>
      </form>

      {!workspaces?.length ? (
        <p className="text-sm text-muted-foreground">Niciun workspace.</p>
      ) : (
        <AdminWorkspacesBulkTable
          rows={(workspaces ?? []).map((workspace) => {
            const owner = ownerById.get(workspace.owner_id);
            const sub = subByWs.get(workspace.id);
            return {
              id: workspace.id,
              name: workspace.name,
              slug: workspace.slug,
              workspace_type: workspace.workspace_type,
              status: workspace.status,
              deleted: Boolean(workspace.soft_deleted_at),
              protectedWs: workspace.workspace_type === "admin",
              ownerEmail: owner?.email ?? null,
              planLabel: sub
                ? `${sub.plan_key ?? sub.plan} (${sub.status})`
                : "—",
            };
          })}
        />
      )}
    </div>
  );
}
