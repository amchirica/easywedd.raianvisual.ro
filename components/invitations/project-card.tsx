import Link from "next/link";

import type { InvitationProjectStatus } from "@/types/invitations";

type ProjectCardProps = {
  id: string;
  name: string;
  status: InvitationProjectStatus;
  updatedAt: string;
  templateName?: string | null;
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
}: ProjectCardProps) {
  return (
    <Link
      href={`/dashboard/invitations/${id}`}
      className="block border-b border-border py-4 transition-colors hover:bg-secondary/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-heading text-2xl">{name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {templateName ?? "Fără template"} · actualizat{" "}
            {new Date(updatedAt).toLocaleDateString("ro-RO")}
          </p>
        </div>
        <span className="text-xs tracking-wide text-muted-foreground uppercase">
          {statusLabel[status]}
        </span>
      </div>
    </Link>
  );
}
