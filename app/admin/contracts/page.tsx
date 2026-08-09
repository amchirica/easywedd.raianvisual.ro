import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import Link from "next/link";

import { AdminConfirmDelete } from "@/components/admin/admin-confirm-delete";
import { AdminContractForm } from "@/components/admin/admin-contract-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminSoftDeleteContractBound } from "@/lib/actions/admin-billing";
import {
  createClientContractAction,
  disableContractAccessAction,
  extendContractAccessAction,
} from "@/lib/actions/admin-contracts";
import {
  listAdminUserOptions,
  listContractsDirectory,
} from "@/lib/admin/admin-directory";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { logAdminError } from "@/lib/admin/log";
import { CONTRACT_STATUS_LABELS } from "@/lib/billing/labels";
import { listPublicBillingPlans } from "@/lib/billing/plan-catalog";
import { createAdminClientAsync } from "@/lib/supabase/admin";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.admin.contractsMetaTitle };
}

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function AdminContractsPage({ searchParams }: PageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const params = await searchParams;

  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    throw new Error(auth.error ?? "Acces admin necesar");
  }

  const admin = await createAdminClientAsync();
  const [plans, users, contracts] = await Promise.all([
    listPublicBillingPlans(),
    listAdminUserOptions(),
    listContractsDirectory({
      q: params.q,
      status: params.status,
    }),
  ]);

  const { data: legacyLinks, error: legacyError } = await admin
    .from("client_contract_links")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  if (legacyError) {
    logAdminError(
      { route: "/admin/contracts", operation: "client_contract_links.select" },
      legacyError,
    );
    throw new Error(
      `Nu am putut încărca linkurile legacy (${legacyError.code ?? "unknown"}): ${legacyError.message}`,
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-heading text-4xl">{dict.admin.contracts}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Selectează utilizatorul, workspace-ul și abonamentul — fără UUID-uri.
        </p>
      </header>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Titlu contract…"
          className="h-9 min-w-[220px] rounded-lg border border-input bg-background px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={params.status ?? "all"}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="all">Toate statusurile</option>
          {Object.entries(CONTRACT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 rounded-lg bg-foreground px-4 text-sm text-background"
        >
          Filtrează
        </button>
      </form>

      <AdminContractForm
        users={users}
        plans={plans.map((p) => ({ key: p.key, name: p.name }))}
        contracts={contracts}
      />

      <div className="space-y-4">
        <h2 className="font-heading text-2xl">Contracte active</h2>
        {!contracts.length ? (
          <p className="text-sm text-muted-foreground">Niciun contract.</p>
        ) : (
          contracts.map((c) => (
            <article
              key={c.id}
              className="flex flex-col gap-3 border border-border p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="text-sm">
                <p className="font-heading text-xl">{c.title}</p>
                <p className="text-muted-foreground">
                  {CONTRACT_STATUS_LABELS[c.status] ?? c.status} ·{" "}
                  {c.planKey ?? "—"} · {c.clientEmail}
                </p>
                <p className="mt-1">
                  Workspace:{" "}
                  {c.workspaceId ? (
                    <Link
                      href={`/admin/workspaces/${c.workspaceId}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {c.workspaceName}
                    </Link>
                  ) : (
                    <span>{c.workspaceName}</span>
                  )}
                </p>
              </div>
              {c.workspaceId ? (
                <AdminConfirmDelete
                  workspaceId={c.workspaceId}
                  id={c.id}
                  label={dict.dialog.delete}
                  confirmLabel="Confirmă ștergerea"
                  action={adminSoftDeleteContractBound}
                />
              ) : null}
            </article>
          ))
        )}
      </div>

      <section className="space-y-6 border-t border-border pt-8">
        <header>
          <h2 className="font-heading text-2xl">Linkuri partener (legacy)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Creare workspace + invitație client Raian Fine Arts.
          </p>
        </header>

        <form
          action={createClientContractAction}
          className="grid max-w-2xl gap-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Nume workspace</Label>
              <Input name="workspace_name" required />
            </div>
            <div className="space-y-1">
              <Label>Email client</Label>
              <Input name="client_email" type="email" required />
            </div>
            <div className="space-y-1">
              <Label>Pachet</Label>
              <Input name="package_name" placeholder="Premium Wedding" />
            </div>
            <div className="space-y-1">
              <Label>{dict.admin.contractReference}</Label>
              <Input name="external_contract_reference" />
            </div>
            <div className="space-y-1">
              <Label>Plan</Label>
              <select
                name="access_plan"
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                defaultValue="premium"
              >
                <option value="starter">starter</option>
                <option value="essentials">essentials</option>
                <option value="premium">premium</option>
                <option value="agency">agency</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Luni acces</Label>
              <Input name="access_months" type="number" defaultValue={12} />
            </div>
          </div>
          <Button type="submit">{dict.admin.createAndInvite}</Button>
        </form>

        <div className="divide-y divide-border border-y border-border">
          {(legacyLinks ?? []).map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm">
                <p className="font-heading text-xl">
                  {c.package_name || "Contract"} · {c.access_plan}
                </p>
                <p className="text-muted-foreground">
                  {c.external_contract_reference || "—"} · până la{" "}
                  {c.access_ends_at
                    ? new Date(c.access_ends_at).toLocaleDateString("ro-RO")
                    : "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={extendContractAccessAction} className="flex gap-2">
                  <input type="hidden" name="contract_id" value={c.id} />
                  <input type="hidden" name="months" value="3" />
                  <Button type="submit" size="sm" variant="outline">
                    +3 luni
                  </Button>
                </form>
                <form action={disableContractAccessAction.bind(null, c.id)}>
                  <Button type="submit" size="sm" variant="destructive">
                    Dezactivează
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
