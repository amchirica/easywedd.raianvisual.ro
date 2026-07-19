import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Plată reușită" };

export default function BillingSuccessPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-4xl">Mulțumim</h1>
      <p className="text-sm text-muted-foreground">
        Plata a fost procesată. Entitlement-urile se sincronizează prin webhook.
      </p>
      <Link href="/dashboard/billing" className={cn(buttonVariants())}>
        Înapoi la abonament
      </Link>
    </div>
  );
}
