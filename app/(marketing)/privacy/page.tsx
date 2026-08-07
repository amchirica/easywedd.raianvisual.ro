import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return {
    title: dict.meta.privacyTitle,
  };
}

export default async function PrivacyPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const t = dict.legal;

  return (
    <div className="bg-background">
      <article className="mx-auto max-w-3xl px-6 pb-20 pt-28 prose-neutral">
        <h1 className="font-heading text-4xl">{t.privacyTitle}</h1>
        <p className="mt-6 text-muted-foreground">{t.privacyIntro}</p>
        <h2 className="mt-10 font-heading text-2xl">{t.privacyConsentTitle}</h2>
        <p className="mt-3 text-muted-foreground">{t.privacyConsentBody}</p>
        <h2 className="mt-10 font-heading text-2xl">{t.privacyResearchTitle}</h2>
        <p className="mt-3 text-muted-foreground">{t.privacyResearchBody}</p>
      </article>
    </div>
  );
}
