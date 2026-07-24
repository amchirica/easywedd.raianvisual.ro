"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminConfirmDelete } from "@/components/admin/admin-confirm-delete";
import { AdminBulkWorkspaceDelete } from "@/components/admin/admin-deletion-controls";
import { adminSoftDeleteWorkspaceBound } from "@/lib/actions/admin-billing";

type Row = {
  id: string;
  name: string;
  slug: string;
  workspace_type: string;
  status: string;
  deleted: boolean;
  protectedWs: boolean;
  ownerEmail: string | null;
  planLabel: string;
};

export function AdminWorkspacesBulkTable({ rows }: { rows: Row[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const selectable = useMemo(
    () => rows.filter((r) => !r.deleted && !r.protectedWs).map((r) => r.id),
    [rows],
  );

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.length === selectable.length ? [] : [...selectable],
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <AdminBulkWorkspaceDelete
          selectedIds={selected}
          onDone={() => setSelected([])}
        />
        {selected.length ? (
          <p className="text-xs text-muted-foreground">
            {selected.length} selectate
          </p>
        ) : null}
      </div>
      <div className="overflow-x-auto border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    selectable.length > 0 &&
                    selected.length === selectable.length
                  }
                  onChange={toggleAll}
                  aria-label="Selectează toate"
                />
              </th>
              <th className="px-4 py-3 font-medium">Workspace</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Tip</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((workspace) => (
              <tr
                key={workspace.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3">
                  {!workspace.deleted && !workspace.protectedWs ? (
                    <input
                      type="checkbox"
                      checked={selected.includes(workspace.id)}
                      onChange={() => toggle(workspace.id)}
                      aria-label={`Selectează ${workspace.name}`}
                    />
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/workspaces/${workspace.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {workspace.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {workspace.slug}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {workspace.ownerEmail ? (
                    <Link
                      href={`/admin/users?q=${encodeURIComponent(workspace.ownerEmail)}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {workspace.ownerEmail}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">{workspace.workspace_type}</td>
                <td className="px-4 py-3">
                  {workspace.deleted ? "Șters" : workspace.status}
                </td>
                <td className="px-4 py-3">{workspace.planLabel}</td>
                <td className="px-4 py-3">
                  {!workspace.deleted && !workspace.protectedWs ? (
                    <AdminConfirmDelete
                      workspaceId={workspace.id}
                      id={workspace.id}
                      label="Arhivează"
                      confirmLabel="Confirmă arhivarea"
                      action={adminSoftDeleteWorkspaceBound}
                    />
                  ) : workspace.protectedWs ? (
                    <span className="text-xs text-muted-foreground">
                      Protejat
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
