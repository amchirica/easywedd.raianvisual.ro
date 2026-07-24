import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PendingAccountPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center text-center">
      <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
        Cont în așteptare
      </p>
      <h1 className="mt-3 font-heading text-4xl">Acces în curs de aprobare</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Contul tău a fost creat, dar un administrator trebuie să îl aprobe înainte
        să poți folosi platforma. Te vom anunța când accesul este activ.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/pricing" className={cn(buttonVariants())}>
          Vezi planurile
        </Link>
        <Link
          href="/dashboard/billing"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Abonament
        </Link>
      </div>
    </div>
  );
}
