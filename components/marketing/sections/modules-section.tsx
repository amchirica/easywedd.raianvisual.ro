"use client";

import {
  SectionHeader,
  SectionShell,
} from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";

export function ModulesSection() {
  const { dict } = useI18n();
  const t = dict.modules;

  return (
    <SectionShell id="functii">
      <SectionHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.items.map((mod) => (
          <article key={mod.title} className="surface-card p-5">
            <h3 className="font-heading text-xl text-foreground">{mod.title}</h3>
            <ul className="mt-3 space-y-1.5">
              {mod.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-champagne" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
