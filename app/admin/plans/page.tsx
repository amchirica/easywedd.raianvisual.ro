import type { Metadata } from "next";

import { AdminBillingPlanStripeForm } from "@/components/admin/admin-billing-plan-form";
import { listAllBillingPlans } from "@/lib/billing/plan-catalog";
import {
  isValidStripePriceId,
  isValidStripeProductId,
} from "@/lib/billing/stripe-ids";

export const metadata: Metadata = { title: "Planuri billing" };

export default async function AdminBillingPlansPage() {
  const plans = await listAllBillingPlans();
  const paid = plans.filter(
    (p) => p.billing_type === "subscription" || p.billing_type === "one_time",
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-4xl">Planuri billing</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Product ID (<code>prod_…</code>) și Price ID (<code>price_…</code>) sunt
          câmpuri separate. Checkout folosește doar Price ID. Nu pune niciodată
          un Product ID în câmpul Price.
        </p>
      </header>

      <section className="overflow-x-auto border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2">Product ID</th>
              <th className="px-3 py-2">Price ID</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {paid.map((plan) => {
              const productOk =
                !plan.stripe_product_id ||
                isValidStripeProductId(plan.stripe_product_id);
              const priceOk = isValidStripePriceId(plan.stripe_price_id);
              return (
                <tr key={plan.key} className="border-b border-border">
                  <td className="px-3 py-2">
                    <div className="font-medium">{plan.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {plan.key}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {plan.stripe_product_id ?? "—"}
                    {!productOk ? (
                      <span className="ml-2 text-destructive">invalid</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {plan.stripe_price_id ?? "—"}
                    {!priceOk ? (
                      <span className="ml-2 text-destructive">
                        lipsește / invalid
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    {priceOk ? (
                      <span className="text-xs text-muted-foreground">
                        ready
                      </span>
                    ) : (
                      <span className="text-xs text-destructive">
                        checkout blocked
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl">Editare ID-uri</h2>
        {paid.map((plan) => (
          <AdminBillingPlanStripeForm
            key={plan.key}
            planKey={plan.key}
            planName={plan.name}
            stripeProductId={plan.stripe_product_id}
            stripePriceId={plan.stripe_price_id}
            stripePriceEnv={plan.stripe_price_env}
          />
        ))}
      </section>
    </div>
  );
}
