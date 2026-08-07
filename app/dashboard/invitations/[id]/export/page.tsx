import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { EmptyState } from "@/components/planner/empty-state";
import { InvitationExportLoading } from "@/components/shared/module-loading";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { loadInvitationProject } from "@/lib/invitations/load-project";

const ExportPanel = dynamic(
  () =>
    import("@/components/invitations/export-panel").then((m) => ({
      default: m.ExportPanel,
    })),
  { loading: () => <InvitationExportLoading /> },
);

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.invitations.exportMetaTitle };
}

type PageProps = { params: Promise<{ id: string }> };

export default async function ExportInvitationPage({ params }: PageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { id } = await params;
  const loaded = await loadInvitationProject(id);
  if (loaded.error || !loaded.data) {
    return (
      <EmptyState
        title={dict.invitations.projectUnavailable}
        description={loaded.error ?? ""}
      />
    );
  }

  const { project, theme, content, limits } = loaded.data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">{dict.invitations.export}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {dict.invitations.exportSubtitle}
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
