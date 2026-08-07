"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import {
  getInvitationProjectDeleteImpact,
  hardDeleteInvitationProjectAction,
  restoreInvitationProjectAction,
  softDeleteInvitationProjectAction,
} from "@/lib/actions/deletion";
import type { DeleteImpact } from "@/lib/deletion/types";
import { emptyImpact } from "@/lib/deletion/types";

type Props = {
  projectId: string;
  projectName: string;
  isArchived?: boolean;
};

export function InvitationDeleteControls({
  projectId,
  projectName,
  isArchived,
}: Props) {
  const { dict } = useI18n();
  const router = useRouter();
  const [impact, setImpact] = useState<DeleteImpact>(
    emptyImpact({
      resourceLabel: dict.invitations.resourceLabel,
      resourceName: projectName,
      canRestore: Boolean(isArchived),
      canSoftDelete: !isArchived,
    }),
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      void getInvitationProjectDeleteImpact(projectId).then((data) => {
        if (data) setImpact(data);
      });
    });
  }, [projectId]);

  return (
    <DeleteConfirmDialog
      triggerLabel={
        isArchived ? dict.invitations.manageDelete : dict.dialog.delete
      }
      impact={impact}
      onSoftDelete={async () => softDeleteInvitationProjectAction(projectId)}
      onHardDelete={async () => {
        const result = await hardDeleteInvitationProjectAction(projectId);
        if (result.ok) router.push("/dashboard/invitations");
        return result;
      }}
      onRestore={
        isArchived
          ? async () => restoreInvitationProjectAction(projectId)
          : undefined
      }
    />
  );
}
