/**
 * Routing decision (i18n):
 * Locale is cookie-based (`ew_locale`), not URL-prefixed (`/en/...`).
 * Auth callbacks, Supabase redirects, portal/invitation URLs, and middleware
 * path matchers stay stable. SEO uses `html[lang]` + translated metadata;
 * hreflang points to the same URLs with x-default = RO experience.
 */

import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  DEFAULT_THEME,
  isLocale,
  isThemePreference,
  safeLocale,
  safeTheme,
} from "@/lib/i18n/config";
import { en } from "@/lib/i18n/dictionaries/en";
import { ro } from "@/lib/i18n/dictionaries/ro";
import { getEmailCopy } from "@/lib/i18n/email-copy";
import { getDictionarySync } from "@/lib/i18n/get-dictionary";

describe("i18n locale safety", () => {
  it("defaults to RO", () => {
    expect(DEFAULT_LOCALE).toBe("ro");
    expect(safeLocale(undefined)).toBe("ro");
    expect(safeLocale("fr")).toBe("ro");
  });

  it("accepts ro and en", () => {
    expect(isLocale("ro")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(safeLocale("en")).toBe("en");
  });
});

describe("theme preference safety", () => {
  it("defaults to light", () => {
    expect(DEFAULT_THEME).toBe("light");
    expect(safeTheme(undefined)).toBe("light");
    expect(safeTheme("neon")).toBe("light");
  });

  it("accepts light, dark, system", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
    expect(safeTheme("dark")).toBe("dark");
    expect(safeTheme("system")).toBe("system");
  });
});

describe("dictionaries", () => {
  it("RO and EN share the same top-level keys", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ro).sort());
  });

  it("RO and EN share the same flattened keys", async () => {
    const { flattenKeys } = await import("@/lib/i18n/t");
    expect(flattenKeys(en as never)).toEqual(flattenKeys(ro as never));
  });

  it("falls back to RO dictionary", () => {
    expect(getDictionarySync("ro").hero.title).toBe(ro.hero.title);
    expect(getDictionarySync("en").hero.title).toBe(en.hero.title);
  });

  it("exposes preference and auth chrome strings", () => {
    expect(ro.preferences.localeRo).toBe("RO");
    expect(en.preferences.localeEn).toBe("EN");
    expect(ro.auth.loginTitle).toBeTruthy();
    expect(en.auth.loginTitle).toBeTruthy();
  });

  it("exposes app namespaces", () => {
    expect(ro.guests.title).toBeTruthy();
    expect(en.guests.title).toBeTruthy();
    expect(ro.errors.generic).toBeTruthy();
    expect(en.statuses.rsvp.pending).toBeTruthy();
  });
});

describe("email copy architecture", () => {
  it("returns locale-specific subjects without dark-mode styling concerns", () => {
    expect(getEmailCopy("ro").confirmSubject).toMatch(/email/i);
    expect(getEmailCopy("en").resetSubject).toMatch(/password/i);
    expect(getEmailCopy("xx").brandingFooter).toBe(getEmailCopy("ro").brandingFooter);
  });
});

describe("metadata per locale", () => {
  it("has distinct home titles", () => {
    expect(ro.meta.homeTitle).not.toBe(en.meta.homeTitle);
    expect(ro.meta.description).not.toBe(en.meta.description);
  });
});

describe("status labels", () => {
  it("translates known RSVP / task statuses", async () => {
    const { getStatusLabel } = await import("@/lib/i18n/status-labels");
    expect(getStatusLabel("rsvp", "pending", "ro")).toBe(ro.statuses.rsvp.pending);
    expect(getStatusLabel("rsvp", "pending", "en")).toBe(en.statuses.rsvp.pending);
    expect(getStatusLabel("task", "done", "en")).toBe(en.statuses.task.done);
  });

  it("returns raw code for unknown statuses", async () => {
    const { getStatusLabel } = await import("@/lib/i18n/status-labels");
    expect(getStatusLabel("rsvp", "weird_status", "en")).toBe("weird_status");
  });
});

describe("error and validation maps", () => {
  it("translates error codes", async () => {
    const { translateErrorCode } = await import("@/lib/i18n/errors");
    expect(translateErrorCode("permission_denied", "en")).toBe(
      en.errors.permission_denied,
    );
    expect(translateErrorCode("generic", "ro")).toBe(ro.errors.generic);
  });

  it("translates validation.* keys", async () => {
    const { translateValidationMessage } = await import("@/lib/i18n/errors");
    expect(translateValidationMessage("validation.passwordMismatch", "en")).toBe(
      en.validation.passwordMismatch,
    );
    expect(translateValidationMessage("validation.invalidEmail", "ro")).toBe(
      ro.validation.invalidEmail,
    );
  });
});

describe("formatters", () => {
  it("formats money with locale", async () => {
    const { formatMoney } = await import("@/lib/i18n/format");
    const roMoney = formatMoney(1000, "RON", "ro");
    const enMoney = formatMoney(1000, "RON", "en");
    expect(roMoney).toMatch(/1/);
    expect(enMoney).toMatch(/1/);
  });
});
