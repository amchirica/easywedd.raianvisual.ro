"use client";

import { useActionState, useMemo, useState, useTransition } from "react";

import { AdminSearchableSelect } from "@/components/admin/admin-searchable-select";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminUpsertContractAction,
  type AdminBillingResult,
} from "@/lib/actions/admin-billing";
import {
  getUserWorkspacesAction,
  getWorkspaceSubscriptionsAction,
} from "@/lib/actions/admin-directory";
import type {
  AdminContractOption,
  AdminSubscriptionOption,
  AdminUserOption,
  AdminWorkspaceOption,
} from "@/lib/admin/admin-directory-types";
import { CONTRACT_STATUS_LABELS } from "@/lib/billing/labels";

type PlanOption = { key: string; name: string };

type Props = {
  users: AdminUserOption[];
  plans: PlanOption[];
  contracts: AdminContractOption[];
};

export function AdminContractForm({ users, plans, contracts }: Props) {
  const { dict } = useI18n();
  const [contractId, setContractId] = useState("");
  const [userId, setUserId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [workspaces, setWorkspaces] = useState<AdminWorkspaceOption[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionOption[]>(
    [],
  );
  const [loadingWs, setLoadingWs] = useState(false);
  const [loadingSubs, startLoadSubs] = useTransition();
  const [title, setTitle] = useState("Contract EasyWedd");
  const [planKey, setPlanKey] = useState(plans[0]?.key ?? "essentials");
  const [status, setStatus] = useState("draft");
  const [signatureStatus, setSignatureStatus] = useState("unsigned");
  const [documentUrl, setDocumentUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [notes, setNotes] = useState("");

  const [state, formAction, pending] = useActionState(
    adminUpsertContractAction,
    {} as AdminBillingResult,
  );

  async function loadWorkspaces(nextUserId: string) {
    if (!nextUserId) {
      setWorkspaces([]);
      setWorkspaceId("");
      setSubscriptions([]);
      setSubscriptionId("");
      return;
    }
    setLoadingWs(true);
    const res = await getUserWorkspacesAction(nextUserId);
    setWorkspaces(res.data ?? []);
    setWorkspaceId("");
    setSubscriptions([]);
    setSubscriptionId("");
    setLoadingWs(false);
  }

  function loadSubscriptions(nextWorkspaceId: string) {
    if (!nextWorkspaceId) {
      setSubscriptions([]);
      setSubscriptionId("");
      return;
    }
    startLoadSubs(async () => {
      const res = await getWorkspaceSubscriptionsAction(nextWorkspaceId);
      setSubscriptions(res.data ?? []);
      setSubscriptionId("");
    });
  }

  async function selectContract(nextId: string) {
    setContractId(nextId);
    if (!nextId) {
      setTitle("Contract EasyWedd");
      setPlanKey(plans[0]?.key ?? "essentials");
      setStatus("draft");
      setSignatureStatus("unsigned");
      setDocumentUrl("");
      setStartsAt("");
      setEndsAt("");
      setNotes("");
      return;
    }
    const c = contracts.find((x) => x.id === nextId);
    if (!c) return;
    setTitle(c.title);
    setPlanKey(c.planKey ?? plans[0]?.key ?? "essentials");
    setStatus(c.status);
    if (c.userId) {
      setUserId(c.userId);
      setLoadingWs(true);
      const wsRes = await getUserWorkspacesAction(c.userId);
      setWorkspaces(wsRes.data ?? []);
      setLoadingWs(false);
    }
    setWorkspaceId(c.workspaceId ?? "");
    if (c.workspaceId) {
      const subRes = await getWorkspaceSubscriptionsAction(c.workspaceId);
      setSubscriptions(subRes.data ?? []);
    } else {
      setSubscriptions([]);
    }
    setSubscriptionId(c.subscriptionId ?? "");
  }

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: `${u.fullName} · ${u.email}`,
        description: u.email,
        keywords: `${u.fullName} ${u.email}`,
      })),
    [users],
  );

  const workspaceOptions = useMemo(
    () =>
      workspaces.map((w) => ({
        value: w.id,
        label: `${w.name} · ${w.workspaceType} · ${w.planLabel}`,
        description: w.status ? `Status: ${w.status}` : undefined,
        keywords: `${w.name} ${w.workspaceType}`,
      })),
    [workspaces],
  );

  const subscriptionOptions = useMemo(
    () =>
      subscriptions.map((s) => ({
        value: s.id,
        label: `${s.planLabel} · ${s.status}`,
        description: s.accessEndsAt
          ? `Expiră ${new Date(s.accessEndsAt).toLocaleDateString("ro-RO")}`
          : "Fără expirare",
      })),
    [subscriptions],
  );

  const contractOptions = useMemo(
    () => [
      {
        value: "",
        label: "Contract nou",
        description: "Creează un contract nou",
      },
      ...contracts.map((c) => ({
        value: c.id,
        label: `${c.title} · ${c.workspaceName} · ${c.clientEmail} · ${CONTRACT_STATUS_LABELS[c.status] ?? c.status}`,
        keywords: `${c.title} ${c.workspaceName} ${c.clientEmail}`,
      })),
    ],
    [contracts],
  );

  return (
    <form action={formAction} className="grid max-w-2xl gap-4 border border-border p-4">
      <h2 className="font-heading text-2xl">Contract nou / actualizare</h2>

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
        name="id"
        label={dict.admin.existingContract}
        placeholder={dict.admin.selectContractPlaceholder}
        options={contractOptions}
        value={contractId}
        onChange={(v) => {
          void selectContract(v);
        }}
        emptyText={dict.admin.noContracts}
      />

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
      />

      <AdminSearchableSelect
        name="workspace_id"
        label={dict.admin.workspace}
        placeholder={dict.admin.selectWorkspaceFull}
        options={workspaceOptions}
        value={workspaceId}
        onChange={(v) => {
          setWorkspaceId(v);
          loadSubscriptions(v);
        }}
        required
        disabled={!userId}
        loading={loadingWs}
        emptyText={dict.admin.selectUser}
      />

      <AdminSearchableSelect
        name="subscription_id"
        label={dict.admin.linkedSubscription}
        placeholder={dict.admin.selectSubscriptionOptional}
        options={[
          { value: "", label: dict.admin.noLinkedSubscription },
          ...subscriptionOptions,
        ]}
        value={subscriptionId}
        onChange={setSubscriptionId}
        disabled={!workspaceId}
        loading={loadingSubs}
      />

      <div className="space-y-1">
        <Label htmlFor="title">{dict.admin.contractTitle}</Label>
        <Input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="plan_key">{dict.admin.plan}</Label>
          <select
            id="plan_key"
            name="plan_key"
            value={planKey}
            onChange={(e) => setPlanKey(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm"
          >
            {plans.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">{dict.admin.contractStatus}</Label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm"
          >
            {Object.entries(CONTRACT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="signature_status">{dict.admin.signatureStatus}</Label>
          <select
            id="signature_status"
            name="signature_status"
            value={signatureStatus}
            onChange={(e) => setSignatureStatus(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm"
          >
            <option value="unsigned">Unsigned</option>
            <option value="sent">Sent</option>
            <option value="signed">Signed</option>
            <option value="declined">Declined</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="document_url">{dict.admin.documentUrl}</Label>
          <Input
            id="document_url"
            name="document_url"
            type="url"
            placeholder="https://…"
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="starts_at">{dict.admin.startDate}</Label>
          <Input
            id="starts_at"
            name="starts_at"
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ends_at">{dict.admin.endsAt}</Label>
          <Input
            id="ends_at"
            name="ends_at"
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="internal_notes">{dict.admin.internalNotes}</Label>
        <Input
          id="internal_notes"
          name="internal_notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={pending || !workspaceId}>
        {pending ? dict.dialog.saving : dict.admin.saveContract}
      </Button>
    </form>
  );
}
