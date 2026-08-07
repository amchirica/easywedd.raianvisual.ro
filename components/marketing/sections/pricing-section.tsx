"use client";

import {
  SectionHeader,
  SectionShell,
} from "@/components/marketing/sections/section-shell";
import { PricingGrid } from "@/components/marketing/pricing-grid";
import { useI18n } from "@/components/providers/i18n-provider";
import type { BillingPlanRow } from "@/lib/billing/plan-catalog";
import { EASYWEDD_PRO_URL } from "@/lib/constants";

type PricingSectionProps = {
  plans: BillingPlanRow[];
};

export function PricingSection({ plans }: PricingSectionProps) {
  const { dict } = useI18n();
  const t = dict.pricing;

  return (
    <SectionShell id="pricing" muted>
      <SectionHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />
      <div className="mt-12">
        <PricingGrid plans={plans} />
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-soft">
        {t.vendorHintPrefix}{" "}
        <a
          href={EASYWEDD_PRO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-champagne-soft underline-offset-4 hover:underline"
        >
          {t.vendorHintLink}
        </a>
        .
      </p>
    </SectionShell>
  );
}
