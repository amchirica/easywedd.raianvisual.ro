"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import type { NavItem } from "@/components/dashboard/nav-config";
import { LockIcon, NavIcon } from "@/components/dashboard/nav-icons";
import { useI18n } from "@/components/providers/i18n-provider";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { dict } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "lg:hidden",
        )}
        aria-label="Meniu"
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <SheetHeader className="border-b border-sidebar-border px-6 py-5 text-left">
          <SheetTitle className="sr-only">Meniu EasyWedd</SheetTitle>
          <BrandLogo
            href="/dashboard"
            size={24}
            lightPad
            wordmarkClassName="text-2xl text-foreground"
          />
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3">
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
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70",
                  item.locked && "opacity-60",
                )}
              >
                <NavIcon iconKey={item.iconKey} className="size-4" />
                <span className="flex-1">{dict.nav[item.labelKey]}</span>
                {item.locked ? <LockIcon className="size-3.5" /> : null}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
