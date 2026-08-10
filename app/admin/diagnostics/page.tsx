import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  AdminDiagnosticPanel,
  buildAdminProductionProbe,
} from "@/lib/admin/diagnostic";
import { createClient } from "@/lib/supabase/server";
import { hydrateRuntimeEnvAsync } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin diagnostics",
};

type PageProps = {
  searchParams: Promise<{ rpc?: string }>;
};

/**
 * Safe production probe for /admin. Booleans only — no secret values.
 * Accessible to authenticated users when RPC fails (middleware may land here).
 * Non-admins without RPC error are redirected away.
 */
export default async function AdminDiagnosticsPage({ searchParams }: PageProps) {
  await hydrateRuntimeEnvAsync();
  const params = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/diagnostics");
  }

  const { data: isAdmin, error: rpcError } = await supabase.rpc(
    "is_platform_admin",
  );

  const probe = buildAdminProductionProbe({
    userPresent: true,
    platformAdmin: Boolean(isAdmin) && !rpcError,
    platformAdminRpcOk: !rpcError,
    platformAdminRpcCode: rpcError?.code ?? null,
  });

  // Allow viewing diagnostics when RPC failed (production debug).
  // Deny pure non-admins when RPC succeeded with false.
  if (!rpcError && !isAdmin && params.rpc !== "error") {
    redirect("/dashboard");
  }

  const message = rpcError
    ? `is_platform_admin RPC error: ${rpcError.message}`
    : isAdmin
      ? "Platform admin OK. Env presence listed below."
      : "Authenticated but not platform admin.";

  return (
    <AdminDiagnosticPanel
      route="/admin/diagnostics"
      title="Admin production diagnostics"
      code={rpcError?.code ?? (params.rpc === "error" ? "rpc_redirect" : null)}
      message={message}
      probe={probe}
    />
  );
}
