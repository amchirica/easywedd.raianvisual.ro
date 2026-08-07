import type { Metadata } from "next";
import Link from "next/link";

import {
  SectionHeader,
  SectionShell,
} from "@/components/marketing/sections/section-shell";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return {
    title: dict.meta.featuresTitle,
    description: dict.meta.featuresDescription,
  };
}

export default async function FeaturesPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const t = dict.featuresPage;

  return (
    <>
      <SectionShell className="pt-28">
        <SectionHeader
          eyebrow={t.eyebrow}
          title={t.title}
          description={t.description}
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {t.modules.map((mod) => (
            <article key={mod.title} className="surface-card p-6">
              <h2 className="font-heading text-xl text-foreground">
                {mod.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {mod.description}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            {t.cta}
          </Link>
        </div>
      </SectionShell>
    </>
  );
}
