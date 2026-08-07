/** Locale & theme preference constants.
 *
 * Routing decision: locale is cookie-based (`ew_locale`), not URL-prefixed.
 * Avoids breaking auth callbacks, Supabase redirects, portal/invitation URLs,
 * and middleware path matchers. SEO uses `html[lang]` + translated metadata.
 */

export const LOCALES = ["ro", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ro";
export const LOCALE_COOKIE = "ew_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export const THEMES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEMES)[number];

export const DEFAULT_THEME: ThemePreference = "light";
export const THEME_COOKIE = "ew_theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const OG_LOCALE: Record<Locale, string> = {
  ro: "ro_RO",
  en: "en_US",
};

export function isLocale(value: unknown): value is Locale {
  return value === "ro" || value === "en";
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function safeLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function safeTheme(value: unknown): ThemePreference {
  return isThemePreference(value) ? value : DEFAULT_THEME;
}
