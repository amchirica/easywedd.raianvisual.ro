/**
 * Email templates — locale-aware architecture (content only; always light chrome).
 *
 * Usage (when wiring transactional emails):
 *   const dict = getEmailCopy(locale);
 *   // render HTML with light/white layout; never follow app dark mode.
 */

import type { Locale } from "@/lib/i18n/config";
import { safeLocale } from "@/lib/i18n/config";

const emailCopy = {
  ro: {
    brandingFooter: "EasyWedd — organizarea nunții, elegant și simplu",
    confirmSubject: "Confirmă adresa de email",
    resetSubject: "Resetează parola EasyWedd",
  },
  en: {
    brandingFooter: "EasyWedd — wedding planning, elegant and simple",
    confirmSubject: "Confirm your email address",
    resetSubject: "Reset your EasyWedd password",
  },
} as const;

export type EmailCopy = {
  brandingFooter: string;
  confirmSubject: string;
  resetSubject: string;
};

export function getEmailCopy(locale: Locale | string | null | undefined): EmailCopy {
  return emailCopy[safeLocale(locale)];
}
