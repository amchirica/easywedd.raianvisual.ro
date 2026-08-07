"use client";

import {
  SectionHeader,
  SectionShell,
} from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function VendorsSection() {
  const { dict } = useI18n();
  const t = dict.vendors;

  return (
    <SectionShell id="furnizori" muted>
      <SectionHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />
      <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2">
        {t.categories.map((cat) => (
          <span
            key={cat}
            className="rounded-full border border-champagne/25 bg-champagne/10 px-3 py-1.5 text-xs text-champagne-soft sm:text-sm"
          >
            {cat}
          </span>
        ))}
      </div>
      <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
        {t.track.map((item) => (
          <div
            key={item}
            className="surface-card px-4 py-3 text-center text-sm text-muted-foreground"
          >
            {item}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
