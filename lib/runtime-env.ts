import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Runtime env for Cloudflare Workers / OpenNext.
 *
 * Server-only usage (billing, webhook, admin). Do not import from Client Components.
 *
 * `.env.local` is local-only. Production must use Worker Secrets/Variables.
 * OpenNext/Next may not always mirror Worker bindings onto `process.env`,
 * so we also read `getCloudflareContext().env`.
 */

type EnvBag = Record<string, unknown>;

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function readFromProcessEnv(name: string): string | undefined {
  return asNonEmptyString(process.env[name]);
}

function readFromCloudflareContext(name: string): string | undefined {
  try {
    const ctx = getCloudflareContext();
    const env = ctx?.env as EnvBag | undefined;
    return asNonEmptyString(env?.[name]);
  } catch {
    return undefined;
  }
}

/**
 * Resolve a server env var from process.env and/or Cloudflare Worker bindings.
 * Mirrors Cloudflare values into process.env for the current isolate so
 * downstream `process.env[name]` reads (and SDKs) keep working.
 */
export function getRuntimeEnv(name: string): string | undefined {
  const fromProcess = readFromProcessEnv(name);
  if (fromProcess) return fromProcess;

  const fromCf = readFromCloudflareContext(name);
  if (fromCf) {
    process.env[name] = fromCf;
    return fromCf;
  }

  return undefined;
}

export function runtimeEnvPresent(name: string): boolean {
  return Boolean(getRuntimeEnv(name));
}

/** Presence-only Stripe diagnostics — never returns secret values. */
export function getStripeEnvPresence(): Record<
  | "STRIPE_SECRET_KEY"
  | "STRIPE_WEBHOOK_SECRET"
  | "STRIPE_PRICE_STARTER_MONTHLY"
  | "STRIPE_PRICE_PRO_MONTHLY"
  | "STRIPE_PRICE_PREMIUM_PASS_12"
  | "STRIPE_PRICE_PREMIUM_PASS_18",
  boolean
> {
  return {
    STRIPE_SECRET_KEY: runtimeEnvPresent("STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SECRET: runtimeEnvPresent("STRIPE_WEBHOOK_SECRET"),
    STRIPE_PRICE_STARTER_MONTHLY: runtimeEnvPresent(
      "STRIPE_PRICE_STARTER_MONTHLY",
    ),
    STRIPE_PRICE_PRO_MONTHLY: runtimeEnvPresent("STRIPE_PRICE_PRO_MONTHLY"),
    STRIPE_PRICE_PREMIUM_PASS_12: runtimeEnvPresent(
      "STRIPE_PRICE_PREMIUM_PASS_12",
    ),
    STRIPE_PRICE_PREMIUM_PASS_18: runtimeEnvPresent(
      "STRIPE_PRICE_PREMIUM_PASS_18",
    ),
  };
}

/** Presence including Supabase service role (booleans only). */
export function getSupabaseEnvPresence(): Record<
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY",
  boolean
> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: runtimeEnvPresent("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: runtimeEnvPresent(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
    SUPABASE_SERVICE_ROLE_KEY: runtimeEnvPresent("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

/** Ensure Supabase secrets from Worker bindings are mirrored for this request. */
export function hydrateSupabaseRuntimeEnv(): void {
  for (const key of Object.keys(getSupabaseEnvPresence())) {
    getRuntimeEnv(key);
  }
}

/** Ensure Stripe keys from Worker bindings are mirrored for this request. */
export function hydrateStripeRuntimeEnv(): void {
  for (const key of Object.keys(getStripeEnvPresence())) {
    getRuntimeEnv(key);
  }
}
