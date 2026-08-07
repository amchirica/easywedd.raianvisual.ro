import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { buttonVariants } from "@/components/ui/button";
import { FORGOT_PASSWORD_PATH } from "@/lib/auth/callback-destination";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.meta.resetPasswordTitle };
}

export default async function AuthResetPasswordPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl">{dict.auth.resetExpiredTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {dict.auth.resetExpiredBody}
          </p>
        </div>
        <div
          className="rounded-lg border border-champagne/50 bg-secondary/80 px-4 py-3 text-sm"
          role="status"
        >
          {dict.auth.spamTip}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={FORGOT_PASSWORD_PATH}
            className={cn(buttonVariants(), "inline-flex w-full sm:w-auto")}
          >
            {dict.auth.requestNewLink}
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex w-full sm:w-auto",
            )}
          >
            {dict.auth.loginTitle}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-3xl">{dict.auth.resetTitle}</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        {dict.auth.resetSubtitle}
      </p>
      <ResetPasswordForm />
    </div>
  );
}
