import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getCurrentUserContext } from "@/lib/workspace";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.onboarding.title };
}

export default async function OnboardingPage() {
  const { user, profile } = await getCurrentUserContext();

  if (!user) {
    redirect("/login");
  }

  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-10">
        <h1 className="font-heading text-4xl">{dict.onboarding.title}</h1>
        <p className="mt-3 text-muted-foreground">
          {dict.onboarding.subtitle}
        </p>
      </header>
      <OnboardingForm />
    </div>
  );
}
