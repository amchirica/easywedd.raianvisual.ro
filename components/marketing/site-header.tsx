"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/brand/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/features", label: "Funcționalități" },
  { href: "/pricing", label: "Prețuri" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const onHero = pathname === "/";

  return (
    <header
      className={cn(
        "z-20",
        onHero
          ? "absolute inset-x-0 top-0"
          : "sticky top-0 border-b border-border bg-card/90 backdrop-blur",
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <BrandLogo
          href="/"
          size={28}
          priority
          inverted={onHero}
          wordmarkClassName={cn(
            "md:text-[1.75rem]",
            onHero ? "text-primary-foreground" : "text-foreground",
          )}
        />
        <nav
          className={cn(
            "hidden items-center gap-8 text-sm md:flex",
            onHero ? "text-primary-foreground/85" : "text-muted-foreground",
          )}
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition",
                onHero
                  ? "hover:text-primary-foreground"
                  : "hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              onHero &&
                "text-primary-foreground hover:bg-white/10 hover:text-primary-foreground",
            )}
          >
            Autentificare
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants(),
              "bg-champagne text-foreground hover:bg-champagne/90",
            )}
          >
            Începe
          </Link>
        </div>
      </div>
    </header>
  );
}
