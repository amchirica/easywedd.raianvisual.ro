import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return {
    title: dict.meta.termsTitle,
  };
}

export default async function TermsPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const t = dict.legal;

  return (
    <div className="bg-background">
      <article className="mx-auto max-w-3xl px-6 pb-20 pt-28">
        <h1 className="font-heading text-4xl">{t.termsTitle}</h1>
        <p className="mt-6 text-muted-foreground">{t.termsIntro}</p>
      </article>
    </div>
  );
}
