"use client";

import { useActionState, useMemo, useState } from "react";

import { AdminSearchableSelect } from "@/components/admin/admin-searchable-select";
import { AdminGrantDeleteButton } from "@/components/admin/admin-deletion-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminCreateAccessGrantAction,
  adminRevokeAccessGrantAction,
  adminUpdateAccountStatusAction,
  type AdminAccessResult,
} from "@/lib/actions/admin-access";
import { getUserWorkspacesAction } from "@/lib/actions/admin-directory";
import type {
  AdminUserOption,
  AdminWorkspaceOption,
} from "@/lib/admin/admin-directory-types";

type GrantRow = {
  id: string;
  workspaceId: string;
  workspaceLabel: string;
  featureKey: string;
  featureLabel: string;
  enabled: boolean;
  endsAt: string | null;
  reason: string;
  createdAt: string;
};

type Props = {
  users: AdminUserOption[];
  featureOptions: { key: string; label: string }[];
  grants: GrantRow[];
};

export function AdminAccessForms({ users, featureOptions, grants }: Props) {
  const [statusUserId, setStatusUserId] = useState("");
  const [grantUserId, setGrantUserId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaces, setWorkspaces] = useState<AdminWorkspaceOption[]>([]);
  const [loadingWs, setLoadingWs] = useState(false);

  const [statusState, statusAction, statusPending] = useActionState(
    adminUpdateAccountStatusAction,
    {} as AdminAccessResult,
  );
  const [grantState, grantAction, grantPending] = useActionState(
    adminCreateAccessGrantAction,
    {} as AdminAccessResult,
  );
  const [revokeState, revokeAction, revokePending] = useActionState(
    adminRevokeAccessGrantAction,
    {} as AdminAccessResult,
  );

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: `${u.fullName} · ${u.email}`,
        description: u.suspended ? "Suspendat" : u.activePlan ?? "Fără plan",
        keywords: `${u.fullName} ${u.email}`,
      })),
    [users],
  );

  async function loadWorkspaces(nextUserId: string) {
    if (!nextUserId) {
      setWorkspaces([]);
      setWorkspaceId("");
      return;
    }
    setLoadingWs(true);
    const res = await getUserWorkspacesAction(nextUserId);
    setWorkspaces(res.data ?? []);
    setWorkspaceId("");
    setLoadingWs(false);
  }

  const workspaceOptions = useMemo(
    () =>
      workspaces.map((w) => ({
        value: w.id,
        label: w.name,
        description: `${w.planLabel} · ${w.workspaceType}`,
        keywords: w.name,
      })),
    [workspaces],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Status cont</h2>
        <form action={statusAction} className="space-y-3">
          <div className="space-y-1">
            <AdminSearchableSelect
              name="user_id"
              label="Utilizator"
              value={statusUserId}
              onChange={setStatusUserId}
              options={userOptions}
              placeholder="Caută utilizator…"
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <select
              name="account_status"
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="limited"
            >
              <option value="pending">Pending — așteaptă aprobare</option>
              <option value="limited">Limited — plan gratuit</option>
              <option value="approved">Approved — acces normal</option>
              <option value="suspended">Suspended — blocat</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Motiv / notă</Label>
            <Input name="note" placeholder="De ce se schimbă statusul…" />
          </div>
          <Button type="submit" disabled={statusPending || !statusUserId}>
            {statusPending ? "Se salvează…" : "Actualizează status"}
          </Button>
          {statusState.error ? (
            <p className="text-sm text-destructive">{statusState.error}</p>
          ) : null}
          {statusState.success ? (
            <p className="text-sm text-muted-foreground">{statusState.success}</p>
          ) : null}
        </form>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Grant pe funcție</h2>
        <form action={grantAction} className="space-y-3">
          <div className="space-y-1">
            <AdminSearchableSelect
              name="user_pick"
              label="Utilizator"
              value={grantUserId}
              onChange={(id) => {
                setGrantUserId(id);
                void loadWorkspaces(id);
              }}
              options={userOptions}
              placeholder="Caută utilizator…"
            />
          </div>
          <div className="space-y-1">
            <AdminSearchableSelect
              name="workspace_id"
              label="Workspace"
              value={workspaceId}
              onChange={setWorkspaceId}
              options={workspaceOptions}
              placeholder={loadingWs ? "Se încarcă…" : "Selectează workspace…"}
              disabled={!grantUserId || loadingWs}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Funcție</Label>
            <select
              name="feature_key"
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="website_publish"
            >
              {featureOptions.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Expiră la (opțional)</Label>
            <Input name="ends_at" type="datetime-local" />
          </div>
          <div className="space-y-1">
            <Label>Motiv (obligatoriu)</Label>
            <Input name="reason" required placeholder="Ex: client Raian Visual — acces temporar" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="enabled" defaultChecked />
            Activează funcția
          </label>
          <Button type="submit" disabled={grantPending || !workspaceId}>
            {grantPending ? "Se salvează…" : "Acordă acces"}
          </Button>
          {grantState.error ? (
            <p className="text-sm text-destructive">{grantState.error}</p>
          ) : null}
          {grantState.success ? (
            <p className="text-sm text-muted-foreground">{grantState.success}</p>
          ) : null}
        </form>
      </section>

      <section className="space-y-3 lg:col-span-2">
        <h2 className="font-heading text-2xl">Grant-uri active</h2>
        {!grants.length ? (
          <p className="text-sm text-muted-foreground">Niciun grant activ.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {grants.map((g) => (
              <li
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {g.featureLabel} · {g.workspaceLabel}
                  </p>
                  <p className="text-muted-foreground">
                    {g.reason}
                    {g.endsAt
                      ? ` · expiră ${new Date(g.endsAt).toLocaleString("ro-RO")}`
                      : " · fără expirare"}
                  </p>
                </div>
                <form action={revokeAction} className="flex items-center gap-2">
                  <input type="hidden" name="grant_id" value={g.id} />
                  <Input
                    name="revoke_reason"
                    placeholder="Motiv revocare"
                    className="h-8 w-48"
                    required
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={revokePending}
                  >
                    Revocă
                  </Button>
                </form>
                <AdminGrantDeleteButton grantId={g.id} />
              </li>
            ))}
          </ul>
        )}
        {revokeState.error ? (
          <p className="text-sm text-destructive">{revokeState.error}</p>
        ) : null}
        {revokeState.success ? (
          <p className="text-sm text-muted-foreground">{revokeState.success}</p>
        ) : null}
      </section>
    </div>
  );
}
