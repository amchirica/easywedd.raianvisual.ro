import type { Metadata } from "next";

import { CheckEmailClient } from "@/components/auth/check-email-client";
import { getPendingSignupEmail } from "@/lib/actions/auth";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.meta.checkEmailTitle };
}

export default async function CheckEmailPage() {
  const email = await getPendingSignupEmail();

  return <CheckEmailClient initialEmail={email} />;
}
