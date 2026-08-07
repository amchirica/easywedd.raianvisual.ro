"use client";

import {
  SectionHeader,
  SectionShell,
} from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function CoupleSection() {
  const { dict } = useI18n();
  const t = dict.couple;

  return (
    <SectionShell muted>
      <SectionHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />
      <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {t.cards.map((card) => (
          <div key={card.title} className="surface-card px-4 py-4 text-sm text-foreground">
            <p className="font-medium">{card.title}</p>
            <p className="mt-1.5 text-muted-foreground">{card.body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
