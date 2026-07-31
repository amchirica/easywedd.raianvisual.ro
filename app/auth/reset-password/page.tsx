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
        <h1 className="font-heading text-3xl">Sesiune lipsă</h1>
        <p className="text-sm text-muted-foreground" role="alert">
          Sesiunea de resetare lipsește sau a expirat.
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
