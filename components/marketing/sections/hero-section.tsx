"use client";

import Link from "next/link";

import { HeroDashboardMock } from "@/components/marketing/hero-dashboard-mock";
import { useI18n } from "@/components/providers/i18n-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const { dict } = useI18n();
  const t = dict.hero;

  return (
    <section className="relative overflow-hidden px-6 pt-16 pb-24 sm:pt-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(198,167,106,0.16),transparent)]"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-14">
        <div className="max-w-3xl text-center">
          <span className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-champagne/25 bg-champagne/10 px-4 py-1.5 text-xs font-medium tracking-wide text-champagne-soft">
            {t.eyebrow}
          </span>
          <p className="animate-fade-in mt-4 text-sm text-muted-foreground">
            {t.brand}
          </p>
          <h1 className="animate-fade-up mt-3 font-heading text-4xl font-medium tracking-tight text-balance text-foreground sm:text-5xl md:text-6xl">
            {t.title}
          </h1>
          <p className="animate-fade-up mt-5 mx-auto max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            {t.subtitle}
          </p>
          <div className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              {t.ctaPrimary}
            </Link>
            <Link
              href="#cum-functioneaza"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              {t.ctaSecondary}
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-soft">{t.footnote}</p>
        </div>

        <HeroDashboardMock />
      </div>
    </section>
  );
}
