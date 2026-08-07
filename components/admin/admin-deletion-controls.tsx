"use client";

import { useState, useTransition } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminBulkSoftDeleteWorkspacesAction,
  adminDeactivateUserAction,
  adminDeleteGdprRequestAction,
  adminDeleteInvitationTemplateAction,
  adminDeleteSubscriptionAction,
  adminDeleteWebsiteTemplateAction,
  adminFulfillGdprDeleteAction,
  adminHardDeleteAccessGrantAction,
  adminHardDeleteUserAction,
  adminRestoreUserAction,
  adminSoftDeleteUserAction,
  adminTransferWorkspaceOwnershipAction,
} from "@/lib/actions/admin-deletion";
import { emptyImpact } from "@/lib/deletion/types";
import { t } from "@/lib/i18n/t";

export function AdminUserDeleteControls({
  userId,
  label,
  softDeleted,
}: {
  userId: string;
  label: string;
  softDeleted?: boolean;
}) {
  const { dict } = useI18n();
  const impact = emptyImpact({
    resourceLabel: dict.admin.resourceUser,
    resourceName: label,
    canSoftDelete: !softDeleted,
    canHardDelete: true,
    canRestore: Boolean(softDeleted),
    requiresTypedConfirm: true,
    typedConfirmPhrase: "STERGE",
    warnings: [
      dict.admin.userDeleteWarningArchive,
      dict.admin.userDeleteWarningHard,
    ],
  });

  return (
    <div className="flex flex-wrap gap-2">
      {!softDeleted ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void adminDeactivateUserAction(userId)}
          >
            {dict.admin.deactivate}
          </Button>
          <DeleteConfirmDialog
            triggerLabel={dict.dialog.delete}
            impact={impact}
            defaultMode="hard"
            onSoftDelete={async () => adminSoftDeleteUserAction(userId)}
            onHardDelete={async () => adminHardDeleteUserAction(userId)}
          />
        </>
      ) : (
        <DeleteConfirmDialog
          triggerLabel={dict.admin.restoreOrDelete}
          impact={impact}
          defaultMode="hard"
          onRestore={async () => adminRestoreUserAction(userId)}
          onHardDelete={async () => adminHardDeleteUserAction(userId)}
          onSoftDelete={async () => adminRestoreUserAction(userId)}
        />
      )}
    </div>
  );
}

export function AdminTransferOwnershipForm({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const { dict } = useI18n();
  const [ownerId, setOwnerId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          {dict.admin.transferOwnershipHint}
        </p>
        <Input
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          placeholder={dict.admin.userIdPlaceholder}
          className="min-w-[260px]"
        />
      </div>
      <Button
        type="button"
        size="sm"
        disabled={pending || !ownerId}
        onClick={() =>
          startTransition(() => {
            void adminTransferWorkspaceOwnershipAction(workspaceId, ownerId).then(
              (r) =>
                setMsg(
                  r.ok
                    ? dict.admin.ownershipTransferred
                    : r.error ?? dict.common.error,
                ),
            );
          })
        }
      >
        {dict.admin.transfer}
      </Button>
      {msg ? <p className="text-xs text-muted-foreground">{msg}</p> : null}
    </div>
  );
}

export function AdminTemplateDeleteButton({
  templateId,
  name,
  kind,
}: {
  templateId: string;
  name: string;
  kind: "invitation" | "website";
}) {
  const { dict } = useI18n();
  const impact = emptyImpact({
    resourceLabel: dict.admin.resourceTemplate,
    resourceName: name,
    canSoftDelete: true,
    canHardDelete: true,
    warnings: [dict.admin.templateDeleteWarning],
    requiresTypedConfirm: true,
    typedConfirmPhrase: "STERGE",
  });

  return (
    <DeleteConfirmDialog
      triggerLabel={dict.dialog.delete}
      impact={impact}
      onSoftDelete={async () =>
        kind === "invitation"
          ? adminDeleteInvitationTemplateAction(templateId)
          : adminDeleteWebsiteTemplateAction(templateId)
      }
      onHardDelete={async () =>
        kind === "invitation"
          ? adminDeleteInvitationTemplateAction(templateId, { force: true })
          : adminDeleteWebsiteTemplateAction(templateId, { force: true })
      }
    />
  );
}

export function AdminGrantDeleteButton({
  grantId,
}: {
  grantId: string;
}) {
  const { dict } = useI18n();
  return (
    <DeleteConfirmDialog
      triggerLabel={dict.admin.deleteGrant}
      impact={emptyImpact({
        resourceLabel: dict.admin.resourceGrant,
        resourceName: grantId.slice(0, 8),
        canSoftDelete: false,
        canHardDelete: true,
        requiresTypedConfirm: true,
        typedConfirmPhrase: "STERGE",
      })}
      defaultMode="hard"
      onHardDelete={async () => adminHardDeleteAccessGrantAction(grantId)}
    />
  );
}

export function AdminSubscriptionDeleteButton({
  subscriptionId,
  label,
}: {
  subscriptionId: string;
  label: string;
}) {
  const { dict } = useI18n();
  return (
    <DeleteConfirmDialog
      triggerLabel={dict.admin.deleteSubscription}
      impact={emptyImpact({
        resourceLabel: dict.admin.resourceSubscription,
        resourceName: label,
        canSoftDelete: true,
        canHardDelete: true,
        requiresTypedConfirm: true,
        typedConfirmPhrase: "STERGE",
      })}
      onSoftDelete={async () =>
        adminDeleteSubscriptionAction(subscriptionId, "soft")
      }
      onHardDelete={async () =>
        adminDeleteSubscriptionAction(subscriptionId, "hard")
      }
    />
  );
}

export function AdminGdprControls({
  requestId,
  status,
  isDeleteRequest,
}: {
  requestId: string;
  status: string;
  isDeleteRequest: boolean;
}) {
  const { dict } = useI18n();
  return (
    <div className="flex flex-wrap gap-2">
      {isDeleteRequest && status === "pending" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void adminFulfillGdprDeleteAction(requestId)}
        >
          {dict.admin.fulfillSoftDelete}
        </Button>
      ) : null}
      <DeleteConfirmDialog
        triggerLabel={dict.admin.deleteRequest}
        impact={emptyImpact({
          resourceLabel: dict.admin.resourceGdpr,
          resourceName: requestId.slice(0, 8),
          canSoftDelete: false,
          canHardDelete: true,
          requiresTypedConfirm: true,
          typedConfirmPhrase: "STERGE",
        })}
        defaultMode="hard"
        onHardDelete={async () => adminDeleteGdprRequestAction(requestId)}
      />
    </div>
  );
}

export function AdminBulkWorkspaceDelete({
  selectedIds,
  onDone,
}: {
  selectedIds: string[];
  onDone?: () => void;
}) {
  const { dict, locale } = useI18n();
  const [pending, startTransition] = useTransition();
  if (!selectedIds.length) return null;

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          void adminBulkSoftDeleteWorkspacesAction(selectedIds).then(() =>
            onDone?.(),
          );
        })
      }
    >
      {t(dict as never, "admin.archiveSelected", {
        locale,
        params: { count: selectedIds.length },
      })}
    </Button>
  );
}
