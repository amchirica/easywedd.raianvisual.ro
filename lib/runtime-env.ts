/**
 * Single source of truth for server-side env on Cloudflare / OpenNext / Node.
 *
 * Resolution order:
 * 1) OpenNext ALS Cloudflare context (`Symbol.for("__cloudflare-context__").env`)
 * 2) `getCloudflareContext({ async: true })` from `@opennextjs/cloudflare`
 * 3) Dynamic `process.env[name]` (local + OpenNext populateProcessEnv)
 * 4) Static `process.env.NEXT_PUBLIC_*` member access (Next build-time inlining)
 *
 * IMPORTANT:
 * - Do NOT `require("@opennextjs/cloudflare")` — package is ESM-only.
 * - Do NOT `import("cloudflare:workers")` — Next/webpack cannot resolve that scheme.
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

const CF_CONTEXT_SYMBOL = Symbol.for("__cloudflare-context__");

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
  try {
    return asNonEmptyString(process.env[name]);
  } catch {
    return undefined;
  }
}

/**
 * OpenNext stores request-scoped `{ env, ctx, cf }` behind this symbol (ALS getter).
 * This works without importing `@opennextjs/cloudflare` (ESM-only; require always fails).
 */
function readFromOpenNextAls(name: string): string | undefined {
  try {
    const ctx = (globalThis as Record<symbol, { env?: EnvBag } | undefined>)[
      CF_CONTEXT_SYMBOL
    ];
    return asNonEmptyString(ctx?.env?.[name]);
  } catch {
    return undefined;
  }
}

async function readFromOpenNextApiAsync(
  name: string,
): Promise<string | undefined> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    return asNonEmptyString((ctx?.env as EnvBag | undefined)?.[name]);
  } catch {
    return undefined;
  }
}

function mirrorIntoProcessEnv(name: string, value: string): void {
  try {
    process.env[name] = value;
  } catch {
    // Some Next polyfills ignore writes — value still returned from getRuntimeEnv.
  }
}

/**
 * Resolve a server env var. Prefer Worker request bindings, then process.env, then
 * static NEXT_PUBLIC inlining.
 */
export function getRuntimeEnv(name: string): string | undefined {
  const fromAls = readFromOpenNextAls(name);
  if (fromAls) {
    mirrorIntoProcessEnv(name, fromAls);
    return fromAls;
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
 */
export async function hydrateRuntimeEnvAsync(
  keys: readonly string[] = RUNTIME_ENV_KEYS,
): Promise<void> {
  for (const key of keys) {
    const fromAls = readFromOpenNextAls(key);
    if (fromAls) {
      mirrorIntoProcessEnv(key, fromAls);
      continue;
    }

    const fromOpenNextApi = await readFromOpenNextApiAsync(key);
    if (fromOpenNextApi) {
      mirrorIntoProcessEnv(key, fromOpenNextApi);
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

/** Safe debug flags for admin error pages (no secret values). */
export function getRuntimeEnvSourceFlags(): {
  hasAlsContext: boolean;
  serviceRolePresent: boolean;
  supabaseUrlPresent: boolean;
  supabaseAnonPresent: boolean;
} {
  let hasAlsContext = false;
  try {
    const ctx = (globalThis as Record<symbol, unknown>)[CF_CONTEXT_SYMBOL];
    hasAlsContext = Boolean(ctx && typeof ctx === "object");
  } catch {
    hasAlsContext = false;
  }
  return {
    hasAlsContext,
    serviceRolePresent: runtimeEnvPresent("SUPABASE_SERVICE_ROLE_KEY"),
    supabaseUrlPresent: runtimeEnvPresent("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonPresent: runtimeEnvPresent("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
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
