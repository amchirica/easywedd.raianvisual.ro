"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
  type Locale,
  type ThemePreference,
  safeLocale,
  safeTheme,
} from "@/lib/i18n/config";

export async function setLocaleAction(locale: string) {
  const value = safeLocale(locale);
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
  return { locale: value as Locale };
}

export async function setThemeAction(theme: string) {
  const value = safeTheme(theme);
  const jar = await cookies();
  jar.set(THEME_COOKIE, value, {
    path: "/",
    maxAge: THEME_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
  return { theme: value as ThemePreference };
}
