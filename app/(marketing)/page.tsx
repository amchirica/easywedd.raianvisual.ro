import type { Metadata } from "next";

import { CircularSection } from "@/components/marketing/sections/circular-section";
import { CoupleSection } from "@/components/marketing/sections/couple-section";
import { EcosystemSection } from "@/components/marketing/sections/ecosystem-section";
import { FaqSection } from "@/components/marketing/sections/faq-section";
import { FinalCtaSection } from "@/components/marketing/sections/final-cta-section";
import { HeroSection } from "@/components/marketing/sections/hero-section";
import { ModulesSection } from "@/components/marketing/sections/modules-section";
import { PortalSection } from "@/components/marketing/sections/portal-section";
import { PricingSection } from "@/components/marketing/sections/pricing-section";
import { ProblemSection } from "@/components/marketing/sections/problem-section";
import { ProCtaSection } from "@/components/marketing/sections/pro-cta-section";
import { TimelineSection } from "@/components/marketing/sections/timeline-section";
import { VendorsSection } from "@/components/marketing/sections/vendors-section";
import { RaianVisualPromo } from "@/components/marketing/raian-visual-promo";
import { listPublicBillingPlans } from "@/lib/billing/plan-catalog";
import { APP_NAME } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { PRODUCTION_SITE_URL as SITE_FALLBACK } from "@/lib/url";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return {
    title: {
      absolute: dict.meta.homeTitle,
    },
    description: dict.meta.homeDescription,
    keywords: [
      "organizare nuntă",
      "aplicație organizare nuntă",
      "wedding planner online",
      "buget nuntă",
      "listă invitați nuntă",
      "seating plan",
      "furnizori nuntă",
      "checklist nuntă",
      "invitație digitală",
      "planificare nuntă România",
    ],
    alternates: {
      canonical: "/",
    },
  };
}

function siteOrigin() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    SITE_FALLBACK;
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).origin;
  } catch {
    return SITE_FALLBACK;
  }
}

export default async function HomePage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const plans = await listPublicBillingPlans();
  const origin = siteOrigin();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: APP_NAME,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      description: dict.meta.homeDescription,
      url: origin,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "RON",
        description: dict.common.free,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: APP_NAME,
      url: origin,
      logo: `${origin}/brand/raian-mark.png`,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <ProblemSection />
      <ModulesSection />
      <VendorsSection />
      <TimelineSection />
      <CoupleSection />
      <PortalSection />
      <EcosystemSection />
      <CircularSection />
      <PricingSection plans={plans} />
      <FaqSection />
      <ProCtaSection />
      <RaianVisualPromo variant="full-section" source="landing" />
      <FinalCtaSection />
    </>
  );
}
