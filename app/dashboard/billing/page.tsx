import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import {
  grantLocalPassAction,
  openBillingPortalAction,
  startCheckoutAction,
} from "@/lib/actions/billing";
import { BILLING_PRODUCTS } from "@/lib/billing/catalog";
import { featureFlagsForUi } from "@/lib/entitlements/ui";
import { getWorkspaceEntitlementSnapshot } from "@/lib/entitlements/service";
import { PLAN_CATALOG, isStripeConfigured } from "@/lib/stripe";
import { requireWeddingContext } from "@/lib/planner/context";

export const metadata: Metadata = { title: "Abonament" };

export default async function BillingPage() {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-4xl">Abonament</h1>
        <p className="text-sm text-muted-foreground">{ctx.error}</p>
      </div>
    );
  }

  const { data: subscription } = await ctx.context.supabase
    .from("subscriptions")
    .select("*")
    .eq("workspace_id", ctx.context.workspaceId)
    .maybeSingle();

  const snapshot = await getWorkspaceEntitlementSnapshot(ctx.context.workspaceId);
  const flags = featureFlagsForUi(snapshot.rows);
  const planKey = subscription?.plan ?? "trial";
  const plan = PLAN_CATALOG[planKey];
  const stripeReady = isStripeConfigured();

  const checkoutable = [
    BILLING_PRODUCTS.starter,
    BILLING_PRODUCTS.premium_pass_12,
    BILLING_PRODUCTS.premium_pass_18,
    BILLING_PRODUCTS.pro,
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-4xl">Abonament</h1>
        <p className="mt-2 text-muted-foreground">
          Stripe checkout, portal și Premium Wedding Pass (12/18 luni).
        </p>
      </header>

      <section className="border border-border bg-card p-6">
        <h2 className="font-heading text-2xl">{plan.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{subscription?.status ?? "trialing"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Product</dt>
            <dd>{subscription?.product_key ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Acces până la</dt>
            <dd>
              {subscription?.access_ends_at
                ? new Date(subscription.access_ends_at).toLocaleDateString("ro-RO")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Stripe</dt>
            <dd>{stripeReady ? "Configurat" : "Neconfigurat (mod local)"}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>website publish: {flags.canPublishWebsite ? "da" : "nu"}</span>
          <span>· pdf: {flags.canExportPdf ? "da" : "nu"}</span>
          <span>· guests: {flags.guestLimit ?? "∞"}</span>
        </div>
        {stripeReady ? (
          <form action={openBillingPortalAction} className="mt-6">
            <Button type="submit" variant="outline">
              Customer portal
            </Button>
          </form>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl">Upgrade</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {checkoutable.map((product) => (
            <div key={product.key} className="border border-border p-4">
              <h3 className="font-heading text-xl">{product.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {product.description}
              </p>
              <p className="mt-3 text-sm">
                {product.monthlyPriceRon != null
                  ? `${product.monthlyPriceRon} RON / lună`
                  : product.oneTimePriceRon != null
                    ? `${product.oneTimePriceRon} RON o singură dată`
                    : "—"}
              </p>
              {stripeReady ? (
                <form
                  action={startCheckoutAction.bind(null, product.key)}
                  className="mt-4"
                >
                  <Button type="submit">Checkout</Button>
                </form>
              ) : (
                <form
                  action={grantLocalPassAction.bind(null, product.key)}
                  className="mt-4"
                >
                  <Button type="submit" variant="outline">
                    Activează local (dev)
                  </Button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
