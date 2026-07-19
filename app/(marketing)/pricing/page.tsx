import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { PLAN_CATALOG } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Prețuri",
};

export default function PricingPage() {
  const plans = (["trial", "starter", "essentials", "premium"] as const).map(
    (key) => ({ key, ...PLAN_CATALOG[key] }),
  );

  return (
    <div className="bg-[linear-gradient(160deg,#f7f4ef_0%,#fffdf9_50%,#efe8dc_100%)]">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-28">
        <header className="max-w-2xl">
          <h1 className="font-heading text-4xl md:text-5xl">Prețuri</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Plățile Stripe sunt pregătite tehnic, dar nu sunt activate în această
            etapă. Poți începe cu trial.
          </p>
        </header>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <article
              key={plan.key}
              className="flex flex-col border border-border bg-card p-6"
            >
              <h2 className="font-heading text-2xl">{plan.name}</h2>
              <p className="mt-3 text-3xl font-medium tracking-tight">
                {plan.monthlyPriceRon == null
                  ? "Gratuit"
                  : `${plan.monthlyPriceRon} RON`}
                {plan.monthlyPriceRon != null ? (
                  <span className="text-base font-normal text-muted-foreground">
                    /lună
                  </span>
                ) : null}
              </p>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <Link
                href="/register"
                className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
              >
                Începe
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
