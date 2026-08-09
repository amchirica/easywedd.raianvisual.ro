/**
 * Central site URL + auth redirect helpers.
 * Prefer NEXT_PUBLIC_APP_URL; NEXT_PUBLIC_SITE_URL is an alias.
 */

import {
  FORGOT_PASSWORD_PATH,
  PASSWORD_RESET_PATH,
  getSafeNextPath,
} from "@/lib/auth/callback-destination";
import { getRuntimeEnv } from "@/lib/runtime-env";

export {
  FORGOT_PASSWORD_PATH,
  PASSWORD_RESET_PATH,
  getSafeNextPath,
  isPasswordRecoveryNext,
  resolveAuthCallbackDestination,
  authCallbackErrorPath,
  hasRecoveryAmr,
} from "@/lib/auth/callback-destination";

/** Known production origin — last-resort guard against localhost in prod. */
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
 * Canonical public origin for auth redirects.
 * Prefer NEXT_PUBLIC_APP_URL (then SITE_URL). Never localhost in production.
 */
export function getSiteUrl(): string {
  const candidates = [
    getRuntimeEnv("NEXT_PUBLIC_APP_URL"),
    getRuntimeEnv("NEXT_PUBLIC_SITE_URL"),
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
    console.error(
      "[url:getSiteUrl] Producție cu APP_URL/SITE_URL localhost sau lipsă — folosesc",
      PRODUCTION_SITE_URL,
    );
    return PRODUCTION_SITE_URL;
  }

  const local = resolved.find((url) => isLocalhostUrl(url));
  if (local) return local;

  return "http://localhost:3000";
}

/**
 * Allow-listed landing for emailRedirectTo / redirectTo.
 * Real email links must come from TokenHash templates → /auth/confirm?token_hash=…
 * (ConfirmationURL + ?code= is rejected — causes pkce_code_verifier_not_found.)
 */
export function getSignupEmailRedirectTo(): string {
  return `${getSiteUrl()}/auth/confirm?next=${encodeURIComponent("/dashboard")}`;
}

/**
 * Allow-listed landing for resetPasswordForEmail redirectTo.
 * Template must use TokenHash → /auth/confirm?token_hash=…&type=recovery&next=…
 */
export function getPasswordResetRedirectTo(): string {
  return `${getSiteUrl()}/auth/confirm?next=${encodeURIComponent(PASSWORD_RESET_PATH)}`;
}


/** @deprecated Use getSignupEmailRedirectTo / getPasswordResetRedirectTo */
export function getAuthConfirmUrl(next = "/dashboard"): string {
  const safeNext = getSafeNextPath(next, "/dashboard");
  return `${getSiteUrl()}/auth/confirm?next=${encodeURIComponent(safeNext)}`;
}

/** @deprecated OAuth-only callback; email flows use templates → /auth/confirm */
export function getAuthCallbackUrl(next = "/dashboard"): string {
  return getAuthConfirmUrl(next);
}

/** @deprecated Use getPasswordResetRedirectTo */
export function getPasswordResetCallbackUrl(): string {
  return getPasswordResetRedirectTo();
}

export function getForgotPasswordUrl(): string {
  return FORGOT_PASSWORD_PATH;
}
