import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { notFound } from "next/navigation";

import { AdminTransferOwnershipForm } from "@/components/admin/admin-deletion-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logAdminAccessReasonAction } from "@/lib/actions/admin-insights";
import { requireAdminWorkspace } from "@/lib/admin/workspace-context";
import { isProtectedSystemWorkspace } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.admin.workspaceMetaTitle };
}

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminWorkspaceDetailPage({ params }: PageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { id } = await params;
  const supabase = await createClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug, workspace_type, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!workspace) notFound();

  const protectedWs = isProtectedSystemWorkspace(workspace);

  const { data: access } = await supabase
    .from("admin_access_reasons")
    .select("id")
    .eq("target_id", id)
    .eq("target_type", "workspace")
    .limit(1);

  const unlocked = (access ?? []).length > 0;

  const { data: subscription } = unlocked
    ? await supabase
        .from("subscriptions")
        .select("plan, status, access_ends_at, product_key")
        .eq("workspace_id", id)
        .maybeSingle()
    : { data: null };

  const adminCtx = protectedWs ? null : await requireAdminWorkspace(id);
  const wedding = adminCtx?.ok ? adminCtx.context.wedding : null;

  const [{ count: guestsCount }, { count: tablesCount }, { count: vendorsCount }] =
    adminCtx?.ok && wedding
      ? await Promise.all([
          supabase
            .from("guests")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", id),
          supabase
            .from("tables")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", id),
          supabase
            .from("vendors")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", id),
        ])
      : [
          { count: 0 },
          { count: 0 },
          { count: 0 },
        ];

  return (
    <div className="space-y-6">
      {!protectedWs ? (
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="border border-border p-3">
            <dt className="text-muted-foreground">{dict.admin.guests}</dt>
            <dd className="text-2xl font-medium">{guestsCount ?? 0}</dd>
          </div>
          <div className="border border-border p-3">
            <dt className="text-muted-foreground">Mese</dt>
            <dd className="text-2xl font-medium">{tablesCount ?? 0}</dd>
          </div>
          <div className="border border-border p-3">
            <dt className="text-muted-foreground">Vendori</dt>
            <dd className="text-2xl font-medium">{vendorsCount ?? 0}</dd>
          </div>
        </dl>
      ) : null}

      {wedding ? (
        <p className="text-sm text-muted-foreground">
          Nuntă: {wedding.couple_name_1} & {wedding.couple_name_2}
          {wedding.wedding_date
            ? ` · ${new Date(wedding.wedding_date).toLocaleDateString("ro-RO")}`
            : ""}
        </p>
      ) : !protectedWs ? (
        <p className="text-sm text-muted-foreground">{dict.admin.noWeddingRecord}</p>
      ) : null}

      {!unlocked ? (
        <form action={logAdminAccessReasonAction} className="max-w-lg space-y-3 border border-border p-4">
          <p className="text-sm">
            Pentru detalii de abonament, înregistrează un motiv de acces (audit).
          </p>
          <input type="hidden" name="target_type" value="workspace" />
          <input type="hidden" name="target_id" value={id} />
          <div className="space-y-1">
            <Label>Motiv</Label>
            <Input name="reason" required placeholder="Suport client / incident..." />
          </div>
          <Button type="submit">{dict.admin.unlockSubscription}</Button>
        </form>
      ) : (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Plan</dt>
            <dd>{subscription?.plan ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{subscription?.status ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Product</dt>
            <dd>{subscription?.product_key ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{dict.admin.accessUntil}</dt>
            <dd>
              {subscription?.access_ends_at
                ? new Date(subscription.access_ends_at).toLocaleDateString("ro-RO")
                : "—"}
            </dd>
          </div>
        </dl>
      )}

      {!protectedWs ? (
        <section className="max-w-xl space-y-2 border border-border p-4">
          <h2 className="font-heading text-xl">Transfer ownership</h2>
          <p className="text-xs text-muted-foreground">
            Necesar înainte de ștergerea unui utilizator care deține acest
            workspace.
          </p>
          <AdminTransferOwnershipForm workspaceId={id} />
        </section>
      ) : null}
    </div>
  );
}
