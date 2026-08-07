import type { Locale } from "@/lib/i18n/config";
import { safeLocale } from "@/lib/i18n/config";
import { getDictionarySync } from "@/lib/i18n/get-dictionary";
import { t } from "@/lib/i18n/t";

export type StatusDomain =
  | "rsvp"
  | "wedding"
  | "task"
  | "vendor"
  | "billing"
  | "invitation"
  | "email";

/**
 * Translate a DB/status enum for UI. Unknown statuses return the raw code.
 */
export function getStatusLabel(
  domain: StatusDomain,
  status: string | null | undefined,
  locale?: Locale | string | null,
): string {
  if (!status) return "";
  const loc = safeLocale(locale);
  const dict = getDictionarySync(loc);
  const path = `statuses.${domain}.${status}`;
  const label = t(dict as never, path, {
    locale: loc,
    fallbackDict: getDictionarySync("ro") as never,
  });
  if (label.startsWith("[i18n missing:") || label === path) {
    return status;
  }
  return label;
}
