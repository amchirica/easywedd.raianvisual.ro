import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DiagnosticsDashboard } from "@/app/admin/diagnostics/diagnostics-ui";
import {
  AdminDiagnosticPanel,
  buildAdminProductionProbe,
} from "@/lib/admin/diagnostic";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { buildDiagnosticReport } from "@/lib/admin/diagnostics";
import { getPublicSiteUrlFromEnv } from "@/lib/env";
import { hydrateRuntimeEnvAsync } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Production Diagnostics",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ format?: string; rpc?: string }>;
};

function resolveOrigin(h: Headers): string {
  const envUrl = getPublicSiteUrlFromEnv();
  if (envUrl) return envUrl.replace(/\/$/, "");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");
  return "http://127.0.0.1:3000";
}

/**
 * Full production diagnostics dashboard.
 * Platform admin only. Never exposes secret values.
 */
export default async function AdminDiagnosticsPage({ searchParams }: PageProps) {
  await hydrateRuntimeEnvAsync();
  const params = await searchParams;
  const h = await headers();

  const auth = await requirePlatformAdmin();

  if (!auth.ok) {
    if (auth.rpcError) {
      const probe = buildAdminProductionProbe({
        userPresent: Boolean(auth.user),
        platformAdmin: false,
        platformAdminRpcOk: false,
        platformAdminRpcCode: auth.rpcError.code ?? null,
      });
      return (
        <AdminDiagnosticPanel
          route="/admin/diagnostics"
          title="Diagnostics unavailable — admin RPC failed"
          code={auth.rpcError.code}
          message={`is_platform_admin RPC a eșuat: ${auth.rpcError.message}. Full diagnostics requires a working platform-admin check.`}
          probe={probe}
        />
      );
    }
    if (!auth.user) {
      redirect("/login?next=/admin/diagnostics");
    }
    redirect("/dashboard");
  }

  const report = await buildDiagnosticReport({
    headersList: h,
    origin: resolveOrigin(h),
    user: auth.user,
    platformAdmin: true,
  });

  if (params.format === "json") {
    return (
      <main className="min-h-[100svh] bg-background p-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Sanitized JSON · platform admin only ·{" "}
          <a href="/admin/diagnostics" className="underline underline-offset-4">
            UI view
          </a>
        </p>
        <pre className="overflow-x-auto border border-border bg-card p-4 font-mono text-xs whitespace-pre-wrap">
          {JSON.stringify(report, null, 2)}
        </pre>
      </main>
    );
  }

  return <DiagnosticsDashboard report={report} />;
}
