import type { Metadata } from "next";
import Link from "next/link";

import { RaianVisualPromo } from "@/components/marketing/raian-visual-promo";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getCurrentUserContext } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.onboarding.successTitle };
}

export default async function OnboardingSuccessPage() {
  const ctx = await getCurrentUserContext();
  const workspaceId = ctx.activeWorkspace?.id ?? null;
  const weddingDate = ctx.wedding?.wedding_date ?? null;
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      <div>
        <h1 className="font-heading text-4xl tracking-tight">
          {dict.onboarding.successTitle}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {dict.onboarding.successBody}
        </p>
      </div>

      <RaianVisualPromo
        variant="card"
        source="onboarding"
        workspaceId={workspaceId}
        weddingDate={weddingDate}
      />

      <Link
        href="/dashboard"
        className={cn(buttonVariants(), "inline-flex w-full sm:w-auto")}
      >
        {dict.onboarding.goDashboard}
      </Link>
    </div>
  );
}
