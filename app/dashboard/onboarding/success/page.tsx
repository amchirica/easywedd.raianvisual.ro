import type { Metadata } from "next";
import Link from "next/link";

import { RaianVisualPromo } from "@/components/marketing/raian-visual-promo";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUserContext } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Onboarding finalizat",
};

export default async function OnboardingSuccessPage() {
  const ctx = await getCurrentUserContext();
  const workspaceId = ctx.activeWorkspace?.id ?? null;
  const weddingDate = ctx.wedding?.wedding_date ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      <div>
        <h1 className="font-heading text-4xl tracking-tight">
          Spațiul nunții este gata
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Ai finalizat onboarding-ul. Poți continua în dashboard pentru a
          organiza invitații, bugetul și restul detaliilor.
        </p>
      </div>

      <RaianVisualPromo
        variant="card"
        source="onboarding"
        workspaceId={workspaceId}
        weddingDate={weddingDate}
      />

      <Link
        href="/dashboard"
        className={cn(buttonVariants(), "inline-flex w-full sm:w-auto")}
      >
        Continuă către dashboard
      </Link>
    </div>
  );
}
