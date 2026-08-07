"use client";

import {
  SectionHeader,
  SectionShell,
} from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function TimelineSection() {
  const { dict } = useI18n();
  const t = dict.timeline;

  return (
    <SectionShell id="cum-functioneaza">
      <SectionHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />
      <ol className="mx-auto mt-12 max-w-3xl space-y-3">
        {t.steps.map((step, index) => (
          <li
            key={step.when}
            className="surface-card flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
          >
            <span className="shrink-0 text-xs font-medium tracking-wide text-champagne uppercase sm:w-40">
              {step.when}
            </span>
            <span className="text-sm text-muted-foreground sm:hidden">
              {index + 1}
            </span>
            <p className="font-medium text-foreground">{step.title}</p>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
