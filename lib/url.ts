/**
 * Central site URL + safe internal redirect helpers.
 * Prefer NEXT_PUBLIC_SITE_URL; NEXT_PUBLIC_APP_URL is a compatibility alias.
 */

import {
  FORGOT_PASSWORD_PATH,
  PASSWORD_RESET_PATH,
  getSafeNextPath,
} from "@/lib/auth/callback-destination";

export {
  FORGOT_PASSWORD_PATH,
  PASSWORD_RESET_PATH,
  getSafeNextPath,
  isPasswordRecoveryNext,
  resolveAuthCallbackDestination,
  authCallbackErrorPath,
  hasRecoveryAmr,
} from "@/lib/auth/callback-destination";

/** Known production origin — used only as last-resort guard against localhost in prod. */
export const PRODUCTION_SITE_URL = "https://easywedd.raianvisual.ro";

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

function isLocalhostUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.CF_PAGES === "1" ||
    Boolean(process.env.CF_PAGES_URL) ||
    process.env.NEXT_PUBLIC_FORCE_PRODUCTION_URL === "1"
  );
}

/**
 * Canonical public origin for auth redirects and absolute links.
 * Production: requires a non-localhost SITE_URL/APP_URL (or falls back to
 * PRODUCTION_SITE_URL so auth emails are never blocked by localhost redirects).
 * Local only: falls back to http://localhost:3000 when unset.
 */
export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];

  const resolved: string[] = [];
  for (const candidate of candidates) {
    if (!candidate || candidate.includes("undefined")) continue;
    const normalized = stripTrailingSlash(ensureProtocol(candidate));
    if (normalized) resolved.push(normalized);
  }

  const nonLocal = resolved.find((url) => !isLocalhostUrl(url));
  if (nonLocal) return nonLocal;

  if (isProductionRuntime()) {
    // Never send Supabase auth emails with redirectTo=localhost in production —
    // Supabase rejects the request and no email is delivered.
    console.error(
      "[url:getSiteUrl] Producție cu SITE_URL/APP_URL localhost sau lipsă — folosesc",
      PRODUCTION_SITE_URL,
    );
    return PRODUCTION_SITE_URL;
  }

  const local = resolved.find((url) => isLocalhostUrl(url));
  if (local) return local;

  return "http://localhost:3000";
}

export function getAuthCallbackUrl(next = "/dashboard/onboarding"): string {
  const safeNext = getSafeNextPath(next, "/dashboard/onboarding");
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

/** Explicit redirect for Supabase resetPasswordForEmail */
export function getPasswordResetCallbackUrl(): string {
  return getAuthCallbackUrl(PASSWORD_RESET_PATH);
}

export function getForgotPasswordUrl(): string {
  return FORGOT_PASSWORD_PATH;
}
