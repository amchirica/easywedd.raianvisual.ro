"use client";

import {
  SectionHeader,
  SectionShell,
} from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function PortalSection() {
  const { dict } = useI18n();
  const t = dict.portal;

  return (
    <SectionShell>
      <SectionHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {t.items.map((item) => (
          <article key={item.title} className="surface-card p-5">
            <h3 className="font-heading text-xl text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
