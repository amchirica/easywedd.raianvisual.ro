/**
 * Central site URL + safe internal redirect helpers.
 * Prefer NEXT_PUBLIC_SITE_URL; NEXT_PUBLIC_APP_URL is a compatibility alias.
 */

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function ensureProtocol(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("localhost") || trimmed.startsWith("127.0.0.1")) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}

/**
 * Canonical public origin for auth redirects and absolute links.
 * Production: requires NEXT_PUBLIC_SITE_URL (or APP_URL alias).
 * Local only: falls back to http://localhost:3000 when unset.
 */
export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate || candidate.includes("undefined")) continue;
    const normalized = stripTrailingSlash(ensureProtocol(candidate));
    if (normalized) return normalized;
  }

  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.CF_PAGES === "1" ||
    Boolean(process.env.CF_PAGES_URL);

  if (isProd) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL lipsește în producție. Setează https://easywedd.raianvisual.ro în Cloudflare Variables.",
    );
  }

  return "http://localhost:3000";
}

const SAFE_NEXT_PREFIXES = [
  "/dashboard",
  "/invite/",
  "/admin",
  "/check-email",
  "/auth/update-password",
  "/update-password",
] as const;

/**
 * Allow only internal relative paths. Reject protocol-relative and external URLs.
 */
export function getSafeNextPath(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!value) return fallback;

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }

  const trimmed = decoded.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return fallback;
  if (trimmed.includes("\\")) return fallback;

  const pathOnly = trimmed.split("?")[0]?.split("#")[0] ?? trimmed;

  // Normalize legacy recovery path
  if (pathOnly === "/auth/update-password") {
    return "/update-password";
  }

  const allowed = SAFE_NEXT_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(prefix),
  );

  if (!allowed && !pathOnly.startsWith("/dashboard")) {
    return fallback;
  }

  return trimmed === "/auth/update-password" ? "/update-password" : trimmed;
}

export function getAuthCallbackUrl(next = "/dashboard/onboarding"): string {
  const safeNext = getSafeNextPath(next, "/dashboard/onboarding");
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
