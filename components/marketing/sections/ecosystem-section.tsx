"use client";

import {
  SectionHeader,
  SectionShell,
} from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { buttonVariants } from "@/components/ui/button";
import { EASYWEDD_PRO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function EcosystemSection() {
  const { dict } = useI18n();
  const t = dict.ecosystem;

  return (
    <SectionShell muted>
      <SectionHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
        <article className="surface-card p-6">
          <p className="text-xs tracking-[0.14em] text-champagne uppercase">
            {t.forCouples}
          </p>
          <h3 className="mt-2 font-heading text-2xl text-foreground">EasyWedd</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t.couplesBody}</p>
        </article>
        <article className="surface-card p-6">
          <p className="text-xs tracking-[0.14em] text-champagne uppercase">
            {t.forVendors}
          </p>
          <h3 className="mt-2 font-heading text-2xl text-foreground">
            EasyWedd Pro
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">{t.vendorsBody}</p>
          <a
            href={EASYWEDD_PRO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "mt-4 inline-flex",
            )}
          >
            {t.discoverPro}
          </a>
        </article>
      </div>

      <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2">
        {t.flow.map((item) => (
          <span
            key={item}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
        <div className="surface-card p-5">
          <p className="text-xs font-medium tracking-wide text-success uppercase">
            {t.availableNow}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {t.availableItems.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs font-medium tracking-wide text-champagne uppercase">
            {t.comingSoon}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {t.soonItems.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-soft">{t.comingSoonNote}</p>
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-soft">
        {t.footnote}
      </p>
    </SectionShell>
  );
}
