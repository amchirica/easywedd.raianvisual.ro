"use client";

import Link from "next/link";

import { InvitationDeleteControls } from "@/components/invitations/invitation-delete-controls";
import { useI18n } from "@/components/providers/i18n-provider";
import { formatDateShort } from "@/lib/i18n/format";
import { getStatusLabel } from "@/lib/i18n/status-labels";
import { t } from "@/lib/i18n/t";
import type { InvitationProjectStatus } from "@/types/invitations";

type ProjectCardProps = {
  id: string;
  name: string;
  status: InvitationProjectStatus;
  updatedAt: string;
  templateName?: string | null;
  canDelete?: boolean;
};

export function ProjectCard({
  id,
  name,
  status,
  updatedAt,
  templateName,
  canDelete = false,
}: ProjectCardProps) {
  const { dict, locale } = useI18n();

  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-4">
      <Link
        href={`/dashboard/invitations/${id}`}
        className="min-w-0 flex-1 transition-colors hover:opacity-80"
      >
        <h3 className="font-heading text-2xl">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {templateName ?? dict.invitations.noTemplate} ·{" "}
          {t(dict as never, "invitations.updatedAt", {
            locale,
            params: { date: formatDateShort(updatedAt, locale) },
          })}
        </p>
      </Link>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-xs tracking-wide text-muted-foreground uppercase">
          {getStatusLabel("invitation", status, locale)}
        </span>
        {canDelete ? (
          <InvitationDeleteControls
            projectId={id}
            projectName={name}
            isArchived={status === "archived"}
          />
        ) : null}
      </div>
    </div>
  );
}
