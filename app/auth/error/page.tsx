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
    case "invalid_or_expired_link":
    case "link_expired":
      return "Linkul de confirmare sau resetare este invalid sau a expirat. Solicită un mesaj nou.";
    case "missing_code":
      return "Linkul este incomplet. Solicită un mesaj nou din email.";
    case "email_not_confirmed":
      return "Confirmă adresa de email înainte de autentificare.";
    case "account_suspended":
      return "Contul este suspendat. Contactează suportul.";
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
