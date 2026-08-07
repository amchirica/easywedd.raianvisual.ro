"use client";

import {
  SectionHeader,
  SectionShell,
} from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function CircularSection() {
  const { dict } = useI18n();
  const t = dict.circular;
  const nodes = [t.couples, dict.hero.brand, t.pro, t.event];

  return (
    <SectionShell>
      <SectionHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />
      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-3 text-sm">
        {nodes.map((node, i) => (
          <div key={node} className="flex items-center gap-3">
            {i > 0 ? (
              <span className="text-champagne/60" aria-hidden>
                →
              </span>
            ) : null}
            <span className="surface-card px-4 py-2 text-foreground">{node}</span>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
