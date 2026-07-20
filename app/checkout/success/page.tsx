import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Plată înregistrată" };

type PageProps = { searchParams: Promise<{ claim?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { claim } = await searchParams;
  let email: string | null = null;
  let status = "pending";

  if (claim) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("pending_checkouts")
        .select("email, status")
        .eq("claim_token", claim)
        .maybeSingle();
      email = data?.email ?? null;
      status = data?.status ?? "pending";
    } catch {
      /* service role may be missing locally */
    }
  }

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-lg flex-col justify-center px-6 py-16">
      <h1 className="font-heading text-4xl">Mulțumim!</h1>
      <p className="mt-4 text-muted-foreground">
        Plata a fost înregistrată. Accesul se activează după confirmarea
        webhook-ului Stripe
        {status === "paid" || status === "fulfilled"
          ? " (confirmată)."
          : " (poate dura câteva secunde)."}
      </p>
      {email ? (
        <p className="mt-2 text-sm">
          Folosește <strong>{email}</strong> pentru a-ți crea sau conecta
          contul.
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={
            claim
              ? `/register?claim=${encodeURIComponent(claim)}`
              : "/register"
          }
          className={cn(buttonVariants())}
        >
          Creează cont
        </Link>
        <Link
          href={
            claim ? `/login?claim=${encodeURIComponent(claim)}` : "/login"
          }
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Autentificare
        </Link>
      </div>
    </div>
  );
}
