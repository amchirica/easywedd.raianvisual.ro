/**
 * Single source of truth for server-side env on Cloudflare / OpenNext / Node.
 *
 * Resolution order:
 * 1) Cloudflare Worker bindings (`getCloudflareContext().env`) — production secrets/vars
 * 2) Dynamic `process.env[name]` — local `.env.local`, populated Worker process.env
 * 3) Static `process.env.NEXT_PUBLIC_*` member access — Next build-time inlining backup
 *
 * Never log or return secret values from diagnostics (presence + length only).
 * Do not import this from Client Components.
 */

type EnvBag = Record<string, unknown>;

export const RUNTIME_ENV_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_STARTER_MONTHLY",
  "STRIPE_PRICE_PRO_MONTHLY",
  "STRIPE_PRICE_PREMIUM_PASS_12",
  "STRIPE_PRICE_PREMIUM_PASS_18",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
] as const;

export type RuntimeEnvKey = (typeof RUNTIME_ENV_KEYS)[number];

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Member-access fallback for NEXT_PUBLIC_* only.
 * Next/webpack can inline these at build time; dynamic `process.env[name]` cannot.
 * Never add secrets here (would bake them into the worker bundle from the build machine).
 */
function readStaticNextPublic(name: string): string | undefined {
  switch (name) {
    case "NEXT_PUBLIC_SUPABASE_URL":
      return asNonEmptyString(process.env.NEXT_PUBLIC_SUPABASE_URL);
    case "NEXT_PUBLIC_SUPABASE_ANON_KEY":
      return asNonEmptyString(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    case "NEXT_PUBLIC_APP_URL":
      return asNonEmptyString(process.env.NEXT_PUBLIC_APP_URL);
    case "NEXT_PUBLIC_SITE_URL":
      return asNonEmptyString(process.env.NEXT_PUBLIC_SITE_URL);
    case "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY":
      return asNonEmptyString(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    default:
      return undefined;
  }
}

function readFromProcessEnvDynamic(name: string): string | undefined {
  return asNonEmptyString(process.env[name]);
}

function readFromCloudflareContextSync(name: string): string | undefined {
  try {
    // Lazy require so module load does not fail outside Workers / in Vitest.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@opennextjs/cloudflare") as typeof import("@opennextjs/cloudflare");
    const ctx = mod.getCloudflareContext();
    const env = ctx?.env as EnvBag | undefined;
    return asNonEmptyString(env?.[name]);
  } catch {
    return undefined;
  }
}

async function readFromCloudflareContextAsync(
  name: string,
): Promise<string | undefined> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx?.env as EnvBag | undefined;
    return asNonEmptyString(env?.[name]);
  } catch {
    return undefined;
  }
}

function mirrorIntoProcessEnv(name: string, value: string): void {
  process.env[name] = value;
}

/**
 * Resolve a server env var. Prefer Worker bindings, then process.env, then
 * static NEXT_PUBLIC inlining.
 */
export function getRuntimeEnv(name: string): string | undefined {
  const fromCf = readFromCloudflareContextSync(name);
  if (fromCf) {
    mirrorIntoProcessEnv(name, fromCf);
    return fromCf;
  }

  const fromDynamic = readFromProcessEnvDynamic(name);
  if (fromDynamic) return fromDynamic;

  const fromStatic = readStaticNextPublic(name);
  if (fromStatic) {
    mirrorIntoProcessEnv(name, fromStatic);
    return fromStatic;
  }

  return undefined;
}

/**
 * Async hydrate — use at the start of RSC/actions so async CF context is available.
 * Same priority as getRuntimeEnv: Cloudflare bindings first, then process.env, then
 * static NEXT_PUBLIC inlining. Never prefer a stale empty local over Worker secrets.
 */
export async function hydrateRuntimeEnvAsync(
  keys: readonly string[] = RUNTIME_ENV_KEYS,
): Promise<void> {
  for (const key of keys) {
    const fromCfAsync = await readFromCloudflareContextAsync(key);
    if (fromCfAsync) {
      mirrorIntoProcessEnv(key, fromCfAsync);
      continue;
    }

    const fromCfSync = readFromCloudflareContextSync(key);
    if (fromCfSync) {
      mirrorIntoProcessEnv(key, fromCfSync);
      continue;
    }

    const fromDynamic = readFromProcessEnvDynamic(key);
    if (fromDynamic) {
      mirrorIntoProcessEnv(key, fromDynamic);
      continue;
    }

    const fromStatic = readStaticNextPublic(key);
    if (fromStatic) {
      mirrorIntoProcessEnv(key, fromStatic);
    }
  }
}

export function runtimeEnvPresent(name: string): boolean {
  return Boolean(getRuntimeEnv(name));
}

export function runtimeEnvLength(name: string): number {
  return getRuntimeEnv(name)?.length ?? 0;
}

export type EnvDiagRow = {
  key: string;
  present: boolean;
  length: number;
};

/** Admin diagnostics — never includes secret values. */
export function getRuntimeEnvDiagnostics(
  keys: readonly string[] = RUNTIME_ENV_KEYS,
): EnvDiagRow[] {
  return keys.map((key) => ({
    key,
    present: runtimeEnvPresent(key),
    length: runtimeEnvLength(key),
  }));
}

export function getStripeEnvPresence(): Record<
  | "STRIPE_SECRET_KEY"
  | "STRIPE_WEBHOOK_SECRET"
  | "STRIPE_PRICE_STARTER_MONTHLY"
  | "STRIPE_PRICE_PRO_MONTHLY"
  | "STRIPE_PRICE_PREMIUM_PASS_12"
  | "STRIPE_PRICE_PREMIUM_PASS_18"
  | "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
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
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: runtimeEnvPresent(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    ),
  };
}

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

export function hydrateSupabaseRuntimeEnv(): void {
  getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  getRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  getRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function hydrateStripeRuntimeEnv(): void {
  for (const key of Object.keys(getStripeEnvPresence())) {
    getRuntimeEnv(key);
  }
}

/** Plan key → env var name for Checkout Price IDs (must stay in sync with BILLING_PRODUCTS). */
export const STRIPE_PRICE_ENV_BY_PRODUCT = {
  starter: "STRIPE_PRICE_STARTER_MONTHLY",
  pro: "STRIPE_PRICE_PRO_MONTHLY",
  premium_pass_12: "STRIPE_PRICE_PREMIUM_PASS_12",
  premium_pass_18: "STRIPE_PRICE_PREMIUM_PASS_18",
} as const;
