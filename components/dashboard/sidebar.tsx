"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/brand/brand-logo";
import type { NavItem } from "@/components/dashboard/nav-config";
import { LockIcon, NavIcon } from "@/components/dashboard/nav-icons";
import { cn } from "@/lib/utils";

export function DashboardSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      <div className="border-b border-sidebar-border px-6 py-5">
        <BrandLogo href="/dashboard" size={26} wordmarkClassName="text-2xl" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.locked ? "/dashboard/billing" : item.href}
              prefetch={false}
              title={
                item.locked
                  ? "Funcție premium — vezi abonamentele"
                  : undefined
              }
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70",
                item.locked && "opacity-60",
              )}
            >
              <NavIcon iconKey={item.iconKey} className="size-4" />
              <span className="flex-1">{item.label}</span>
              {item.locked ? <LockIcon className="size-3.5 opacity-70" /> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
