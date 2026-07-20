import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <BrandLogo href="/" size={24} wordmarkClassName="text-xl" />
          <p className="mt-2 text-sm text-muted-foreground">
            Organizarea nunții, cu eleganță.
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
          <Link href="/features" className="hover:text-foreground">
            Funcționalități
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Prețuri
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Confidențialitate
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Termeni
          </Link>
        </div>
      </div>
    </footer>
  );
}
