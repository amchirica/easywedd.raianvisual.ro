import { describe, expect, it } from "vitest";

import { mapSupabaseAuthError } from "@/lib/auth/map-auth-error";
import {
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import {
  getSafeNextPath,
  resolveAuthCallbackDestination,
  PASSWORD_RESET_PATH,
} from "@/lib/auth/callback-destination";

describe("mapSupabaseAuthError", () => {
  it("maps user_already_exists", () => {
    const r = mapSupabaseAuthError(
      { code: "user_already_exists", message: "User already registered" },
      "signup",
    );
    expect(r.code).toBe("user_already_exists");
    expect(r.message).toContain("Există deja un cont");
  });

  it("maps weak_password", () => {
    const r = mapSupabaseAuthError(
      { code: "weak_password", message: "Password is too weak" },
      "signup",
    );
    expect(r.code).toBe("weak_password");
  });

  it("maps invalid email", () => {
    const r = mapSupabaseAuthError(
      { code: "email_address_invalid", message: "Invalid email" },
      "signup",
    );
    expect(r.code).toBe("email_address_invalid");
  });

  it("maps rate limit", () => {
    const r = mapSupabaseAuthError(
      { code: "over_email_send_rate_limit", message: "email rate limit exceeded", status: 429 },
      "signup",
    );
    expect(r.code).toBe("over_email_send_rate_limit");
  });

  it("maps SMTP / email delivery failure", () => {
    const r = mapSupabaseAuthError(
      {
        code: "unexpected_failure",
        message: "Error sending confirmation email",
      },
      "signup",
    );
    expect(r.code).toBe("smtp_error");
    expect(r.message).toContain("emailul de confirmare");
  });

  it("maps signup_disabled", () => {
    const r = mapSupabaseAuthError(
      { message: "Signups not allowed for this instance" },
      "signup",
    );
    expect(r.code).toBe("signup_disabled");
  });

  it("maps email_not_confirmed on login", () => {
    const r = mapSupabaseAuthError(
      { code: "email_not_confirmed", message: "Email not confirmed" },
      "login",
    );
    expect(r.code).toBe("email_not_confirmed");
  });

  it("includes safe code for unknown signup errors", () => {
    const r = mapSupabaseAuthError(
      { code: "weird_supabase_thing", message: "Something obscure happened" },
      "signup",
    );
    expect(r.message).toContain("Cod eroare: weird_supabase_thing");
    expect(r.code).toBe("weird_supabase_thing");
  });

  it("maps database error saving new user (HTTP 500)", () => {
    const r = mapSupabaseAuthError(
      {
        status: 500,
        message: "Database error saving new user",
      },
      "signup",
    );
    expect(r.code).toBe("database_error");
    expect(r.message).toContain("baza de date");
  });

  it("maps bare HTTP 500 with actionable Romanian copy", () => {
    const r = mapSupabaseAuthError({ status: 500, message: "" }, "signup");
    expect(r.code).toBe("http_500");
    expect(r.message).toContain("SMTP");
  });
});

describe("registerSchema", () => {
  it("accepts strong password", () => {
    const r = registerSchema.safeParse({
      full_name: "Ana Pop",
      email: "ana@example.com",
      password: "Secret1a",
      accept_terms: true,
      accept_privacy: true,
      marketing: false,
      analytics: false,
    });
    expect(r.success).toBe(true);
  });

  it("rejects weak password", () => {
    const r = registerSchema.safeParse({
      full_name: "Ana Pop",
      email: "ana@example.com",
      password: "short",
      accept_terms: true,
      accept_privacy: true,
      marketing: false,
      analytics: false,
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const r = registerSchema.safeParse({
      full_name: "Ana Pop",
      email: "not-an-email",
      password: "Secret1a",
      accept_terms: true,
      accept_privacy: true,
      marketing: false,
      analytics: false,
    });
    expect(r.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("requires matching confirmation", () => {
    const ok = resetPasswordSchema.safeParse({
      password: "Secret1a",
      confirm_password: "Secret1a",
    });
    expect(ok.success).toBe(true);

    const bad = resetPasswordSchema.safeParse({
      password: "Secret1a",
      confirm_password: "Other1a",
    });
    expect(bad.success).toBe(false);
  });
});

describe("auth callback destinations", () => {
  it("blocks external redirects", () => {
    expect(getSafeNextPath("https://evil.com", "/dashboard")).toBe("/dashboard");
  });

  it("routes successful confirmation to onboarding", () => {
    expect(
      resolveAuthCallbackDestination({
        next: "/dashboard/onboarding",
        onboardingCompleted: false,
        authType: "signup",
      }),
    ).toBe("/dashboard/onboarding");
  });

  it("routes recovery to reset-password", () => {
    expect(
      resolveAuthCallbackDestination({
        next: "/dashboard/onboarding",
        onboardingCompleted: false,
        authType: "recovery",
      }),
    ).toBe(PASSWORD_RESET_PATH);
  });
});
