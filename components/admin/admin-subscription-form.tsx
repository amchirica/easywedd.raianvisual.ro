"use client";

import { useActionState, useMemo, useState, useTransition } from "react";

import { AdminSearchableSelect } from "@/components/admin/admin-searchable-select";
import { useI18n } from "@/components/providers/i18n-provider";
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
import { formatDateShort } from "@/lib/i18n/format";
import { getStatusLabel } from "@/lib/i18n/status-labels";
import { t } from "@/lib/i18n/t";

type PlanOption = { key: string; name: string; billing_type: string };

type Props = {
  users: AdminUserOption[];
  plans: PlanOption[];
};

export function AdminSubscriptionForm({ users, plans }: Props) {
  const { dict, locale } = useI18n();
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

  function formatExpiry(iso: string | null) {
    if (!iso) return dict.admin.permanentNa;
    return formatDateShort(iso, locale);
  }

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
          ? dict.admin.accountSuspended
          : `${t(dict as never, "admin.workspaceCount", {
              locale,
              params: { count: u.workspaceCount },
            })}${u.activePlan ? ` · ${u.activePlan}` : ""}`,
        keywords: `${u.fullName} ${u.email}`,
      })),
    [users, dict, locale],
  );

  const workspaceOptions = useMemo(
    () =>
      workspaces.map((w) => {
        const system = w.workspaceType === "admin";
        return {
          value: w.id,
          label: `${w.name} · ${w.workspaceType} · ${w.planLabel}`,
          description: system
            ? dict.admin.systemWorkspaceNoGrant
            : t(dict as never, "admin.workspaceStatusExpiry", {
                locale,
                params: {
                  status: w.status ?? "—",
                  expiry: formatExpiry(w.accessEndsAt),
                },
              }),
          keywords: `${w.name} ${w.workspaceType} ${w.planLabel}`,
          disabled: system,
        };
      }),
    [workspaces, dict, locale],
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
      setCreateMsg(res.success ?? dict.admin.workspaceCreated);
      setCreateName("");
      const refreshed = await getUserWorkspacesAction(userId);
      setWorkspaces(refreshed.data ?? []);
      if (res.workspaceId) setWorkspaceId(res.workspaceId);
    });
  }

  return (
    <form action={formAction} className="grid max-w-2xl gap-4 border border-border p-4">
      <h2 className="font-heading text-xl">{dict.admin.grantAccessTitle}</h2>

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
        label={dict.admin.user}
        placeholder={dict.admin.selectUser}
        options={userOptions}
        value={userId}
        onChange={(v) => {
          setUserId(v);
          void loadWorkspaces(v);
        }}
        required
        emptyText={dict.admin.noUserFound}
      />

      <AdminSearchableSelect
        name="workspace_id"
        label={dict.admin.workspace}
        placeholder={dict.admin.selectWorkspaceFull}
        options={workspaceOptions}
        value={workspaceId}
        onChange={setWorkspaceId}
        required
        disabled={!userId}
        loading={loadingWs}
        emptyText={
          userId ? dict.admin.userHasNoWorkspace : dict.admin.selectUserFirst
        }
      />

      {userId && workspaces.length === 0 && !loadingWs ? (
        <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
          <p className="text-sm text-muted-foreground">
            {dict.admin.noWorkspaceCreate}
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder={dict.admin.workspaceNamePlaceholder}
              className="min-w-[200px] flex-1"
            />
            <Button
              type="button"
              variant="outline"
              disabled={pendingCreate || !createName.trim()}
              onClick={handleCreateWorkspace}
            >
              {pendingCreate ? dict.admin.creating : dict.admin.createWorkspace}
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
            {dict.admin.currentPlan}{" "}
            <span className="text-foreground">{selectedWs.planLabel}</span>
          </div>
          <div>
            {dict.admin.status}:{" "}
            <span className="text-foreground">{selectedWs.status ?? "—"}</span>
          </div>
          <div>
            {dict.admin.expiry}{" "}
            <span className="text-foreground">
              {formatExpiry(selectedWs.accessEndsAt)}
            </span>
          </div>
          <div>
            {dict.admin.type}:{" "}
            <span className="text-foreground">{selectedWs.workspaceType}</span>
          </div>
        </dl>
      ) : null}

      {selectedIsSystem ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {dict.admin.systemAdminAlert}
        </p>
      ) : null}

      <div className="space-y-1">
        <Label htmlFor="plan_key">{dict.admin.plan}</Label>
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
          <Label htmlFor="access_source">{dict.admin.accessSource}</Label>
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
          <Label>{dict.admin.billingType}</Label>
          <Input
            readOnly
            value={selectedPlan?.billing_type ?? "—"}
            className="bg-muted/40"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="starts_at">{dict.admin.startDate}</Label>
          <Input
            id="starts_at"
            name="starts_at"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">{dict.admin.status}</Label>
          <select
            id="status"
            name="status"
            defaultValue="active"
            className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm"
          >
            <option value="active">{getStatusLabel("billing", "active", locale)}</option>
            <option value="trialing">{getStatusLabel("billing", "trialing", locale)}</option>
            <option value="past_due">{getStatusLabel("billing", "past_due", locale)}</option>
            <option value="canceled">{getStatusLabel("billing", "canceled", locale)}</option>
            <option value="incomplete">{getStatusLabel("billing", "incomplete", locale)}</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="access_months">{dict.admin.accessMonths}</Label>
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
          <Label htmlFor="access_ends_at">{dict.admin.endDate}</Label>
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
        {dict.admin.permanentAccess}
      </label>

      <div className="space-y-1">
        <Label htmlFor="notes">{dict.admin.adminReason}</Label>
        <Input
          id="notes"
          name="notes"
          placeholder={dict.admin.adminReasonPlaceholder}
        />
      </div>

      <Button
        type="submit"
        disabled={pending || !workspaceId || selectedIsSystem}
      >
        {pending ? dict.dialog.saving : dict.admin.grantAccess}
      </Button>
    </form>
  );
}
