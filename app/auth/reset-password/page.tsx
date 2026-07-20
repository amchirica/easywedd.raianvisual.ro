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
        <h1 className="font-heading text-3xl">Link invalid</h1>
        <p className="text-sm text-muted-foreground" role="alert">
          Linkul de resetare este invalid sau a expirat.
        </p>
        <Link
          href={FORGOT_PASSWORD_PATH}
          className={cn(buttonVariants(), "inline-flex")}
        >
          Solicită un link nou
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-3xl">Setează o parolă nouă</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Alege o parolă puternică pentru contul tău EasyWedd.
      </p>
      <ResetPasswordForm />
    </div>
  );
}
