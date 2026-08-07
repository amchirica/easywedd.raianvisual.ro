import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import Link from "next/link";

import { AdminConfirmDelete } from "@/components/admin/admin-confirm-delete";
import { AdminUserDeleteControls } from "@/components/admin/admin-deletion-controls";
import {
  adminReactivateUserBound,
  adminSuspendUserBound,
} from "@/lib/actions/admin-billing";
import { listAdminUsersDirectory } from "@/lib/admin/admin-directory";
import { listPublicBillingPlans } from "@/lib/billing/plan-catalog";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.admin.usersMetaTitle };
}

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    plan?: string;
    workspace_type?: string;
    page?: string;
  }>;
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ro-RO");
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || 1) || 1);
  const [plans, directory] = await Promise.all([
    listPublicBillingPlans(),
    listAdminUsersDirectory({
      q: params.q,
      status: (params.status as "all" | "active" | "suspended") || "all",
      plan: params.plan,
      workspaceType: params.workspace_type,
      page,
      pageSize: 25,
    }),
  ]);
  const { users, total, pageSize } = directory;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(nextPage: number) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.status) sp.set("status", params.status);
    if (params.plan) sp.set("plan", params.plan);
    if (params.workspace_type) sp.set("workspace_type", params.workspace_type);
    sp.set("page", String(nextPage));
    return `/admin/users?${sp.toString()}`;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">{dict.admin.users}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Caută, filtrează și gestionează conturile înregistrate.
        </p>
      </header>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Nume sau email…"
          className="h-9 min-w-[220px] rounded-lg border border-input bg-background px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={params.status ?? "all"}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="all">Toate statusurile</option>
          <option value="active">Activi</option>
          <option value="suspended">{dict.admin.suspendedPlural}</option>
        </select>
        <select
          name="plan"
          defaultValue={params.plan ?? "all"}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="all">Toate planurile</option>
          {plans.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          name="workspace_type"
          defaultValue={params.workspace_type ?? "all"}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="all">Toate tipurile workspace</option>
          <option value="couple">couple</option>
          <option value="planner">planner</option>
          <option value="raian_client">raian_client</option>
        </select>
        <button
          type="submit"
          className="h-9 rounded-lg bg-foreground px-4 text-sm text-background"
        >
          Filtrează
        </button>
      </form>

      <p className="text-xs text-muted-foreground">
        {total} utilizatori · pagina {page} / {totalPages}
      </p>

      {!users.length ? (
        <p className="text-sm text-muted-foreground">Niciun utilizator.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nume</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">{dict.admin.registered}</th>
                <th className="px-4 py-3 font-medium">Ultima autentificare</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Workspace-uri</th>
                <th className="px-4 py-3 font-medium">Abonament</th>
                <th className="px-4 py-3 font-medium">{dict.admin.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">{user.fullName}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">{formatDate(user.lastSignInAt)}</td>
                  <td className="px-4 py-3">
                    {user.suspended ? "Suspendat" : "Activ"}
                  </td>
                  <td className="px-4 py-3">{user.workspaceCount}</td>
                  <td className="px-4 py-3">{user.activePlan ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/subscriptions`}
                        className="text-xs underline-offset-4 hover:underline"
                      >
                        Abonamente
                      </Link>
                      {user.suspended ? (
                        <AdminConfirmDelete
                          workspaceId={user.id}
                          id={user.id}
                          label={dict.admin.reactivate}
                          confirmLabel="Confirmă reactivarea"
                          action={adminReactivateUserBound}
                        />
                      ) : (
                        <AdminConfirmDelete
                          workspaceId={user.id}
                          id={user.id}
                          label={dict.admin.suspend}
                          confirmLabel="Confirmă suspendarea"
                          action={adminSuspendUserBound}
                        />
                      )}
                      <AdminUserDeleteControls
                        userId={user.id}
                        label={user.fullName || user.email}
                        softDeleted={Boolean(user.softDeleted)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="h-9 rounded-lg border border-border px-3 text-sm leading-9"
            >
              Anterior
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              href={pageHref(page + 1)}
              className="h-9 rounded-lg border border-border px-3 text-sm leading-9"
            >
              Următor
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
