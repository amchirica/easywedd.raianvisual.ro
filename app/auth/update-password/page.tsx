import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Actualizează parola",
};

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=auth_callback&reason=recovery_session");
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[linear-gradient(160deg,#f7f4ef_0%,#fffdf9_50%,#efe8dc_100%)] px-6">
      <div className="w-full max-w-md border border-border bg-card p-8">
        <h1 className="font-heading text-3xl">Parolă nouă</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Setează o parolă nouă pentru contul tău EasyWedd.
        </p>
        <div className="mt-6">
          <UpdatePasswordForm />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/dashboard/settings" className="underline underline-offset-4">
            Înapoi la setări
          </Link>
        </p>
      </div>
    </div>
  );
}
