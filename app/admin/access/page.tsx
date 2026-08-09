import type { Metadata } from "next";

import { AdminAccessForms } from "@/components/admin/admin-access-forms";
import { listAdminUsersDirectory } from "@/lib/admin/admin-directory";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import {
  AdminDiagnosticPanel,
  captureAdminLoadError,
} from "@/lib/admin/diagnostic";
import { logAdminError } from "@/lib/admin/log";
import { FEATURE_LABELS_RO } from "@/lib/entitlements/policy";
import { ENTITLEMENT_KEYS } from "@/lib/entitlements/keys";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { createAdminClientAsync } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.admin.accessMetaTitle };
}

export default async function AdminAccessPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  try {
    const auth = await requirePlatformAdmin();
    if (!auth.ok) {
      return (
        <AdminDiagnosticPanel
          route="/admin/access"
          message={auth.error ?? "Acces admin necesar"}
        />
      );
    }

    const { users } = await listAdminUsersDirectory({
      pageSize: 100,
      status: "all",
    });
    const admin = await createAdminClientAsync();

    const { data: grants, error: grantsError } = await admin
      .from("access_grants")
      .select(
        "id, workspace_id, feature_key, enabled, ends_at, reason, granted_by, revoked_at, created_at",
      )
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (grantsError) {
      logAdminError(
        { route: "/admin/access", operation: "access_grants.select" },
        grantsError,
      );
      return (
        <AdminDiagnosticPanel
          route="/admin/access"
          code={grantsError.code}
          message={`Nu am putut încărca grant-urile: ${grantsError.message}`}
        />
      );
    }

    const workspaceIds = [
      ...new Set((grants ?? []).map((g) => g.workspace_id)),
    ];
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
          <h1 className="font-heading text-4xl">{dict.admin.access}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Status cont, grant-uri pe funcții și expirare — selectoare pe
            nume/email, fără UUID-uri.
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
  } catch (error) {
    const captured = captureAdminLoadError(
      "/admin/access",
      "page.load",
      error,
    );
    return (
      <AdminDiagnosticPanel
        route="/admin/access"
        code={captured.code}
        message={captured.message}
      />
    );
  }
}
