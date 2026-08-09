import "server-only";

import { getRuntimeEnv, getRuntimeEnvSourceFlags } from "@/lib/runtime-env";

/**
 * Server-side env helpers. Never log secret values.
 * Uses Cloudflare Worker bindings when process.env is empty (OpenNext).
 */

function missing(name: string): never {
  throw new Error(
    `Variabilă de mediu lipsă: ${name}. Vezi .env.example și docs/ENV.md.`,
  );
}

export function getPublicSiteUrlFromEnv(): string | undefined {
  const site = getRuntimeEnv("NEXT_PUBLIC_SITE_URL");
  const app = getRuntimeEnv("NEXT_PUBLIC_APP_URL");
  return site || app || undefined;
}

/**
 * Call from server entry points that must not run without production URLs.
 * Local/dev may omit and fall back to localhost via getSiteUrl().
 */
export function assertProductionSiteUrl() {
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.CF_PAGES === "1" ||
    Boolean(process.env.CF_PAGES_URL);

  if (!isProd) return;

  const url = getPublicSiteUrlFromEnv();
  if (!url) {
    missing("NEXT_PUBLIC_SITE_URL (sau NEXT_PUBLIC_APP_URL)");
  }
  if (/localhost|127\.0\.0\.1/i.test(url)) {
    throw new Error(
      "În producție, NEXT_PUBLIC_SITE_URL nu poate fi localhost. Folosește https://easywedd.raianvisual.ro",
    );
  }
}

export function requireSupabasePublicEnv() {
  const url = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url) missing("NEXT_PUBLIC_SUPABASE_URL");
  if (!anon) missing("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, anonKey: anon };
}

export function requireServiceRoleKey() {
  const key = getRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) {
    const flags = getRuntimeEnvSourceFlags();
    throw new Error(
      `Variabilă de mediu lipsă: SUPABASE_SERVICE_ROLE_KEY (als=${flags.hasAlsContext} present=${flags.serviceRolePresent}). Setează secretul pe Worker easywedd-raianvisual.`,
    );
  }
  return key;
}
