import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.pending.title };
}

export default async function PendingAccountPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center text-center">
      <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
        {dict.pending.title}
      </p>
      <h1 className="mt-3 font-heading text-4xl">{dict.pending.heading}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {dict.pending.body}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/pricing" className={cn(buttonVariants())}>
          {dict.pending.viewPlans}
        </Link>
        <Link
          href="/dashboard/billing"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {dict.pending.billing}
        </Link>
      </div>
    </div>
  );
}
