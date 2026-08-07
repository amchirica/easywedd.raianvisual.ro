"use client";

import {
  SectionHeader,
  SectionShell,
} from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function FaqSection() {
  const { dict } = useI18n();
  const t = dict.faq;

  return (
    <SectionShell id="faq">
      <SectionHeader eyebrow={t.eyebrow} title={t.title} />
      <div className="mx-auto mt-10 max-w-3xl space-y-3">
        {t.items.map((item) => (
          <details
            key={item.q}
            className="surface-card group px-5 py-4 open:pb-5"
          >
            <summary className="cursor-pointer list-none font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {item.q}
                <span className="text-champagne transition group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}
