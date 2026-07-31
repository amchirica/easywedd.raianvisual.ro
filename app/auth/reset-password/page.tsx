import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { buttonVariants } from "@/components/ui/button";
import { FORGOT_PASSWORD_PATH } from "@/lib/auth/callback-destination";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Setează o parolă nouă",
};

export default async function AuthResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl">Linkul a expirat</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acest link nu mai este valabil sau a fost deja utilizat. Solicită un
            link nou și folosește doar cel mai recent email primit.
          </p>
        </div>
        <div
          className="rounded-lg border border-champagne/50 bg-secondary/80 px-4 py-3 text-sm"
          role="status"
        >
          Verifică și folderele Spam, Junk sau Promotions. Uneori mesajul poate
          ajunge acolo.
        </div>
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
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-3xl">Setează o parolă nouă</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Introdu parola nouă (minim 8 caractere) și confirm-o. După salvare te
        poți autentifica.
      </p>
      <ResetPasswordForm />
    </div>
  );
}
