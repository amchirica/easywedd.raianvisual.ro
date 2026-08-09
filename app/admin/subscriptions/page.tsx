import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import Link from "next/link";

import { AdminConfirmDelete } from "@/components/admin/admin-confirm-delete";
import { AdminSubscriptionDeleteButton } from "@/components/admin/admin-deletion-controls";
import { AdminSubscriptionDatesForm } from "@/components/admin/admin-subscription-dates-form";
import { AdminSubscriptionForm } from "@/components/admin/admin-subscription-form";
import { Button } from "@/components/ui/button";
import {
  adminExtendAccessFormAction,
  adminReactivateAccessBound,
  adminRevokeAccessBound,
} from "@/lib/actions/admin-billing";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { listAdminUserOptions } from "@/lib/admin/admin-directory";
import {
  AdminDiagnosticPanel,
  captureAdminLoadError,
} from "@/lib/admin/diagnostic";
import { logAdminError } from "@/lib/admin/log";
import { ACCESS_SOURCE_LABELS } from "@/lib/billing/labels";
import { listPublicBillingPlans } from "@/lib/billing/plan-catalog";
import { createAdminClientAsync } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.admin.subscriptionsMetaTitle };
}

export default async function AdminSubscriptionsPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  try {
    return await renderSubscriptionsPage(locale, dict);
  } catch (error) {
    const captured = captureAdminLoadError(
      "/admin/subscriptions",
      "page.load",
      error,
    );
    return (
      <AdminDiagnosticPanel
        route="/admin/subscriptions"
        code={captured.code}
        message={captured.message}
      />
    );
  }
}

async function renderSubscriptionsPage(
  locale: Awaited<ReturnType<typeof getRequestLocale>>,
  dict: Awaited<ReturnType<typeof getDictionary>>,
) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return (
      <AdminDiagnosticPanel
        route="/admin/subscriptions"
        message={auth.error ?? "Acces admin necesar"}
      />
    );
  }

  const admin = await createAdminClientAsync();
  const [plans, users] = await Promise.all([
    listPublicBillingPlans(),
    listAdminUserOptions(),
  ]);

  const { data: subscriptions, error: subsError } = await admin
    .from("subscriptions")
    .select(
      "id, workspace_id, plan, status, product_key, plan_key, access_source, billing_interval, stripe_customer_id, stripe_subscription_id, stripe_checkout_session_id, access_ends_at, current_period_ends_at, trial_ends_at, cancel_at_period_end, last_payment_at, last_payment_stripe_id, admin_notes, created_at, soft_deleted_at",
    )
    .order("updated_at", { ascending: false })
    .limit(80);

  if (subsError) {
    logAdminError(
      { route: "/admin/subscriptions", operation: "subscriptions.select" },
      subsError,
    );
    return (
      <AdminDiagnosticPanel
        route="/admin/subscriptions"
        code={subsError.code}
        message={`Nu am putut încărca abonamentele: ${subsError.message}`}
      />
    );
  }

  const workspaceIds = [
    ...new Set(
      (subscriptions ?? [])
        .map((s) => s.workspace_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const { data: workspaces, error: wsError } =
    workspaceIds.length > 0
      ? await admin
          .from("workspaces")
          .select("id, name, owner_id, workspace_type")
          .in("id", workspaceIds)
      : { data: [] as { id: string; name: string; owner_id: string; workspace_type: string }[], error: null };

  if (wsError) {
    logAdminError(
      { route: "/admin/subscriptions", operation: "workspaces.select" },
      wsError,
    );
    return (
      <AdminDiagnosticPanel
        route="/admin/subscriptions"
        code={wsError.code}
        message={`Nu am putut încărca workspace-urile: ${wsError.message}`}
      />
    );
  }

  const ownerIds = [
    ...new Set(
      (workspaces ?? [])
        .map((w) => w.owner_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const { data: owners } =
    ownerIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, email, full_name")
          .in("id", ownerIds)
      : { data: [] };

  const { data: entitlements } =
    workspaceIds.length > 0
      ? await admin
          .from("feature_entitlements")
          .select("workspace_id, feature_key, enabled")
          .in("workspace_id", workspaceIds)
          .eq("enabled", true)
      : { data: [] };

  const { data: contracts } =
    workspaceIds.length > 0
      ? await admin
          .from("contracts")
          .select("id, workspace_id, title, status")
          .in("workspace_id", workspaceIds)
          .is("soft_deleted_at", null)
      : { data: [] };

  const { data: payments } =
    workspaceIds.length > 0
      ? await admin
          .from("one_time_payments")
          .select("workspace_id, created_at, status, product_key")
          .in("workspace_id", workspaceIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  const wsById = new Map((workspaces ?? []).map((w) => [w.id, w]));
  const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));
  const planByKey = new Map(plans.map((p) => [p.key, p]));

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-heading text-4xl">{dict.admin.subscriptions}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Selectează utilizatorul și workspace-ul — fără UUID-uri în interfață.
        </p>
      </header>

      <AdminSubscriptionForm
        users={users}
        plans={plans.map((p) => ({
          key: p.key,
          name: p.name,
          billing_type: p.billing_type,
        }))}
      />

      <div className="space-y-6">
        <h2 className="font-heading text-2xl">Abonamente existente</h2>
        {!(subscriptions ?? []).length ? (
          <p className="text-sm text-muted-foreground">Niciun abonament.</p>
        ) : (
          (subscriptions ?? []).map((sub) => {
            const ws = sub.workspace_id
              ? wsById.get(sub.workspace_id)
              : undefined;
            const owner = ws?.owner_id ? ownerById.get(ws.owner_id) : null;
            const planKey = sub.plan_key ?? sub.product_key ?? sub.plan;
            const plan = planByKey.get(planKey ?? "");
            const feats = (entitlements ?? [])
              .filter((e) => e.workspace_id === sub.workspace_id)
              .map((e) => e.feature_key);
            const contract = (contracts ?? []).find(
              (c) => c.workspace_id === sub.workspace_id,
            );
            const lastPay = (payments ?? []).find(
              (p) => p.workspace_id === sub.workspace_id,
            );
            const revoked = Boolean(sub.soft_deleted_at);
            const workspaceHref = sub.workspace_id
              ? `/admin/workspaces/${sub.workspace_id}`
              : null;

            return (
              <article
                key={sub.id}
                className="space-y-3 border border-border bg-card p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-xl">
                      {plan?.name ?? planKey} · {sub.status}
                      {revoked ? " · revocat" : ""}
                    </p>
                    <p className="text-muted-foreground">
                      Workspace:{" "}
                      {workspaceHref ? (
                        <Link
                          href={workspaceHref}
                          className="underline-offset-4 hover:underline"
                        >
                          {ws?.name ?? "Workspace"}
                        </Link>
                      ) : (
                        <span>{ws?.name ?? "—"}</span>
                      )}
                      {ws ? ` · ${ws.workspace_type}` : null}
                      {owner
                        ? ` · ${owner.full_name || owner.email}`
                        : null}
                    </p>
                    {(sub.stripe_customer_id ||
                      sub.stripe_subscription_id) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Stripe:{" "}
                        {sub.stripe_customer_id
                          ? `cust ${sub.stripe_customer_id.slice(0, 12)}…`
                          : "—"}
                        {" · "}
                        {sub.stripe_subscription_id
                          ? `sub ${sub.stripe_subscription_id.slice(0, 12)}…`
                          : "—"}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sub.workspace_id ? (
                      revoked ? (
                        <AdminConfirmDelete
                          workspaceId={sub.workspace_id}
                          id={sub.id}
                          label={dict.admin.reactivateAccess}
                          confirmLabel="Confirmă reactivarea"
                          action={adminReactivateAccessBound}
                        />
                      ) : (
                        <AdminConfirmDelete
                          workspaceId={sub.workspace_id}
                          id={sub.id}
                          label={dict.admin.revokeAccess}
                          confirmLabel="Confirmă revocarea"
                          action={adminRevokeAccessBound}
                        />
                      )
                    ) : null}
                    <AdminSubscriptionDeleteButton
                      subscriptionId={sub.id}
                      label={`${sub.plan_key ?? sub.plan} · ${(sub.workspace_id ?? "—").toString().slice(0, 8)}`}
                    />
                  </div>
                </div>

                <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">
                      {dict.admin.accessSource}
                    </dt>
                    <dd>
                      {ACCESS_SOURCE_LABELS[sub.access_source ?? "legacy"] ??
                        sub.access_source}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tip billing</dt>
                    <dd>{sub.billing_interval ?? plan?.billing_type ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{dict.admin.expires}</dt>
                    <dd>
                      {sub.access_ends_at
                        ? new Date(sub.access_ends_at).toLocaleDateString(
                            "ro-RO",
                          )
                        : "Permanent / n/a"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      {dict.admin.lastPayment}
                    </dt>
                    <dd>
                      {sub.last_payment_at
                        ? new Date(sub.last_payment_at).toLocaleString("ro-RO")
                        : lastPay
                          ? new Date(lastPay.created_at).toLocaleString("ro-RO")
                          : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Contract</dt>
                    <dd>
                      {contract
                        ? `${contract.title} (${contract.status})`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Client</dt>
                    <dd>{owner?.email ?? "—"}</dd>
                  </div>
                </dl>

                <p className="text-xs text-muted-foreground">
                  Funcții: {feats.length ? feats.join(", ") : "—"}
                </p>
                {sub.admin_notes ? (
                  <p className="text-xs">Motiv: {sub.admin_notes}</p>
                ) : null}

                {sub.workspace_id ? (
                  <div className="flex flex-wrap items-end gap-3">
                    <form
                      action={adminExtendAccessFormAction}
                      className="flex items-end gap-2"
                    >
                      <input
                        type="hidden"
                        name="workspace_id"
                        value={sub.workspace_id}
                      />
                      <input type="hidden" name="months" value="3" />
                      <Button type="submit" size="sm" variant="outline">
                        Prelungește accesul (+3 luni)
                      </Button>
                    </form>

                    <AdminSubscriptionDatesForm
                      workspaceId={sub.workspace_id}
                      accessEndsAt={sub.access_ends_at}
                      adminNotes={sub.admin_notes}
                    />
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
