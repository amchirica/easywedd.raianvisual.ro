import type { Metadata } from "next";

import { PricingGrid } from "@/components/marketing/pricing-grid";
import {
  SectionHeader,
  SectionShell,
} from "@/components/marketing/sections/section-shell";
import { listPublicBillingPlans } from "@/lib/billing/plan-catalog";
import { EASYWEDD_PRO_URL } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return {
    title: dict.meta.pricingTitle,
    description: dict.meta.pricingDescription,
  };
}

export default async function PricingPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const t = dict.pricing;
  const plans = await listPublicBillingPlans();

  return (
    <SectionShell className="pt-28" muted>
      <SectionHeader
        eyebrow={t.eyebrow}
        title={t.pageTitle}
        description={t.pageDescription}
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
