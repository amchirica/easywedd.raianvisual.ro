import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import {
  grantLocalPassAction,
  openBillingPortalAction,
  startCheckoutAction,
} from "@/lib/actions/billing";
import type { BillingProductKey } from "@/lib/billing/catalog";
import {
  ACCESS_SOURCE_LABELS,
  FALLBACK_BILLING_PLANS,
  listPublicBillingPlans,
} from "@/lib/billing/plan-catalog";
import { featureFlagsForUi } from "@/lib/entitlements/ui";
import { getWorkspaceEntitlementSnapshot } from "@/lib/entitlements/service";
import { isStripeConfigured } from "@/lib/billing/plans";
import { requireWeddingContext } from "@/lib/planner/context";

export const metadata: Metadata = { title: "Abonament" };

const CHECKOUTABLE_KEYS = new Set([
  "starter",
  "premium_pass_12",
  "premium_pass_18",
  "pro",
]);

type PageProps = {
  searchParams?: Promise<{ checkout_error?: string }>;
};

export default async function BillingPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const checkoutError = params.checkout_error
    ? decodeURIComponent(params.checkout_error)
    : null;

  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-4xl">Abonament</h1>
        <p className="text-sm text-muted-foreground">{ctx.error}</p>
      </div>
    );
  }

  const [{ data: subscription }, plans, snapshot] = await Promise.all([
    ctx.context.supabase
      .from("subscriptions")
      .select(
        "id, workspace_id, plan_key, product_key, plan, status, access_source, access_ends_at, soft_deleted_at",
      )
      .eq("workspace_id", ctx.context.workspaceId)
      .is("soft_deleted_at", null)
      .maybeSingle(),
    listPublicBillingPlans(),
    getWorkspaceEntitlementSnapshot(ctx.context.workspaceId),
  ]);
  const flags = featureFlagsForUi(snapshot.rows);
  const planKey =
    subscription?.plan_key ??
    subscription?.product_key ??
    subscription?.plan ??
    "trial";
  const plan =
    plans.find((p) => p.key === planKey) ??
    FALLBACK_BILLING_PLANS.find((p) => p.key === planKey) ??
    plans[0];
  const stripeReady = isStripeConfigured();
  const checkoutable = plans.filter((p) => CHECKOUTABLE_KEYS.has(p.key));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-4xl">Abonament</h1>
        <p className="mt-2 text-muted-foreground">
          Planuri din catalogul EasyWedd · Stripe checkout și portal.
        </p>
      </header>

      {checkoutError ? (
        <div
          role="alert"
          className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {checkoutError}
        </div>
      ) : null}

      <section className="border border-border bg-card p-6">
        <h2 className="font-heading text-2xl">{plan?.name ?? planKey}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {plan?.description ?? ""}
        </p>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{subscription?.status ?? "trialing"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Sursă acces</dt>
            <dd>
              {ACCESS_SOURCE_LABELS[subscription?.access_source ?? "trial"] ??
                subscription?.access_source ??
                "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Plan key</dt>
            <dd>{planKey}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Acces până la</dt>
            <dd>
              {subscription?.access_ends_at
                ? new Date(subscription.access_ends_at).toLocaleDateString(
                    "ro-RO",
                  )
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
              <p className="mt-3 text-sm text-muted-foreground">
                {product.billing_type === "subscription"
                  ? "Abonament lunar"
                  : product.access_months
                    ? `${product.access_months} luni · plată unică`
                    : "Plată unică"}
              </p>
              {stripeReady ? (
                <form
                  action={startCheckoutAction.bind(
                    null,
                    product.key as BillingProductKey,
                  )}
                  className="mt-4"
                >
                  <Button type="submit">Checkout</Button>
                </form>
              ) : (
                <form
                  action={grantLocalPassAction.bind(
                    null,
                    product.key as BillingProductKey,
                  )}
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
