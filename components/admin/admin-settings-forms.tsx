"use client";

import { useActionState } from "react";

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
        <h2 className="font-heading text-xl">Redenumește workspace</h2>
        <div className="space-y-1">
          <Label>Nume</Label>
          <Input name="name" defaultValue={name} required />
        </div>
        {renameState.error ? (
          <p className="text-sm text-destructive">{renameState.error}</p>
        ) : null}
        {renameState.success ? (
          <p className="text-sm text-muted-foreground">{renameState.success}</p>
        ) : null}
        <Button type="submit" disabled={renamePending}>
          Salvează
        </Button>
      </form>

      <form action={archiveAction} className="max-w-md space-y-3 border border-destructive/40 p-4">
        <h2 className="font-heading text-xl text-destructive">Arhivează</h2>
        <p className="text-sm text-muted-foreground">
          Acțiune distructivă. Tastează <strong>ARHIVEAZA</strong> pentru confirmare.
        </p>
        <Input name="confirm" placeholder="ARHIVEAZA" autoComplete="off" />
        {archiveState.error ? (
          <p className="text-sm text-destructive">{archiveState.error}</p>
        ) : null}
        {archiveState.success ? (
          <p className="text-sm text-muted-foreground">{archiveState.success}</p>
        ) : null}
        <Button type="submit" variant="destructive" disabled={archivePending}>
          Arhivează workspace
        </Button>
      </form>
    </div>
  );
}
