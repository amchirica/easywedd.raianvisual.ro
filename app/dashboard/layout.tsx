import { redirect } from "next/navigation";

import { filterDashboardNav } from "@/components/dashboard/nav-config";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import {
  getCurrentUserContext,
  getWorkspaceEntitlementRows,
} from "@/lib/workspace";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getCurrentUserContext();

  if (!context.user) {
    redirect("/login");
  }

  const entitlementRows = context.activeWorkspace?.id
    ? await getWorkspaceEntitlementRows(context.activeWorkspace.id)
    : [];
  const entitlements = entitlementRows.map((row) => ({
    feature_key: row.feature_key,
    enabled: row.enabled,
  }));

  const navItems = filterDashboardNav(entitlements);

  return (
    <div className="flex min-h-[100svh] bg-background">
      <DashboardSidebar items={navItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          profile={context.profile}
          workspaces={context.workspaces}
          activeWorkspace={context.activeWorkspace}
          isPlatformAdmin={context.isPlatformAdmin}
          navItems={navItems}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
