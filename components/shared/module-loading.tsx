"use client";

import { useI18n } from "@/components/providers/i18n-provider";

export function InvitationEditorLoading() {
  const { dict } = useI18n();
  return (
    <p className="text-sm text-muted-foreground">{dict.invitations.loadingEditor}</p>
  );
}

export function InvitationExportLoading() {
  const { dict } = useI18n();
  return (
    <p className="text-sm text-muted-foreground">{dict.invitations.loadingExport}</p>
  );
}

export function WebsiteEditorLoading() {
  const { dict } = useI18n();
  return (
    <p className="text-sm text-muted-foreground">{dict.website.loadingEditor}</p>
  );
}
