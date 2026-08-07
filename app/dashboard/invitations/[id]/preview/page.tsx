import type { Metadata } from "next";
import Link from "next/link";

import { DevicePreview } from "@/components/invitations/device-preview";
import { EmptyState } from "@/components/planner/empty-state";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { appBaseUrl, loadInvitationProject } from "@/lib/invitations/load-project";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.invitations.previewMetaTitle };
}

type PageProps = { params: Promise<{ id: string }> };

export default async function PreviewInvitationPage({ params }: PageProps) {
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
  const shareUrl = `${appBaseUrl()}/i/p/${project.id}?k=${project.preview_key}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">{dict.invitations.preview}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {dict.invitations.shareLink}{" "}
          <Link href={shareUrl} className="underline underline-offset-4">
            {shareUrl}
          </Link>
        </p>
      </header>
      <DevicePreview theme={theme} content={content} watermark={limits.watermark} />
    </div>
  );
}
