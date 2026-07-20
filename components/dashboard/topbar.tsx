import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { logoutAction } from "@/lib/actions/auth";
import type { Profile, Workspace } from "@/types/database";

type TopbarProps = {
  profile: Profile | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isPlatformAdmin: boolean;
};

export function DashboardTopbar({
  profile,
  activeWorkspace,
  isPlatformAdmin,
}: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card/70 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <div className="lg:hidden">
          <BrandLogo href="/dashboard" size={22} wordmarkClassName="text-xl" />
        </div>
        <div className="hidden lg:block">
          <p className="text-sm text-muted-foreground">Workspace activ</p>
          <p className="text-sm font-medium">
            {activeWorkspace?.name ?? "Niciun workspace"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isPlatformAdmin ? (
          <Link
            href="/admin"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Admin
          </Link>
        ) : null}
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {profile?.full_name || profile?.email}
        </span>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Ieșire
          </Button>
        </form>
      </div>
    </header>
  );
}
