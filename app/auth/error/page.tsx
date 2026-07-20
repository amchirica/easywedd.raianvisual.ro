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
  if (reason === "invalid_or_expired_link" || reason === "link_expired") {
    return "Linkul de resetare este invalid sau a expirat.";
  }
  if (reason === "missing_code") {
    return "Linkul este incomplet. Solicită un mesaj nou.";
  }
  return "Nu am putut finaliza autentificarea. Încearcă din nou.";
}

export default async function AuthErrorPage({ searchParams }: PageProps) {
  const { reason } = await searchParams;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl">Ceva nu a mers</h1>
      <p className="text-sm text-muted-foreground" role="alert">
        {messageForReason(reason)}
      </p>
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
      </div>
    </div>
  );
}
