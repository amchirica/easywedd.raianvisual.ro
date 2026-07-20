import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { listPublicBillingPlans } from "@/lib/billing/plan-catalog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Prețuri",
};

export default async function PricingPage() {
  const plans = await listPublicBillingPlans();
  const display = plans.filter((p) => p.key !== "trial");

  return (
    <div className="bg-[linear-gradient(160deg,#f7f4ef_0%,#fffdf9_50%,#efe8dc_100%)]">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-28">
        <header className="max-w-2xl">
          <h1 className="font-heading text-4xl md:text-5xl">Prețuri</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Alege un plan și plătește online — chiar dacă nu ai încă cont
            EasyWedd. Accesul se activează după confirmarea Stripe.
          </p>
        </header>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {display.map((plan) => (
            <article
              key={plan.key}
              className="flex flex-col border border-border bg-card p-6"
            >
              <h2 className="font-heading text-2xl">{plan.name}</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <ul className="mt-4 flex-1 space-y-1 text-sm text-muted-foreground">
                <li>Invitați: până la {plan.guest_limit}</li>
                <li>
                  Website public: {plan.website_publishing ? "Da" : "Nu"}
                </li>
                <li>Export PDF: {plan.pdf_export ? "Da" : "Nu"}</li>
                <li>Analytics: {plan.analytics ? "Da" : "Nu"}</li>
              </ul>
              {plan.billing_type === "grant" ? (
                <Link
                  href="/register"
                  className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
                >
                  Contactează-ne
                </Link>
              ) : (
                <Link
                  href={`/checkout/${plan.key}`}
                  className={cn(buttonVariants(), "mt-6")}
                >
                  Cumpără
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
