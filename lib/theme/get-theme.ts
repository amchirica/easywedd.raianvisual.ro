import { cookies } from "next/headers";

import {
  DEFAULT_THEME,
  THEME_COOKIE,
  type ThemePreference,
  safeTheme,
} from "@/lib/i18n/config";

export async function getRequestTheme(): Promise<ThemePreference> {
  const jar = await cookies();
  const raw = jar.get(THEME_COOKIE)?.value;
  if (!raw) return DEFAULT_THEME;
  return safeTheme(raw);
}
