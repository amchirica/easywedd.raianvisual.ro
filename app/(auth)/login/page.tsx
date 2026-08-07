import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { loginAction } from "@/lib/actions/auth";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getSafeNextPath } from "@/lib/url";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.meta.loginTitle };
}

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
    reason?: string;
    claim?: string;
    reset?: string;
  }>;
};

function callbackErrorMessage(
  errors: {
    linkExpired: string;
    exchangeFailed: string;
    recoverySession: string;
    noUser: string;
    accountSuspended: string;
    generic: string;
  },
  reason?: string,
) {
  if (reason === "link_expired") return errors.linkExpired;
  if (reason === "exchange_failed" || reason === "missing_code") {
    return errors.exchangeFailed;
  }
  if (reason === "recovery_session") return errors.recoverySession;
  if (reason === "no_user") return errors.noUser;
  if (reason === "account_suspended") return errors.accountSuspended;
  return errors.generic;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next ?? null, "/dashboard");
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { auth } = dict;

  return (
    <div>
      <h1 className="font-heading text-3xl">{auth.loginTitle}</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        {auth.loginSubtitle}
      </p>
      {params.reset === "success" ? (
        <p
          className="mb-4 rounded-md border border-champagne/40 bg-secondary px-3 py-2 text-sm"
          role="status"
        >
          {auth.passwordResetSuccess}
        </p>
      ) : null}
      {params.error === "auth_callback" ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {callbackErrorMessage(auth.errors, params.reason)}
        </p>
      ) : params.error === "account_suspended" ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {auth.errors.accountSuspended}
        </p>
      ) : params.error ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {auth.errors.generic}
        </p>
      ) : null}
      <AuthForm
        mode="login"
        action={loginAction}
        nextPath={nextPath}
        claimToken={params.claim}
      />
    </div>
  );
}
