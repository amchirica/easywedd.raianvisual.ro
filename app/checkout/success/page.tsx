import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.billing.checkoutRecordedTitle };
}

type PageProps = { searchParams: Promise<{ claim?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
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
      <h1 className="font-heading text-4xl">{dict.billing.checkoutThanks}</h1>
      <p className="mt-4 text-muted-foreground">
        {dict.billing.checkoutRecordedBody}
        {status === "paid" || status === "fulfilled"
          ? dict.billing.checkoutConfirmed
          : dict.billing.checkoutPendingHint}
      </p>
      {email ? (
        <p className="mt-2 text-sm">
          {dict.billing.checkoutUseEmail.replace("{email}", email)}
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
          {dict.billing.createAccount}
        </Link>
        <Link
          href={
            claim ? `/login?claim=${encodeURIComponent(claim)}` : "/login"
          }
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {dict.billing.login}
        </Link>
      </div>
    </div>
  );
}
