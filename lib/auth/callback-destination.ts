/**
 * Pure helpers for auth callback destination — unit-tested.
 */

export const PASSWORD_RESET_PATH = "/auth/reset-password";
export const FORGOT_PASSWORD_PATH = "/auth/forgot-password";
export const AUTH_ERROR_PATH = "/auth/error";

const SAFE_NEXT_PREFIXES = [
  "/dashboard",
  "/invite/",
  "/admin",
  "/check-email",
  "/auth/update-password",
  "/auth/reset-password",
  "/auth/forgot-password",
  "/auth/login",
  "/auth/error",
  "/auth/confirmed",
  "/auth/password-updated",
  "/update-password",
  "/login",
  "/register",
  "/forgot-password",
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

  // Normalize legacy recovery paths → dedicated reset page
  if (
    pathOnly === "/auth/update-password" ||
    pathOnly === "/update-password"
  ) {
    return PASSWORD_RESET_PATH;
  }

  const allowed = SAFE_NEXT_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(prefix),
  );

  if (!allowed && !pathOnly.startsWith("/dashboard")) {
    return fallback;
  }

  return trimmed;
}

export function isPasswordRecoveryNext(next: string): boolean {
  const pathOnly = next.split("?")[0]?.split("#")[0] ?? next;
  return (
    pathOnly === PASSWORD_RESET_PATH ||
    pathOnly === "/update-password" ||
    pathOnly === "/auth/update-password"
  );
}

export function hasRecoveryAmr(
  amr: unknown,
): boolean {
  if (!Array.isArray(amr)) return false;
  return amr.some(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      "method" in entry &&
      (entry as { method: string }).method === "recovery",
  );
}

/**
 * Resolve post-callback destination.
 * Recovery must never land on `/`, dashboard or onboarding.
 */
export function resolveAuthCallbackDestination(options: {
  next: string;
  onboardingCompleted: boolean | null | undefined;
  authType: string | null;
  isRecoverySession?: boolean;
}): string {
  const { next, onboardingCompleted, authType, isRecoverySession } = options;

  if (
    authType === "recovery" ||
    isRecoverySession ||
    isPasswordRecoveryNext(next)
  ) {
    return PASSWORD_RESET_PATH;
  }

  if (next.startsWith("/invite/")) return next;

  if (onboardingCompleted) {
    const dest = getSafeNextPath(next, "/dashboard");
    if (isPasswordRecoveryNext(dest)) return PASSWORD_RESET_PATH;
    return dest === "/dashboard/onboarding" ? "/dashboard" : dest;
  }

  return "/dashboard/onboarding";
}

export function authCallbackErrorPath(reason: string): string {
  return `${AUTH_ERROR_PATH}?reason=${encodeURIComponent(reason)}`;
}
