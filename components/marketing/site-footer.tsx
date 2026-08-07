"use client";

import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { RaianVisualFooterPromo } from "@/components/marketing/raian-visual-promo";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  APP_NAME,
  EASYWEDD_PRO_URL,
  SUPPORT_EMAIL,
} from "@/lib/constants";

export function SiteFooter() {
  const { dict } = useI18n();
  const nav = dict.navigation;
  const year = new Date().getFullYear();

  const PRODUCT_LINKS = [
    { href: "/#functii", label: nav.features },
    { href: "/features", label: nav.featuresPage },
    { href: "/pricing", label: nav.pricing },
    { href: "/login", label: nav.login },
    { href: "/register", label: nav.createAccount },
  ];

  const LEGAL_LINKS = [
    { href: "/privacy", label: nav.privacy },
    { href: "/terms", label: nav.terms },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm space-y-4">
            <BrandLogo
              href="/"
              size={24}
              lightPad
              wordmarkClassName="text-foreground text-xl"
            />
            <p className="text-sm text-muted-foreground">{nav.footerTagline}</p>
            <a
              href={EASYWEDD_PRO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-champagne-soft hover:text-champagne"
            >
              {nav.forVendors}
            </a>
            <p className="text-sm text-muted-soft">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="hover:text-foreground"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {nav.product}
              </p>
              <ul className="space-y-2 text-sm text-muted-soft">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {nav.legal}
              </p>
              <ul className="space-y-2 text-sm text-muted-soft">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/70 pt-6">
          <RaianVisualFooterPromo />
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {APP_NAME}. {nav.footerRights}
          </p>
          <p>{nav.footerBlurb}</p>
        </div>
      </div>
    </footer>
  );
}
