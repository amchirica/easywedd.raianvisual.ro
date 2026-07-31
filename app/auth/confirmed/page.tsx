import type { Metadata } from "next";
import Link from "next/link";

import { AuthAutoRedirect } from "@/components/auth/auth-auto-redirect";
import { buttonVariants } from "@/components/ui/button";
import { getSafeNextPath } from "@/lib/auth/callback-destination";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cont confirmat",
};

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AuthConfirmedPage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  const safeNext = getSafeNextPath(next, "/dashboard/onboarding");
  const destination =
    safeNext === "/dashboard" ? "/dashboard/onboarding" : safeNext;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Cont confirmat cu succes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Adresa ta de email a fost verificată. Contul EasyWedd este acum activ.
        </p>
      </div>

      <AuthAutoRedirect href={destination} seconds={3} />

      <Link
        href={destination}
        className={cn(buttonVariants(), "inline-flex w-full sm:w-auto")}
      >
        Continuă către cont
      </Link>
    </div>
  );
}
