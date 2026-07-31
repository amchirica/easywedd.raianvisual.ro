import { describe, expect, it, beforeEach, afterEach } from "vitest";

import {
  mapConfirmOtpErrorCode,
  safeAuthNext,
} from "@/lib/auth/confirm-helpers";
import {
  getPasswordResetRedirectTo,
  getSignupEmailRedirectTo,
  getSiteUrl,
} from "@/lib/url";

describe("safeAuthNext — confirm email", () => {
  it("accepts type=email destination next=/dashboard", () => {
    expect(safeAuthNext("/dashboard", "/dashboard")).toBe("/dashboard");
  });

  it("accepts type=recovery destination next=/auth/reset-password", () => {
    expect(safeAuthNext("/auth/reset-password", "/dashboard")).toBe(
      "/auth/reset-password",
    );
  });

  it("falls back when params missing", () => {
    expect(safeAuthNext(null, "/dashboard")).toBe("/dashboard");
    expect(safeAuthNext(undefined, "/auth/reset-password")).toBe(
      "/auth/reset-password",
    );
    expect(safeAuthNext("", "/dashboard")).toBe("/dashboard");
  });

  it("blocks external redirects", () => {
    expect(safeAuthNext("https://evil.example", "/dashboard")).toBe(
      "/dashboard",
    );
    expect(safeAuthNext("//evil.example", "/dashboard")).toBe("/dashboard");
  });
});

describe("mapConfirmOtpErrorCode", () => {
  it("maps verifyOtp errors without collapsing all to invalid_or_expired_link", () => {
    expect(mapConfirmOtpErrorCode("otp_expired")).toBe("otp_expired");
    expect(mapConfirmOtpErrorCode("token_not_found")).toBe("token_not_found");
    expect(mapConfirmOtpErrorCode("access_denied")).toBe("access_denied");
    expect(mapConfirmOtpErrorCode("pkce_code_verifier_not_found")).toBe(
      "pkce_code_verifier_not_found",
    );
    expect(mapConfirmOtpErrorCode(undefined)).toBe("invalid_or_expired_link");
  });
});

describe("signUp / resetPassword redirect destinations", () => {
  const prevApp = process.env.NEXT_PUBLIC_APP_URL;
  const prevSite = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://easywedd.raianvisual.ro";
    process.env.NEXT_PUBLIC_SITE_URL = "https://easywedd.raianvisual.ro";
  });

  afterEach(() => {
    if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevApp;
    if (prevSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prevSite;
  });

  it("signup emailRedirectTo lands on /auth/confirm?next=/dashboard", () => {
    expect(getSignupEmailRedirectTo()).toBe(
      "https://easywedd.raianvisual.ro/auth/confirm?next=%2Fdashboard",
    );
  });

  it("reset redirectTo lands on /auth/confirm?next=/auth/reset-password", () => {
    expect(getPasswordResetRedirectTo()).toBe(
      "https://easywedd.raianvisual.ro/auth/confirm?next=%2Fauth%2Freset-password",
    );
  });

  it("getSiteUrl strips trailing slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://easywedd.raianvisual.ro/";
    expect(getSiteUrl()).toBe("https://easywedd.raianvisual.ro");
  });
});
