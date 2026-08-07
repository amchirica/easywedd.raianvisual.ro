import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { FORGOT_PASSWORD_PATH } from "@/lib/auth/callback-destination";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.meta.authErrorTitle };
}

type PageProps = {
  searchParams: Promise<{ reason?: string }>;
};

function isExpiredOrUsed(reason?: string) {
  return (
    reason === "otp_expired" ||
    reason === "token_not_found" ||
    reason === "access_denied" ||
    reason === "invalid_or_expired_link" ||
    reason === "link_expired" ||
    reason === "recovery_session_missing" ||
    reason === "pkce_code_verifier_not_found" ||
    reason === "missing_token" ||
    reason === "missing_code" ||
    reason === "missing_auth_parameters"
  );
}

function contentForReason(
  auth: Awaited<ReturnType<typeof getDictionary>>["auth"],
  reason?: string,
) {
  if (isExpiredOrUsed(reason)) {
    return {
      title: auth.errorExpiredTitle,
      body: auth.errorExpiredBody,
      showSpam: true,
    };
  }

  if (reason === "email_not_confirmed") {
    return {
      title: auth.errorEmailNotConfirmedTitle,
      body: auth.errorEmailNotConfirmedBody,
      showSpam: true,
    };
  }

  if (reason === "account_suspended") {
    return {
      title: auth.errorSuspendedTitle,
      body: auth.errorSuspendedBody,
      showSpam: false,
    };
  }

  return {
    title: auth.errorGenericTitle,
    body: auth.errorGenericBody,
    showSpam: true,
  };
}

export default async function AuthErrorPage({ searchParams }: PageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { reason } = await searchParams;
  const content = contentForReason(dict.auth, reason);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">{content.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{content.body}</p>
      </div>

      {content.showSpam ? (
        <div
          className="rounded-lg border border-champagne/50 bg-secondary/80 px-4 py-3 text-sm"
          role="status"
        >
          {dict.auth.spamTip}
        </div>
      ) : null}

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
        <Link
          href="/register"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex w-full sm:w-auto",
          )}
        >
          {dict.auth.registerTitle}
        </Link>
      </div>
    </div>
  );
}
