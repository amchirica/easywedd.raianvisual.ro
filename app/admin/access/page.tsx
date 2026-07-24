import type { Metadata } from "next";

import { AdminAccessForms } from "@/components/admin/admin-access-forms";
import { listAdminUsersDirectory } from "@/lib/admin/admin-directory";
import { FEATURE_LABELS_RO } from "@/lib/entitlements/policy";
import { ENTITLEMENT_KEYS } from "@/lib/entitlements/keys";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Acces & aprobări · Admin" };

export default async function AdminAccessPage() {
  const { users } = await listAdminUsersDirectory({ pageSize: 100, status: "all" });
  const admin = createAdminClient();

  const { data: grants } = await admin
    .from("access_grants")
    .select(
      "id, workspace_id, feature_key, enabled, ends_at, reason, granted_by, revoked_at, created_at",
    )
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const workspaceIds = [...new Set((grants ?? []).map((g) => g.workspace_id))];
  const { data: workspaces } = workspaceIds.length
    ? await admin.from("workspaces").select("id, name").in("id", workspaceIds)
    : { data: [] as { id: string; name: string }[] };

  const wsMap = new Map((workspaces ?? []).map((w) => [w.id, w.name]));

  const featureOptions = ENTITLEMENT_KEYS.map((key) => ({
    key,
    label: FEATURE_LABELS_RO[key],
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-4xl">Acces & aprobări</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Status cont, grant-uri pe funcții și expirare — selectoare pe nume/email,
          fără UUID-uri.
        </p>
      </header>

      <AdminAccessForms
        users={users}
        featureOptions={featureOptions}
        grants={(grants ?? []).map((g) => ({
          id: g.id,
          workspaceId: g.workspace_id,
          workspaceLabel: wsMap.get(g.workspace_id) ?? "Workspace",
          featureKey: g.feature_key,
          featureLabel:
            FEATURE_LABELS_RO[
              g.feature_key as keyof typeof FEATURE_LABELS_RO
            ] ?? g.feature_key,
          enabled: g.enabled,
          endsAt: g.ends_at,
          reason: g.reason,
          createdAt: g.created_at,
        }))}
      />
    </div>
  );
}
