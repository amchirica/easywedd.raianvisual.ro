import type { Locale } from "@/lib/i18n/config";
import { safeLocale } from "@/lib/i18n/config";
import { getDictionarySync } from "@/lib/i18n/get-dictionary";
import { t } from "@/lib/i18n/t";

/** Known user-facing error codes (extend as actions migrate). */
export const ERROR_CODES = [
  "unauthenticated",
  "permission_denied",
  "resource_not_found",
  "validation_failed",
  "save_failed",
  "delete_failed",
  "update_failed",
  "invite_failed",
  "publish_failed",
  "rate_limited",
  "account_suspended",
  "feature_unavailable",
  "duplicate",
  "generic",
  "proposal_save_failed",
  "client_already_exists",
  "onboarding_failed",
  "guest_save_failed",
  "budget_save_failed",
  "seating_save_failed",
  "vendor_save_failed",
  "task_save_failed",
  "wedding_save_failed",
  "settings_save_failed",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export function isErrorCode(value: unknown): value is ErrorCode {
  return (
    typeof value === "string" &&
    (ERROR_CODES as readonly string[]).includes(value)
  );
}

export function translateErrorCode(
  code: string | null | undefined,
  locale?: Locale | string | null,
  fallbackMessage?: string | null,
): string {
  if (!code && fallbackMessage) return fallbackMessage;
  if (!code) {
    return translateErrorCode("generic", locale);
  }
  const loc = safeLocale(locale);
  const dict = getDictionarySync(loc);
  const path = `errors.${code}`;
  const label = t(dict as never, path, {
    locale: loc,
    fallbackDict: getDictionarySync("ro") as never,
  });
  if (label.startsWith("[i18n missing:") || label === path) {
    return fallbackMessage || translateErrorCode("generic", loc);
  }
  return label;
}

/** Map common Supabase / Postgres messages to codes (no raw DB text in UI). */
export function mapBackendErrorMessage(message?: string | null): ErrorCode {
  const msg = (message ?? "").toLowerCase();
  if (!msg) return "generic";
  if (msg.includes("row-level security") || msg.includes("permission")) {
    return "permission_denied";
  }
  if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
    return "duplicate";
  }
  if (msg.includes("not found") || msg.includes("0 rows")) {
    return "resource_not_found";
  }
  if (msg.includes("not_authenticated") || msg.includes("jwt")) {
    return "unauthenticated";
  }
  return "generic";
}

/** Prefer errorCode, else validation.* keys, else raw message. */
export function translateActionError(
  error: string | null | undefined,
  errorCode?: string | null,
  locale?: Locale | string | null,
): string {
  if (errorCode) {
    return translateErrorCode(errorCode, locale, error);
  }
  if (error?.startsWith("validation.")) {
    return translateValidationMessage(error, locale);
  }
  if (error) return error;
  return translateErrorCode("generic", locale);
}
export function translateValidationMessage(
  message: string | null | undefined,
  locale?: Locale | string | null,
): string {
  if (!message) {
    return translateErrorCode("validation_failed", locale);
  }
  if (!message.startsWith("validation.")) {
    return message;
  }
  const loc = safeLocale(locale);
  const dict = getDictionarySync(loc);
  const label = t(dict as never, message, {
    locale: loc,
    fallbackDict: getDictionarySync("ro") as never,
  });
  if (label.startsWith("[i18n missing:") || label === message) {
    return translateErrorCode("validation_failed", loc);
  }
  return label;
}

/** First Zod issue → localized string (supports validation.* keys). */
export function firstZodMessage(
  issues: ReadonlyArray<{ message: string }> | undefined,
  locale?: Locale | string | null,
): string {
  return translateValidationMessage(issues?.[0]?.message, locale);
}
