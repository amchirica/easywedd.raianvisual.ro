"use client";

import { useActionState, useMemo, useState, useTransition } from "react";

import { AdminSearchableSelect } from "@/components/admin/admin-searchable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminGrantAccessAction,
  type AdminBillingResult,
} from "@/lib/actions/admin-billing";
import {
  adminCreateWorkspaceForUserAction,
  getUserWorkspacesAction,
} from "@/lib/actions/admin-directory";
import type {
  AdminUserOption,
  AdminWorkspaceOption,
} from "@/lib/admin/admin-directory-types";
import { ACCESS_SOURCE_LABELS } from "@/lib/billing/labels";

type PlanOption = { key: string; name: string; billing_type: string };

type Props = {
  users: AdminUserOption[];
  plans: PlanOption[];
};

function formatExpiry(iso: string | null) {
  if (!iso) return "Permanent / n/a";
  return new Date(iso).toLocaleDateString("ro-RO");
}

export function AdminSubscriptionForm({ users, plans }: Props) {
  const [userId, setUserId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaces, setWorkspaces] = useState<AdminWorkspaceOption[]>([]);
  const [loadingWs, setLoadingWs] = useState(false);
  const [permanent, setPermanent] = useState(false);
  const [planKey, setPlanKey] = useState(plans[0]?.key ?? "essentials");
  const [createName, setCreateName] = useState("");
  const [pendingCreate, startCreate] = useTransition();
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState(
    adminGrantAccessAction,
    {} as AdminBillingResult,
  );

  async function loadWorkspaces(nextUserId: string) {
    if (!nextUserId) {
      setWorkspaces([]);
      setWorkspaceId("");
      return;
    }
    setLoadingWs(true);
    const res = await getUserWorkspacesAction(nextUserId);
    const rows = res.data ?? [];
    setWorkspaces(rows);
    // Prefer grantable (non-system) workspaces — never auto-pick type "admin".
    const grantable = rows.find((w) => w.workspaceType !== "admin");
    setWorkspaceId(grantable?.id ?? "");
    setLoadingWs(false);
  }

  const selectedWs = workspaces.find((w) => w.id === workspaceId) ?? null;
  const selectedPlan = plans.find((p) => p.key === planKey) ?? null;

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: `${u.fullName} · ${u.email}`,
        description: u.suspended
          ? "Cont suspendat"
          : `${u.workspaceCount} workspace-uri${u.activePlan ? ` · ${u.activePlan}` : ""}`,
        keywords: `${u.fullName} ${u.email}`,
      })),
    [users],
  );

  const workspaceOptions = useMemo(
    () =>
      workspaces.map((w) => {
        const system = w.workspaceType === "admin";
        return {
          value: w.id,
          label: `${w.name} · ${w.workspaceType} · ${w.planLabel}`,
          description: system
            ? "Workspace de sistem — nu poate primi grant de abonament"
            : `Status: ${w.status ?? "—"} · Expiră: ${formatExpiry(w.accessEndsAt)}`,
          keywords: `${w.name} ${w.workspaceType} ${w.planLabel}`,
          disabled: system,
        };
      }),
    [workspaces],
  );

  const selectedIsSystem = selectedWs?.workspaceType === "admin";

  function handleCreateWorkspace() {
    if (!userId || !createName.trim()) return;
    setCreateMsg(null);
    const fd = new FormData();
    fd.set("user_id", userId);
    fd.set("name", createName.trim());
    fd.set("workspace_type", "couple");
    startCreate(async () => {
      const res = await adminCreateWorkspaceForUserAction({}, fd);
      if (res.error) {
        setCreateMsg(res.error);
        return;
      }
      setCreateMsg(res.success ?? "Workspace creat.");
      setCreateName("");
      const refreshed = await getUserWorkspacesAction(userId);
      setWorkspaces(refreshed.data ?? []);
      if (res.workspaceId) setWorkspaceId(res.workspaceId);
    });
  }

  return (
    <form action={formAction} className="grid max-w-2xl gap-4 border border-border p-4">
      <h2 className="font-heading text-xl">Acordă / actualizează acces</h2>

      {state.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          {state.success}
        </p>
      ) : null}

      <AdminSearchableSelect
        name="user_id"
        label="Utilizator"
        placeholder="Selectează utilizatorul"
        options={userOptions}
        value={userId}
        onChange={(v) => {
          setUserId(v);
          void loadWorkspaces(v);
        }}
        required
        emptyText="Niciun utilizator găsit"
      />

      <AdminSearchableSelect
        name="workspace_id"
        label="Workspace"
        placeholder="Selectează workspace-ul"
        options={workspaceOptions}
        value={workspaceId}
        onChange={setWorkspaceId}
        required
        disabled={!userId}
        loading={loadingWs}
        emptyText={
          userId
            ? "Utilizatorul nu are workspace — creează unul mai jos"
            : "Selectează mai întâi utilizatorul"
        }
      />

      {userId && workspaces.length === 0 && !loadingWs ? (
        <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
          <p className="text-sm text-muted-foreground">
            Niciun workspace. Creează unul pentru acest utilizator:
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Nume workspace"
              className="min-w-[200px] flex-1"
            />
            <Button
              type="button"
              variant="outline"
              disabled={pendingCreate || !createName.trim()}
              onClick={handleCreateWorkspace}
            >
              {pendingCreate ? "Se creează…" : "Creează workspace"}
            </Button>
          </div>
          {createMsg ? (
            <p className="text-xs text-muted-foreground">{createMsg}</p>
          ) : null}
        </div>
      ) : null}

      {selectedWs ? (
        <dl className="grid gap-1 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground sm:grid-cols-2">
          <div>
            Plan curent:{" "}
            <span className="text-foreground">{selectedWs.planLabel}</span>
          </div>
          <div>
            Status:{" "}
            <span className="text-foreground">{selectedWs.status ?? "—"}</span>
          </div>
          <div>
            Expirare:{" "}
            <span className="text-foreground">
              {formatExpiry(selectedWs.accessEndsAt)}
            </span>
          </div>
          <div>
            Tip:{" "}
            <span className="text-foreground">{selectedWs.workspaceType}</span>
          </div>
        </dl>
      ) : null}

      {selectedIsSystem ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          Workspace-ul selectat este de tip <strong>admin</strong> (sistem) și
          nu poate primi grant. Alege workspace-ul de tip{" "}
          <strong>couple</strong> (ex. nunta clientului).
        </p>
      ) : null}

      <div className="space-y-1">
        <Label htmlFor="plan_key">Plan</Label>
        <select
          id="plan_key"
          name="plan_key"
          value={planKey}
          onChange={(e) => setPlanKey(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm"
          required
        >
          {plans.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="access_source">Sursă acces</Label>
          <select
            id="access_source"
            name="access_source"
            defaultValue="admin_grant"
            className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm"
          >
            {Object.entries(ACCESS_SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Tip billing</Label>
          <Input
            readOnly
            value={selectedPlan?.billing_type ?? "—"}
            className="bg-muted/40"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="starts_at">Data început</Label>
          <Input
            id="starts_at"
            name="starts_at"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue="active"
            className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm"
          >
            <option value="active">Activ</option>
            <option value="trialing">Trial</option>
            <option value="past_due">Restanță</option>
            <option value="canceled">Anulat</option>
            <option value="incomplete">Incomplet</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="access_months">Perioadă (luni)</Label>
          <Input
            id="access_months"
            name="access_months"
            type="number"
            min={0}
            max={120}
            defaultValue={12}
            disabled={permanent}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="access_ends_at">Data expirării</Label>
          <Input
            id="access_ends_at"
            name="access_ends_at"
            type="date"
            disabled={permanent}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="permanent"
          className="size-4"
          checked={permanent}
          onChange={(e) => setPermanent(e.target.checked)}
        />
        Acces permanent
      </label>

      <div className="space-y-1">
        <Label htmlFor="notes">Motiv administrativ</Label>
        <Input id="notes" name="notes" placeholder="Ticket, partener, promo…" />
      </div>

      <Button
        type="submit"
        disabled={pending || !workspaceId || selectedIsSystem}
      >
        {pending ? "Se salvează…" : "Acordă acces"}
      </Button>
    </form>
  );
}
