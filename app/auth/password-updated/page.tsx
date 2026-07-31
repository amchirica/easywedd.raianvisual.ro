import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Parolă actualizată",
};

export default function AuthPasswordUpdatedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Parola a fost schimbată</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Parola contului tău EasyWedd a fost actualizată cu succes. Te poți
          autentifica folosind noua parolă.
        </p>
      </div>

      <Link
        href="/login"
        className={cn(buttonVariants(), "inline-flex w-full sm:w-auto")}
      >
        Autentificare
      </Link>
    </div>
  );
}
