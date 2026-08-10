import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";
import {
  AdminDiagnosticPanel,
  buildAdminProductionProbe,
} from "@/lib/admin/diagnostic";
import { logAdminInfo } from "@/lib/admin/log";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { hydrateRuntimeEnvAsync } from "@/lib/runtime-env";
import { getCurrentUserContext } from "@/lib/workspace";

/** Admin is always request-time (session + service role). Never SSG/ISR. */
export const dynamic = "force-dynamic";
// OpenNext Cloudflare runs the Node.js runtime by default (nodejs_compat).
// Do not set runtime = "edge". Explicit "nodejs" is redundant — omit to avoid
// segment-runtime divergence across local Next vs Workers.

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await hydrateRuntimeEnvAsync();
  logAdminInfo(
    { route: "/admin", operation: "layout.hydrateRuntimeEnv" },
    {
      done: true,
    },
  );

  const pathname = (await headers()).get("x-pathname") ?? "";
  const isDiagnosticsRoute =
    pathname === "/admin/diagnostics" ||
    pathname.startsWith("/admin/diagnostics/");

  const { user, isPlatformAdmin, platformAdminRpcError } =
    await getCurrentUserContext();

  if (!user) {
    redirect("/login?next=/admin");
  }

  // On RPC failure, only /admin/diagnostics may render (limited probe).
  // Full admin chrome still requires a successful platform-admin check.
  if (platformAdminRpcError && isDiagnosticsRoute) {
    return (
      <div className="min-h-[100svh] bg-background">
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
    );
  }

  if (platformAdminRpcError) {
    const probe = buildAdminProductionProbe({
      userPresent: true,
      platformAdmin: false,
      platformAdminRpcOk: false,
      platformAdminRpcCode: platformAdminRpcError.code ?? null,
    });
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <AdminDiagnosticPanel
          route="/admin"
          title="Verificare admin eșuată (RPC)"
          code={platformAdminRpcError.code}
          message={`is_platform_admin RPC a eșuat: ${platformAdminRpcError.message}. Verifică migrația 20260719000022_platform_admin_access_fix.sql pe baza de producție.`}
          probe={probe}
        />
        <p className="mt-4 text-sm">
          <Link href="/dashboard" className="underline underline-offset-4">
            Înapoi la dashboard
          </Link>
          {" · "}
          <Link
            href="/admin/diagnostics"
            className="underline underline-offset-4"
          >
            Diagnostic admin
          </Link>
        </p>
      </div>
    );
  }

  if (!isPlatformAdmin) {
    redirect("/dashboard");
  }

  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  const adminNav = [
    { href: "/admin", label: dict.admin.overview },
    { href: "/admin/users", label: dict.admin.users },
    { href: "/admin/workspaces", label: dict.admin.workspaces },
    { href: "/admin/subscriptions", label: dict.admin.subscriptions },
    { href: "/admin/plans", label: dict.admin.plans },
    { href: "/admin/access", label: dict.admin.access },
    { href: "/admin/contracts", label: dict.admin.contracts },
    { href: "/admin/templates", label: dict.admin.templates },
    { href: "/admin/analytics", label: dict.admin.analytics },
    { href: "/admin/insights", label: dict.admin.insights },
    { href: "/admin/gdpr", label: dict.admin.gdpr },
    { href: "/admin/consents", label: dict.admin.consents },
    { href: "/admin/diagnostics", label: "Diagnostic" },
  ];

  return (
    <div className="min-h-[100svh] bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo
              href="/admin"
              size={26}
              showWordmark
              lightPad
              wordmarkClassName="text-2xl text-foreground"
            />
            <span className="rounded border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              {dict.admin.title}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm underline-offset-4 hover:underline"
            >
              {dict.admin.backDashboard}
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                {dict.admin.signOut}
              </Button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-6 pb-3 text-sm">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="whitespace-nowrap text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
