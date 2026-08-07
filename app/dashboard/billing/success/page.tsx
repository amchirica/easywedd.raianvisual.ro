import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.billing.successTitle };
}

export default async function BillingSuccessPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-4xl">{dict.billing.successThanks}</h1>
      <p className="text-sm text-muted-foreground">{dict.billing.successBody}</p>
      <Link href="/dashboard/billing" className={cn(buttonVariants())}>
        {dict.billing.backBilling}
      </Link>
    </div>
  );
}
