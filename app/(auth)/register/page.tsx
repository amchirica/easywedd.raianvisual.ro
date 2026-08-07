import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getSafeNextPath } from "@/lib/url";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.meta.registerTitle };
}

type RegisterPageProps = {
  searchParams: Promise<{ next?: string; claim?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next ?? null, "/dashboard/onboarding");
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <div>
      <h1 className="font-heading text-3xl">{dict.auth.registerTitle}</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        {dict.auth.registerSubtitle}
      </p>
      <RegisterForm nextPath={nextPath} claimToken={params.claim} />
    </div>
  );
}
