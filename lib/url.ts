/**
 * Central site URL + safe internal redirect helpers.
 * Prefer NEXT_PUBLIC_SITE_URL; keep NEXT_PUBLIC_APP_URL as alias for compatibility.
 */

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function ensureProtocol(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Vercel hostnames arrive without protocol
  if (
    trimmed.startsWith("localhost") ||
    trimmed.startsWith("127.0.0.1")
  ) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}

export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate || candidate.includes("undefined")) continue;
    const normalized = stripTrailingSlash(ensureProtocol(candidate));
    if (normalized) return normalized;
  }

  return "http://localhost:3000";
}

const SAFE_NEXT_PREFIXES = [
  "/dashboard",
  "/invite/",
  "/admin",
  "/check-email",
  "/auth/update-password",
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
  const allowed = SAFE_NEXT_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(prefix),
  );

  if (!allowed && pathOnly !== "/dashboard/onboarding") {
    // /dashboard and nested paths already covered by prefix "/dashboard"
    if (!pathOnly.startsWith("/dashboard")) return fallback;
  }

  return trimmed;
}

export function getAuthCallbackUrl(next = "/dashboard/onboarding"): string {
  const safeNext = getSafeNextPath(next, "/dashboard/onboarding");
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
