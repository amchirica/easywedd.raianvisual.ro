import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { BILLING_PRODUCTS } from "@/lib/billing/catalog";
import { isStripeConfigured } from "@/lib/billing/plans";
import { isValidStripePriceId } from "@/lib/billing/stripe-ids";
import {
  getRuntimeEnv,
  getRuntimeEnvDiagnostics,
  getRuntimeEnvSourceFlags,
  hydrateRuntimeEnvAsync,
  RUNTIME_ENV_KEYS,
  STRIPE_PRICE_ENV_BY_PRODUCT,
} from "@/lib/runtime-env";

export const metadata: Metadata = {
  title: "Runtime env diagnostics",
};

export const dynamic = "force-dynamic";

/**
 * Admin-only runtime env diagnostics for Cloudflare / OpenNext.
 * present + length only — never secret values.
 */
export default async function AdminRuntimeEnvDiagnosticsPage() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    notFound();
  }

  await hydrateRuntimeEnvAsync();
  const rows = getRuntimeEnvDiagnostics(RUNTIME_ENV_KEYS);
  const stripeReady = isStripeConfigured();
  const sourceFlags = getRuntimeEnvSourceFlags();

  const priceMapping = (
    Object.entries(STRIPE_PRICE_ENV_BY_PRODUCT) as Array<
      [keyof typeof STRIPE_PRICE_ENV_BY_PRODUCT, string]
    >
  ).map(([productKey, envKey]) => {
    const catalogEnv = BILLING_PRODUCTS[productKey].envPriceId;
    const value = getRuntimeEnv(envKey);
    const valid = isValidStripePriceId(value);
    return {
      productKey,
      envKey,
      catalogEnvMatches: catalogEnv === envKey,
      present: Boolean(value),
      length: value?.length ?? 0,
      looksLikePriceId: valid,
      prefix: valid && value ? `${value.slice(0, 6)}…` : "—",
    };
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl">Runtime env diagnostics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Doar admin. present / length — niciodată valorile secrete. Worker:
          easywedd-raianvisual.
        </p>
      </header>

      <p className="font-mono text-sm">
        isStripeConfigured(): {stripeReady ? "true" : "false"}
      </p>
      <p className="font-mono text-xs text-muted-foreground">
        alsContext={sourceFlags.hasAlsContext ? "true" : "false"} ·
        serviceRole={sourceFlags.serviceRolePresent ? "true" : "false"} ·
        supabaseUrl={sourceFlags.supabaseUrlPresent ? "true" : "false"} ·
        anon={sourceFlags.supabaseAnonPresent ? "true" : "false"}
      </p>

      <section className="space-y-2">
        <h2 className="font-heading text-xl">Env presence</h2>
        <dl className="divide-y divide-border border border-border text-sm">
          {rows.map((row) => (
            <div
              key={row.key}
              className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(14rem,22rem)_1fr_4rem]"
            >
              <dt className="font-mono text-xs text-muted-foreground">
                {row.key}
              </dt>
              <dd className="font-mono text-xs">
                present={row.present ? "true" : "false"}
              </dd>
              <dd className="font-mono text-xs text-muted-foreground">
                len={row.length}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl">Checkout price mapping</h2>
        <dl className="divide-y divide-border border border-border text-sm">
          {priceMapping.map((row) => (
            <div
              key={row.productKey}
              className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr]"
            >
              <dt className="font-mono text-xs">{row.productKey}</dt>
              <dd className="font-mono text-xs text-muted-foreground">
                {row.envKey} · catalogMatch=
                {row.catalogEnvMatches ? "true" : "false"} · present=
                {row.present ? "true" : "false"} · len={row.length} ·
                priceIdValid={row.looksLikePriceId ? "true" : "false"} ·{" "}
                {row.prefix}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
