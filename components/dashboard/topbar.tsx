"use client";

import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import type { NavItem } from "@/components/dashboard/nav-config";
import { useI18n } from "@/components/providers/i18n-provider";
import { PreferenceControls } from "@/components/shared/preference-controls";
import { WorkspaceSearch } from "@/components/dashboard/workspace-search";
import { logoutAction } from "@/lib/actions/auth";
import type { Profile, Workspace } from "@/types/database";

type TopbarProps = {
  profile: Profile | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isPlatformAdmin: boolean;
  navItems: NavItem[];
};

export function DashboardTopbar({
  profile,
  activeWorkspace,
  isPlatformAdmin,
  navItems,
}: TopbarProps) {
  const { dict } = useI18n();

  return (
    <header className="flex items-center justify-between border-b border-border bg-card/70 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNav items={navItems} />
        <div className="lg:hidden">
          <BrandLogo
            href="/dashboard"
            size={22}
            lightPad
            wordmarkClassName="text-xl text-foreground"
          />
        </div>
        <div className="hidden lg:block">
          <p className="text-sm text-muted-foreground">
            {dict.settings.activeWorkspace}
          </p>
          <p className="text-sm font-medium">
            {activeWorkspace?.name ?? dict.settings.noWorkspace}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <WorkspaceSearch />
        <PreferenceControls compact className="hidden sm:flex" />
        {isPlatformAdmin ? (
          <Link
            href="/admin"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {dict.admin.title}
          </Link>
        ) : null}
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {profile?.full_name || profile?.email}
        </span>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            {dict.settings.signOut}
          </Button>
        </form>
      </div>
    </header>
  );
}
