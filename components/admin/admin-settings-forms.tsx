"use client";

import { useActionState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminArchiveWorkspaceAction,
  adminUpdateWorkspaceNameAction,
  type AdminActionResult,
} from "@/lib/actions/admin-manage";

export function AdminWorkspaceSettingsForms({
  workspaceId,
  name,
}: {
  workspaceId: string;
  name: string;
}) {
  const { dict } = useI18n();
  const rename = adminUpdateWorkspaceNameAction.bind(null, workspaceId);
  const archive = adminArchiveWorkspaceAction.bind(null, workspaceId);
  const [renameState, renameAction, renamePending] = useActionState(
    rename,
    {} as AdminActionResult,
  );
  const [archiveState, archiveAction, archivePending] = useActionState(
    archive,
    {} as AdminActionResult,
  );

  return (
    <div className="space-y-8">
      <form action={renameAction} className="max-w-md space-y-3 border border-border p-4">
        <h2 className="font-heading text-xl">{dict.admin.renameWorkspace}</h2>
        <div className="space-y-1">
          <Label>{dict.admin.name}</Label>
          <Input name="name" defaultValue={name} required />
        </div>
        {renameState.error ? (
          <p className="text-sm text-destructive">{renameState.error}</p>
        ) : null}
        {renameState.success ? (
          <p className="text-sm text-muted-foreground">{renameState.success}</p>
        ) : null}
        <Button type="submit" disabled={renamePending}>
          {dict.dialog.save}
        </Button>
      </form>

      <form action={archiveAction} className="max-w-md space-y-3 border border-destructive/40 p-4">
        <h2 className="font-heading text-xl text-destructive">{dict.admin.archive}</h2>
        <p className="text-sm text-muted-foreground">
          {dict.dialog.typeToConfirm.replace("{phrase}", "ARHIVEAZA")}
        </p>
        <Input name="confirm" placeholder="ARHIVEAZA" autoComplete="off" />
        {archiveState.error ? (
          <p className="text-sm text-destructive">{archiveState.error}</p>
        ) : null}
        {archiveState.success ? (
          <p className="text-sm text-muted-foreground">{archiveState.success}</p>
        ) : null}
        <Button type="submit" variant="destructive" disabled={archivePending}>
          {dict.admin.archiveWorkspace}
        </Button>
      </form>
    </div>
  );
}
