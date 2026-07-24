"use client";

import { useState, useTransition } from "react";

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

export function AdminUserDeleteControls({
  userId,
  label,
  softDeleted,
}: {
  userId: string;
  label: string;
  softDeleted?: boolean;
}) {
  const impact = emptyImpact({
    resourceLabel: "utilizator",
    resourceName: label,
    canSoftDelete: !softDeleted,
    canHardDelete: true,
    canRestore: Boolean(softDeleted),
    requiresTypedConfirm: true,
    typedConfirmPhrase: "STERGE",
    warnings: [
      "Workspace-urile deținute se arhivează automat.",
      "Ștergerea permanentă anonimizează profilul și blochează autentificarea.",
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
            Dezactivează
          </Button>
          <DeleteConfirmDialog
            triggerLabel="Șterge"
            impact={impact}
            defaultMode="hard"
            onSoftDelete={async () => adminSoftDeleteUserAction(userId)}
            onHardDelete={async () => adminHardDeleteUserAction(userId)}
          />
        </>
      ) : (
        <DeleteConfirmDialog
          triggerLabel="Restaurează / șterge"
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
  const [ownerId, setOwnerId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Transfer ownership (user id)</p>
        <Input
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          placeholder="uuid utilizator"
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
              (r) => setMsg(r.ok ? "Ownership transferat." : r.error ?? "Eroare"),
            );
          })
        }
      >
        Transferă
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
  const impact = emptyImpact({
    resourceLabel: "template",
    resourceName: name,
    canSoftDelete: true,
    canHardDelete: true,
    warnings: [
      "Dacă template-ul e folosit, arhivarea (dezactivare) e preferată. Ștergerea permanentă necesită force.",
    ],
    requiresTypedConfirm: true,
    typedConfirmPhrase: "STERGE",
  });

  return (
    <DeleteConfirmDialog
      triggerLabel="Șterge"
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
  return (
    <DeleteConfirmDialog
      triggerLabel="Șterge grant"
      impact={emptyImpact({
        resourceLabel: "access grant",
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
  return (
    <DeleteConfirmDialog
      triggerLabel="Șterge abonament"
      impact={emptyImpact({
        resourceLabel: "abonament",
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
  return (
    <div className="flex flex-wrap gap-2">
      {isDeleteRequest && status === "pending" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void adminFulfillGdprDeleteAction(requestId)}
        >
          Îndeplinește (soft-delete)
        </Button>
      ) : null}
      <DeleteConfirmDialog
        triggerLabel="Șterge cererea"
        impact={emptyImpact({
          resourceLabel: "cerere GDPR",
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
      Arhivează {selectedIds.length} selectate
    </Button>
  );
}
