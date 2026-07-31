/**
 * Safe internal `next` path for /auth/confirm (no external redirects).
 */
export function safeAuthNext(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  const trimmed = decoded.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return fallback;
  if (trimmed.includes("\\")) return fallback;
  return trimmed;
}

export function mapConfirmOtpErrorCode(code: string | undefined): string {
  if (code === "otp_expired") return "otp_expired";
  if (code === "token_not_found") return "token_not_found";
  if (code === "access_denied") return "access_denied";
  return code || "invalid_or_expired_link";
}
