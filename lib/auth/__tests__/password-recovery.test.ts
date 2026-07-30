import { describe, expect, it } from "vitest";

import {
  authCallbackErrorPath,
  getSafeNextPath,
  hasRecoveryAmr,
  isPasswordRecoveryNext,
  PASSWORD_RESET_PATH,
  resolveAuthCallbackDestination,
} from "@/lib/auth/callback-destination";
import { passwordStrengthChecks, resetPasswordSchema } from "@/lib/validations/auth";

describe("getSafeNextPath", () => {
  it("accepts internal paths", () => {
    expect(getSafeNextPath("/auth/reset-password")).toBe(PASSWORD_RESET_PATH);
    expect(getSafeNextPath("/dashboard")).toBe("/dashboard");
    expect(getSafeNextPath("/invite/abc")).toBe("/invite/abc");
  });

  it("rejects external and protocol-relative URLs", () => {
    expect(getSafeNextPath("https://evil.com", "/dashboard")).toBe("/dashboard");
    expect(getSafeNextPath("//evil.com", "/dashboard")).toBe("/dashboard");
    expect(getSafeNextPath("javascript:alert(1)", "/dashboard")).toBe(
      "/dashboard",
    );
  });

  it("normalizes legacy recovery paths", () => {
    expect(getSafeNextPath("/update-password")).toBe(PASSWORD_RESET_PATH);
    expect(getSafeNextPath("/auth/update-password")).toBe(PASSWORD_RESET_PATH);
  });
});

describe("resolveAuthCallbackDestination", () => {
  it("redirects recovery to reset-password, not onboarding", () => {
    expect(
      resolveAuthCallbackDestination({
        next: "/dashboard/onboarding",
        onboardingCompleted: false,
        authType: "recovery",
      }),
    ).toBe(PASSWORD_RESET_PATH);

    expect(
      resolveAuthCallbackDestination({
        next: PASSWORD_RESET_PATH,
        onboardingCompleted: false,
        authType: null,
      }),
    ).toBe(PASSWORD_RESET_PATH);

    expect(
      resolveAuthCallbackDestination({
        next: "/dashboard",
        onboardingCompleted: false,
        authType: null,
        isRecoverySession: true,
      }),
    ).toBe(PASSWORD_RESET_PATH);
  });

  it("keeps invite and onboarding for normal signups", () => {
    expect(
      resolveAuthCallbackDestination({
        next: "/invite/token",
        onboardingCompleted: false,
        authType: "signup",
      }),
    ).toBe("/invite/token");

    expect(
      resolveAuthCallbackDestination({
        next: "/dashboard/onboarding",
        onboardingCompleted: false,
        authType: null,
      }),
    ).toBe("/dashboard/onboarding");

    expect(
      resolveAuthCallbackDestination({
        next: "/dashboard",
        onboardingCompleted: true,
        authType: null,
      }),
    ).toBe("/dashboard");
  });

  it("does not send recovery to / or dashboard", () => {
    const dest = resolveAuthCallbackDestination({
      next: "/",
      onboardingCompleted: true,
      authType: "recovery",
    });
    expect(dest).toBe(PASSWORD_RESET_PATH);
    expect(dest).not.toBe("/");
    expect(dest).not.toBe("/dashboard");
  });
});

describe("hasRecoveryAmr / isPasswordRecoveryNext", () => {
  it("detects recovery AMR", () => {
    expect(hasRecoveryAmr([{ method: "recovery", timestamp: 1 }])).toBe(true);
    expect(hasRecoveryAmr([{ method: "password" }])).toBe(false);
    expect(hasRecoveryAmr(null)).toBe(false);
  });

  it("detects recovery next paths", () => {
    expect(isPasswordRecoveryNext(PASSWORD_RESET_PATH)).toBe(true);
    expect(isPasswordRecoveryNext("/update-password")).toBe(true);
    expect(isPasswordRecoveryNext("/dashboard")).toBe(false);
  });
});

describe("authCallbackErrorPath", () => {
  it("builds error path with reason", () => {
    expect(authCallbackErrorPath("invalid_or_expired_link")).toBe(
      "/auth/error?reason=invalid_or_expired_link",
    );
  });
});

describe("resetPasswordSchema", () => {
  it("rejects weak passwords", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "short",
        confirm_password: "short",
      }).success,
    ).toBe(false);

    expect(
      resetPasswordSchema.safeParse({
        password: "alllowercase1",
        confirm_password: "alllowercase1",
      }).success,
    ).toBe(false);

    expect(
      resetPasswordSchema.safeParse({
        password: "NoNumberHere",
        confirm_password: "NoNumberHere",
      }).success,
    ).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "ValidPass1",
      confirm_password: "ValidPass2",
    });
    expect(result.success).toBe(false);
  });

  it("accepts strong matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "ValidPass1",
      confirm_password: "ValidPass1",
    });
    expect(result.success).toBe(true);
  });
});

describe("passwordStrengthChecks", () => {
  it("reports individual rules", () => {
    expect(passwordStrengthChecks("Ab1")).toEqual({
      minLength: false,
      uppercase: true,
      lowercase: true,
      number: true,
    });
    expect(passwordStrengthChecks("ValidPass1").minLength).toBe(true);
  });
});

describe("password reset redirect URL helper", () => {
  it("builds confirm URL with reset-password next via getPasswordResetCallbackUrl", async () => {
    const prevSite = process.env.NEXT_PUBLIC_SITE_URL;
    const prevApp = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://easywedd.raianvisual.ro";
    process.env.NEXT_PUBLIC_APP_URL = "https://easywedd.raianvisual.ro";
    const { getPasswordResetCallbackUrl, getAuthConfirmUrl } = await import(
      "@/lib/url"
    );
    const url = getPasswordResetCallbackUrl();
    expect(url).toBe(
      "https://easywedd.raianvisual.ro/auth/confirm?next=%2Fauth%2Freset-password",
    );
    expect(getAuthConfirmUrl("/dashboard")).toBe(
      "https://easywedd.raianvisual.ro/auth/confirm?next=%2Fdashboard",
    );
    if (prevSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prevSite;
    if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevApp;
  });

  it("ignores localhost APP_URL when a production SITE_URL is set", async () => {
    const prevSite = process.env.NEXT_PUBLIC_SITE_URL;
    const prevApp = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://easywedd.raianvisual.ro";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    const { getSiteUrl } = await import("@/lib/url");
    expect(getSiteUrl()).toBe("https://easywedd.raianvisual.ro");
    if (prevSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prevSite;
    if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevApp;
  });
});
