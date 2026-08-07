import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { EmptyState } from "@/components/planner/empty-state";
import { InvitationEditorLoading } from "@/components/shared/module-loading";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/t";
import { loadInvitationProject } from "@/lib/invitations/load-project";
import { canManagePlanner } from "@/lib/planner/access";

const SectionEditor = dynamic(
  () =>
    import("@/components/invitations/section-editor").then((m) => ({
      default: m.SectionEditor,
    })),
  { loading: () => <InvitationEditorLoading /> },
);

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.invitations.editMetaTitle };
}

type PageProps = { params: Promise<{ id: string }> };

export default async function EditInvitationPage({ params }: PageProps) {
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

  const { project, theme, content, limits, ctx } = loaded.data;
  if (!canManagePlanner(ctx.role)) {
    return (
      <EmptyState
        title={dict.shell.noPermission}
        description={dict.invitations.noEditPermission}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">{dict.invitations.builderTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(dict as never, "invitations.builderSubtitle", {
            locale,
            params: { name: project.name },
          })}
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
