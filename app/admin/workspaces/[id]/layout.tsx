import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ADMIN_WORKSPACE_SECTIONS,
  requireAdminWorkspace,
} from "@/lib/admin/workspace-context";
import { isProtectedSystemWorkspace } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function AdminWorkspaceLayout({
  children,
  params,
}: LayoutProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug, workspace_type, status")
    .eq("id", id)
    .maybeSingle();

  if (!workspace) notFound();

  const protectedWs = isProtectedSystemWorkspace(workspace);
  const ctx = protectedWs
    ? null
    : await requireAdminWorkspace(id, { allowSystem: false });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/workspaces" className="underline-offset-4 hover:underline">
            Workspace-uri
          </Link>
          {" / "}
          {workspace.name}
        </p>
        <h1 className="font-heading mt-2 text-4xl">{workspace.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {workspace.slug} · {workspace.workspace_type} · {workspace.status}
        </p>
      </header>

      {protectedWs ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Workspace de tip sistem/admin — gestiunea datelor de nuntă este blocată.
        </p>
      ) : (
        <nav className="flex flex-wrap gap-2 border-b border-border pb-3 text-sm">
          <Link
            href={`/admin/workspaces/${id}`}
            className="rounded-md px-2 py-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Prezentare
          </Link>
          {ADMIN_WORKSPACE_SECTIONS.map((section) => (
            <Link
              key={section.key}
              href={`/admin/workspaces/${id}/${section.key}`}
              className="rounded-md px-2 py-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {section.label}
            </Link>
          ))}
        </nav>
      )}

      {protectedWs ? null : ctx && !ctx.ok ? (
        <p className="text-sm text-destructive">{ctx.error}</p>
      ) : (
        children
      )}
    </div>
  );
}
