import type { Locale } from "@/lib/i18n/config";
import { safeLocale } from "@/lib/i18n/config";

function intlLocale(locale: Locale | string | null | undefined) {
  return safeLocale(locale) === "en" ? "en-US" : "ro-RO";
}

export function formatMoney(
  amount: number,
  currency = "RON",
  locale?: Locale | string | null,
) {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(
  value: number,
  locale?: Locale | string | null,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(intlLocale(locale), options).format(value);
}

export function formatPercent(
  value: number,
  locale?: Locale | string | null,
) {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(
  value: string | Date | null | undefined,
  locale?: Locale | string | null,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatDateTime(
  value: string | Date | null | undefined,
  locale?: Locale | string | null,
) {
  return formatDate(value, locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(
  value: string | Date | null | undefined,
  locale?: Locale | string | null,
) {
  return formatDate(value, locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
