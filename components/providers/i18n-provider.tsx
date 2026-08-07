"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from "react";

import { setLocaleAction } from "@/lib/actions/preferences";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type I18nContextValue = {
  locale: Locale;
  dict: Dictionary;
  setLocale: (locale: Locale) => void;
  isPending: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  const setLocale = useCallback((next: Locale) => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
    startTransition(() => {
      void setLocaleAction(next);
    });
  }, []);

  const value = useMemo(
    () => ({ locale, dict, setLocale, isPending }),
    [locale, dict, setLocale, isPending],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function useDictionary() {
  return useI18n().dict;
}
