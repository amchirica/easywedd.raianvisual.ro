import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Workspace-uri · Admin" };

export default async function AdminWorkspacesPage() {
  const supabase = await createClient();
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, name, slug, workspace_type, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-4xl">Workspace-uri</h1>
      {!workspaces?.length ? (
        <p className="text-sm text-muted-foreground">Niciun workspace încă.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nume</th>
                <th className="px-4 py-3 font-medium">Tip</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Slug</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((workspace) => (
                <tr
                  key={workspace.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/workspaces/${workspace.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {workspace.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{workspace.workspace_type}</td>
                  <td className="px-4 py-3">{workspace.status}</td>
                  <td className="px-4 py-3">{workspace.slug}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
