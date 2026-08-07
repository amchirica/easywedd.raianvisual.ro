"use client";

import {
  SectionHeader,
  SectionShell,
} from "@/components/marketing/sections/section-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { buttonVariants } from "@/components/ui/button";
import { EASYWEDD_PRO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ProCtaSection() {
  const { dict } = useI18n();
  const t = dict.proCta;

  return (
    <SectionShell muted>
      <div className="surface-card mx-auto max-w-4xl px-8 py-14 text-center">
        <SectionHeader
          eyebrow={dict.navigation.pro}
          title={t.title}
          description={t.description}
        />
        <a
          href={EASYWEDD_PRO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "mt-8 inline-flex")}
        >
          {t.cta}
        </a>
      </div>
    </SectionShell>
  );
}
