import type { Metadata } from "next";

import { SectionEditor } from "@/components/invitations/section-editor";
import { EmptyState } from "@/components/planner/empty-state";
import { loadInvitationProject } from "@/lib/invitations/load-project";
import { canManagePlanner } from "@/lib/planner/access";

export const metadata: Metadata = { title: "Editează invitația" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditInvitationPage({ params }: PageProps) {
  const { id } = await params;
  const loaded = await loadInvitationProject(id);
  if (loaded.error || !loaded.data) {
    return <EmptyState title="Proiect indisponibil" description={loaded.error ?? ""} />;
  }

  const { project, theme, content, limits, ctx } = loaded.data;
  if (!canManagePlanner(ctx.role)) {
    return (
      <EmptyState
        title="Fără permisiune"
        description="Nu poți edita invitațiile cu rolul curent."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">Editor</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Autosave pe secțiuni · {project.name}
        </p>
      </header>
      <SectionEditor
        projectId={project.id}
        initialName={project.name}
        initialTheme={theme}
        initialContent={content}
        rsvpDeadline={project.rsvp_deadline}
        watermark={limits.watermark}
      />
    </div>
  );
}
