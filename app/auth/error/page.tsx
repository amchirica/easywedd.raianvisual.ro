import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { FORGOT_PASSWORD_PATH } from "@/lib/auth/callback-destination";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Eroare autentificare",
};

type PageProps = {
  searchParams: Promise<{ reason?: string }>;
};

function messageForReason(reason?: string) {
  switch (reason) {
    case "missing_auth_parameters":
    case "missing_code":
    case "missing_token":
      return "Linkul este incomplet. Actualizează template-urile Supabase să folosească token_hash, apoi solicită un mesaj nou.";
    case "pkce_code_verifier_not_found":
      return "Linkul vechi (PKCE) nu funcționează din Gmail/Safari. În Supabase → Emails → Templates înlocuiește ConfirmationURL cu linkul token_hash, apoi solicită un email nou.";
    case "otp_expired":
      return "Codul din email a expirat. Solicită un link nou.";
    case "token_not_found":
      return "Tokenul din link nu a fost găsit. Solicită un mesaj nou.";
    case "access_denied":
      return "Acces refuzat pentru acest link. Solicită un mesaj nou.";
    case "invalid_or_expired_link":
    case "link_expired":
      return "Linkul este invalid, a expirat sau a fost deja utilizat.";
    case "auth_confirmation_failed":
      return "Confirmarea autentificării a eșuat. Încearcă din nou.";
    case "email_not_confirmed":
      return "Confirmă adresa de email folosind linkul primit, apoi autentifică-te.";
    case "account_suspended":
      return "Contul este suspendat. Contactează suportul.";
    case "recovery_session_missing":
      return "Sesiunea de resetare lipsește sau a expirat. Solicită un link nou.";
    default:
      return "Nu am putut finaliza autentificarea. Încearcă din nou sau solicită un link nou.";
  }
}

export default async function AuthErrorPage({ searchParams }: PageProps) {
  const { reason } = await searchParams;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl">Ceva nu a mers</h1>
      <p className="text-sm text-muted-foreground" role="alert">
        {messageForReason(reason)}
      </p>
      {reason ? (
        <p className="text-xs text-muted-foreground">Motiv: {reason}</p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Link
          href={FORGOT_PASSWORD_PATH}
          className={cn(buttonVariants(), "inline-flex")}
        >
          Solicită un link nou
        </Link>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
        >
          Autentificare
        </Link>
        <Link
          href="/register"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
        >
          Creează cont
        </Link>
      </div>
    </div>
  );
}
