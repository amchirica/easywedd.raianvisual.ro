import type { Metadata } from "next";

import { getCurrentUserContext } from "@/lib/workspace";

export const metadata: Metadata = { title: "Setări" };

export default async function SettingsPage() {
  const { profile, activeWorkspace, workspaces } = await getCurrentUserContext();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-4xl">Setări</h1>
        <p className="mt-2 text-muted-foreground">
          Cont, workspace și preferințe.
        </p>
      </header>

      <section className="border border-border bg-card p-6">
        <h2 className="font-heading text-2xl">Profil</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Nume</dt>
            <dd>{profile?.full_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{profile?.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Limbă</dt>
            <dd>{profile?.locale}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fus orar</dt>
            <dd>{profile?.timezone}</dd>
          </div>
        </dl>
      </section>

      <section className="border border-border bg-card p-6">
        <h2 className="font-heading text-2xl">Workspace-uri</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {workspaces.length === 0 ? (
            <li className="text-muted-foreground">Niciun workspace.</li>
          ) : (
            workspaces.map((workspace) => (
              <li key={workspace.id}>
                {workspace.name}
                {workspace.id === activeWorkspace?.id ? " (activ)" : ""}
                <span className="text-muted-foreground">
                  {" "}
                  · {workspace.workspace_type}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
