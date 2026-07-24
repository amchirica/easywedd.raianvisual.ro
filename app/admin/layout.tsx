import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";
import { getCurrentUserContext } from "@/lib/workspace";

const adminNav = [
  { href: "/admin", label: "Prezentare" },
  { href: "/admin/users", label: "Utilizatori" },
  { href: "/admin/workspaces", label: "Workspace-uri" },
  { href: "/admin/subscriptions", label: "Abonamente" },
  { href: "/admin/plans", label: "Planuri" },
  { href: "/admin/access", label: "Acces & aprobări" },
  { href: "/admin/contracts", label: "Contracte" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/insights", label: "Insights" },
  { href: "/admin/gdpr", label: "GDPR" },
  { href: "/admin/consents", label: "Consimțăminte" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isPlatformAdmin } = await getCurrentUserContext();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isPlatformAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-[100svh] bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo
              href="/admin"
              size={26}
              showWordmark
              wordmarkClassName="text-2xl"
            />
            <span className="rounded border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm underline-offset-4 hover:underline"
            >
              Dashboard
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Ieșire
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
