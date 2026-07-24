"use client";

import Link from "next/link";

import { InvitationDeleteControls } from "@/components/invitations/invitation-delete-controls";
import type { InvitationProjectStatus } from "@/types/invitations";

type ProjectCardProps = {
  id: string;
  name: string;
  status: InvitationProjectStatus;
  updatedAt: string;
  templateName?: string | null;
  canDelete?: boolean;
};

const statusLabel: Record<InvitationProjectStatus, string> = {
  draft: "Draft",
  published: "Publicat",
  archived: "Arhivat",
};

export function ProjectCard({
  id,
  name,
  status,
  updatedAt,
  templateName,
  canDelete = false,
}: ProjectCardProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-4">
      <Link
        href={`/dashboard/invitations/${id}`}
        className="min-w-0 flex-1 transition-colors hover:opacity-80"
      >
        <h3 className="font-heading text-2xl">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {templateName ?? "Fără template"} · actualizat{" "}
          {new Date(updatedAt).toLocaleDateString("ro-RO")}
        </p>
      </Link>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-xs tracking-wide text-muted-foreground uppercase">
          {statusLabel[status]}
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
