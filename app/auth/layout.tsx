import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { PreferenceControls } from "@/components/shared/preference-controls";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";

export default async function AuthPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <div className="relative flex min-h-[100svh] flex-col bg-background">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_10%_10%,rgba(196,165,116,0.25),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(42,36,32,0.08),transparent_35%)]" />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="mb-8 flex items-start justify-between gap-4">
          <BrandLogo
            href="/"
            size={32}
            priority
            lightPad
            wordmarkClassName="text-3xl text-foreground"
          />
          <PreferenceControls compact />
        </div>
        <div className="border border-border bg-card/90 p-6 shadow-[0_20px_60px_-40px_rgba(42,36,32,0.45)] backdrop-blur sm:p-8">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            {dict.common.backToSite}
          </Link>
        </p>
      </div>
    </div>
  );
}
