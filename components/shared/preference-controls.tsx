"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore, useTransition } from "react";

import { setThemeAction } from "@/lib/actions/preferences";
import { useI18n } from "@/components/providers/i18n-provider";
import type { Locale, ThemePreference } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, dict, isPending } = useI18n();

  return (
    <div
      role="group"
      aria-label={dict.preferences.switchLanguage}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border bg-background/60 p-0.5 text-xs font-medium",
        className,
      )}
    >
      {(["ro", "en"] as const).map((code) => {
        const active = locale === code;
        const label =
          code === "ro" ? dict.preferences.localeRo : dict.preferences.localeEn;
        return (
          <button
            key={code}
            type="button"
            disabled={isPending || active}
            aria-pressed={active}
            aria-label={label}
            onClick={() => setLocale(code as Locale)}
            className={cn(
              "rounded-md px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-champagne/20 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { dict } = useI18n();
  const [, startTransition] = useTransition();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const current = (theme ?? "light") as ThemePreference;

  function onSelect(next: ThemePreference) {
    setTheme(next);
    startTransition(() => {
      void setThemeAction(next);
    });
  }

  const options: { value: ThemePreference; label: string; symbol: string }[] = [
    { value: "light", label: dict.preferences.themeLight, symbol: "☀" },
    { value: "dark", label: dict.preferences.themeDark, symbol: "☾" },
    { value: "system", label: dict.preferences.themeSystem, symbol: "◐" },
  ];

  return (
    <div
      role="group"
      aria-label={dict.preferences.switchTheme}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border bg-background/60 p-0.5 text-xs font-medium",
        className,
      )}
    >
      {options.map((opt) => {
        const active = mounted && current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            aria-label={opt.label}
            title={`${opt.label}${mounted && opt.value === "system" && resolvedTheme ? ` (${resolvedTheme})` : ""}`}
            onClick={() => onSelect(opt.value)}
            className={cn(
              "rounded-md px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-champagne/20 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span aria-hidden>{opt.symbol}</span>
            <span className="sr-only">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function PreferenceControls({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        compact && "gap-1.5",
        className,
      )}
    >
      <LocaleSwitcher />
      <ThemeSwitcher />
    </div>
  );
}
