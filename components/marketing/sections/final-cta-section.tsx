"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCtaSection() {
  const { dict } = useI18n();
  const t = dict.finalCta;

  return (
    <section className="px-6 py-24">
      <div className="surface-card glow-accent mx-auto max-w-4xl px-8 py-14 text-center">
        <h2 className="font-heading text-3xl font-medium text-balance text-foreground sm:text-4xl">
          {t.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          {t.description}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            {t.cta}
          </Link>
          <Link
            href="/features"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            {dict.navigation.featuresPage}
          </Link>
        </div>
      </div>
    </section>
  );
}
