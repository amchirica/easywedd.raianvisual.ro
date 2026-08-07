import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
  safeLocale,
} from "@/lib/i18n/config";

export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  return safeLocale(jar.get(LOCALE_COOKIE)?.value);
}

export function localeCookieOptions(locale: Locale) {
  return {
    name: LOCALE_COOKIE,
    value: locale,
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  };
}

export { DEFAULT_LOCALE, LOCALE_COOKIE, safeLocale };
export type { Locale };
