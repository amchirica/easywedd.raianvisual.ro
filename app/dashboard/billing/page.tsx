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
import { formatDateShort } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getStatusLabel } from "@/lib/i18n/status-labels";
import { requireWeddingContext } from "@/lib/planner/context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.billing.title };
}

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
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const params = searchParams ? await searchParams : {};
  const checkoutError = params.checkout_error
    ? decodeURIComponent(params.checkout_error)
    : null;

  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-4xl">{dict.billing.title}</h1>
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
        <h1 className="font-heading text-4xl">{dict.billing.title}</h1>
        <p className="mt-2 text-muted-foreground">{dict.billing.subtitle}</p>
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
            <dd>{getStatusLabel("billing", subscription?.status ?? "trialing", locale) || (subscription?.status ?? "trialing")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{dict.billing.accessSource}</dt>
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
            <dt className="text-muted-foreground">{dict.billing.accessUntil}</dt>
            <dd>
              {subscription?.access_ends_at
                ? formatDateShort(subscription.access_ends_at, locale)
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
              {dict.billing.manage}
            </Button>
          </form>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl">{dict.billing.upgrade}</h2>
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
