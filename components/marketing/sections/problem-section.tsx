"use client";

import {
  SectionHeader,
  SectionShell,
} from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function ProblemSection() {
  const { dict } = useI18n();
  const t = dict.problem;

  return (
    <SectionShell muted>
      <SectionHeader title={t.title} description={t.description} />
      <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2">
        {t.items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground sm:text-sm"
          >
            {item}
          </span>
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-2xl text-center text-base text-champagne-soft sm:text-lg">
        {t.closing}
      </p>
    </SectionShell>
  );
}
