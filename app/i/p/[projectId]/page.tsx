import type { Metadata } from "next";

import { InvitationCanvas } from "@/components/invitations/invitation-canvas";
import {
  parseContentConfig,
  parseThemeConfig,
} from "@/lib/invitations/renderer-defaults";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return {
    title: dict.publicUi.previewMetaTitle,
    robots: { index: false, follow: false },
  };
}

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ k?: string }>;
};

export default async function PublicPreviewPage({
  params,
  searchParams,
}: PageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { publicUi } = dict;
  const { projectId } = await params;
  const { k } = await searchParams;

  if (!k) {
    return (
      <main className="min-h-[100svh] px-6 py-16">
        <h1 className="font-heading text-3xl">{publicUi.previewUnavailable}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {publicUi.previewMissingKey}
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_invitation_preview", {
    p_project_id: projectId,
    p_preview_key: k,
  });

  const payload = data as {
    theme_config?: unknown;
    content_config?: unknown;
    name?: string;
  } | null;

  if (!payload) {
    return (
      <main className="min-h-[100svh] px-6 py-16">
        <h1 className="font-heading text-3xl">{publicUi.previewInvalid}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {publicUi.previewInvalidBody}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-[#F7F4EF] px-4 py-10">
      <p className="mx-auto mb-4 max-w-xl text-center text-xs tracking-wide text-muted-foreground uppercase">
        {publicUi.previewLabel.replace("{name}", String(payload.name ?? ""))}
      </p>
      <InvitationCanvas
        theme={parseThemeConfig(payload.theme_config)}
        content={parseContentConfig(payload.content_config)}
        className="mx-auto max-w-xl border border-border"
      />
    </main>
  );
}
