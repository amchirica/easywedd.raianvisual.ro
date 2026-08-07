import type { Metadata } from "next";
import Link from "next/link";

import { AuthAutoRedirect } from "@/components/auth/auth-auto-redirect";
import { buttonVariants } from "@/components/ui/button";
import { getSafeNextPath } from "@/lib/auth/callback-destination";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.meta.confirmedTitle };
}

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AuthConfirmedPage({ searchParams }: PageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { next } = await searchParams;
  const safeNext = getSafeNextPath(next, "/dashboard/onboarding");
  const destination =
    safeNext === "/dashboard" ? "/dashboard/onboarding" : safeNext;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">{dict.auth.confirmedHeading}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {dict.auth.confirmedBody}
        </p>
      </div>

      <AuthAutoRedirect href={destination} seconds={3} />

      <Link
        href={destination}
        className={cn(buttonVariants(), "inline-flex w-full sm:w-auto")}
      >
        {dict.auth.continueToAccount}
      </Link>
    </div>
  );
}
