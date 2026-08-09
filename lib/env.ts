import "server-only";

/**
 * Server-side env helpers. Never log secret values.
 */

function missing(name: string): never {
  throw new Error(
    `Variabilă de mediu lipsă: ${name}. Vezi .env.example și docs/ENV.md.`,
  );
}

export function getPublicSiteUrlFromEnv(): string | undefined {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const app = process.env.NEXT_PUBLIC_APP_URL?.trim();
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) missing("NEXT_PUBLIC_SUPABASE_URL");
  if (!anon) missing("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, anonKey: anon };
}

export function requireServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) missing("SUPABASE_SERVICE_ROLE_KEY");
  return key;
}
