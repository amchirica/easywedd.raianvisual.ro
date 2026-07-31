import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { FORGOT_PASSWORD_PATH } from "@/lib/auth/callback-destination";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Link autentificare",
};

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

function contentForReason(reason?: string) {
  if (isExpiredOrUsed(reason)) {
    return {
      title: "Linkul a expirat",
      body: "Acest link nu mai este valabil sau a fost deja utilizat. Solicită un link nou și folosește doar cel mai recent email primit.",
      showSpam: true,
    };
  }

  if (reason === "email_not_confirmed") {
    return {
      title: "Email neconfirmat",
      body: "Confirmă adresa de email folosind linkul primit, apoi autentifică-te.",
      showSpam: true,
    };
  }

  if (reason === "account_suspended") {
    return {
      title: "Cont suspendat",
      body: "Contul este suspendat. Contactează suportul.",
      showSpam: false,
    };
  }

  return {
    title: "Ceva nu a mers",
    body: "Nu am putut finaliza autentificarea. Încearcă din nou sau solicită un link nou.",
    showSpam: true,
  };
}

export default async function AuthErrorPage({ searchParams }: PageProps) {
  const { reason } = await searchParams;
  const content = contentForReason(reason);

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
          Verifică și folderele Spam, Junk sau Promotions. Uneori mesajul poate
          ajunge acolo.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={FORGOT_PASSWORD_PATH}
          className={cn(buttonVariants(), "inline-flex w-full sm:w-auto")}
        >
          Solicită un link nou
        </Link>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex w-full sm:w-auto",
          )}
        >
          Autentificare
        </Link>
        <Link
          href="/register"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex w-full sm:w-auto",
          )}
        >
          Creează cont
        </Link>
      </div>
    </div>
  );
}
