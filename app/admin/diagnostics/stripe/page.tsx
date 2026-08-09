import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { isStripeConfigured } from "@/lib/billing/plans";
import {
  getStripeEnvPresence,
  getSupabaseEnvPresence,
  hydrateStripeRuntimeEnv,
  hydrateSupabaseRuntimeEnv,
} from "@/lib/runtime-env";

export const metadata: Metadata = {
  title: "Stripe env diagnostics",
};

export const dynamic = "force-dynamic";

/**
 * Admin-only Stripe env presence check.
 * Returns booleans only — never secret values or lengths of secrets beyond presence.
 */
export default async function AdminStripeEnvDiagnosticsPage() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    notFound();
  }

  hydrateStripeRuntimeEnv();
  hydrateSupabaseRuntimeEnv();
  const presence = getStripeEnvPresence();
  const supabasePresence = getSupabaseEnvPresence();
  const configured = isStripeConfigured();

  const rows = [
    { label: "isStripeConfigured()", value: configured ? "true" : "false" },
    ...Object.entries(presence).map(([key, ok]) => ({
      label: key,
      value: ok ? "true" : "false",
    })),
    ...Object.entries(supabasePresence).map(([key, ok]) => ({
      label: key,
      value: ok ? "true" : "false",
    })),
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl">Stripe env diagnostics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Doar admin. Afișează prezența variabilelor (true/false), niciodată
          valorile. Worker: easywedd-raianvisual.
        </p>
      </header>

      <dl className="divide-y divide-border border border-border text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(12rem,18rem)_1fr]"
          >
            <dt className="font-mono text-xs text-muted-foreground">
              {row.label}
            </dt>
            <dd className="font-mono text-xs">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
