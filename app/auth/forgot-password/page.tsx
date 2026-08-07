import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.meta.forgotTitle };
}

export default async function AuthForgotPasswordPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <div>
      <h1 className="font-heading text-3xl">{dict.auth.forgotTitle}</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        {dict.auth.forgotSubtitle}
      </p>
      <AuthForm mode="forgot" action={forgotPasswordAction} />
    </div>
  );
}
