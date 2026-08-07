import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.meta.passwordUpdatedTitle };
}

export default async function AuthPasswordUpdatedPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">
          {dict.auth.passwordUpdatedHeading}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {dict.auth.passwordUpdatedBody}
        </p>
      </div>

      <Link
        href="/login"
        className={cn(buttonVariants(), "inline-flex w-full sm:w-auto")}
      >
        {dict.auth.loginTitle}
      </Link>
    </div>
  );
}
