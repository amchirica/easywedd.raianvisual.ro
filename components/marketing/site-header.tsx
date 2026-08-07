"use client";

import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { PreferenceControls } from "@/components/shared/preference-controls";
import { useI18n } from "@/components/providers/i18n-provider";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME, EASYWEDD_PRO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { dict } = useI18n();
  const nav = dict.navigation;

  const NAV_LINKS = [
    { href: "/#cum-functioneaza", label: nav.howItWorks },
    { href: "/#functii", label: nav.features },
    { href: "/#furnizori", label: nav.vendors },
    { href: "/pricing", label: nav.pricing },
    { href: "/#faq", label: nav.faq },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <BrandLogo
          href="/"
          size={28}
          priority
          lightPad
          wordmarkClassName="text-foreground md:text-[1.75rem]"
        />

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={EASYWEDD_PRO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-champagne-soft"
          >
            {nav.pro}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <PreferenceControls className="hidden sm:flex" compact />
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            {nav.login}
          </Link>
          <Link href="/register" className={cn(buttonVariants())}>
            {nav.signup}
          </Link>
        </div>
      </div>

      <div className="border-t border-border/60 px-6 py-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-x-4 gap-y-1 lg:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className="hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={EASYWEDD_PRO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-champagne-soft"
            >
              {APP_NAME} Pro
            </a>
          </div>
          <PreferenceControls className="sm:hidden" compact />
        </div>
      </div>
    </header>
  );
}
