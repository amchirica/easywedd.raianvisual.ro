import type { Metadata } from "next";

import { ExportPanel } from "@/components/invitations/export-panel";
import { EmptyState } from "@/components/planner/empty-state";
import { loadInvitationProject } from "@/lib/invitations/load-project";

export const metadata: Metadata = { title: "Export invitație" };

type PageProps = { params: Promise<{ id: string }> };

export default async function ExportInvitationPage({ params }: PageProps) {
  const { id } = await params;
  const loaded = await loadInvitationProject(id);
  if (loaded.error || !loaded.data) {
    return <EmptyState title="Proiect indisponibil" description={loaded.error ?? ""} />;
  }

  const { project, theme, content, limits } = loaded.data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">Export</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          PNG / JPG client-side · PDF pe Premium+ · Story & Square
        </p>
      </header>
      <ExportPanel
        projectId={project.id}
        projectName={project.name}
        theme={theme}
        content={content}
        watermark={limits.watermark}
        allowPdf={limits.allowPdf}
        allowMultiExport={limits.allowMultiExport}
      />
    </div>
  );
}
