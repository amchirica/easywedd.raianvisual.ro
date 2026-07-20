import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { loginAction } from "@/lib/actions/auth";
import { getSafeNextPath } from "@/lib/url";

export const metadata: Metadata = {
  title: "Autentificare",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
    reason?: string;
    claim?: string;
    reset?: string;
  }>;
};

function callbackErrorMessage(reason?: string) {
  if (reason === "link_expired") {
    return "Linkul a expirat. Solicită un mesaj nou de confirmare sau resetare parolă.";
  }
  if (reason === "exchange_failed" || reason === "missing_code") {
    return "Linkul de confirmare este invalid sau a expirat. Solicită un mesaj nou.";
  }
  if (reason === "recovery_session") {
    return "Sesiunea de resetare lipsește sau a expirat. Cere un link nou de parolă.";
  }
  if (reason === "no_user") {
    return "Nu am putut finaliza autentificarea. Încearcă din nou.";
  }
  if (reason === "account_suspended") {
    return "Contul este suspendat. Contactează suportul.";
  }
  return "Autentificarea a eșuat. Încearcă din nou.";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next ?? null, "/dashboard");

  return (
    <div>
      <h1 className="font-heading text-3xl">Autentificare</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Continuă organizarea nunții în EasyWedd.
      </p>
      {params.reset === "success" ? (
        <p
          className="mb-4 rounded-md border border-champagne/40 bg-secondary px-3 py-2 text-sm"
          role="status"
        >
          Parola a fost schimbată. Te poți autentifica folosind noua parolă.
        </p>
      ) : null}
      {params.error === "auth_callback" ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {callbackErrorMessage(params.reason)}
        </p>
      ) : params.error === "account_suspended" ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Contul este suspendat. Contactează suportul.
        </p>
      ) : params.error ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Autentificarea a eșuat. Încearcă din nou.
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
