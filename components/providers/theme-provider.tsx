"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

import type { ThemePreference } from "@/lib/i18n/config";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: ThemePreference;
};

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
      storageKey="ew_theme_local"
    >
      {children}
    </NextThemesProvider>
  );
}
