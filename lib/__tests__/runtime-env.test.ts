import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getRuntimeEnv,
  getRuntimeEnvDiagnostics,
  runtimeEnvPresent,
  STRIPE_PRICE_ENV_BY_PRODUCT,
} from "@/lib/runtime-env";
import { BILLING_PRODUCTS } from "@/lib/billing/catalog";

describe("getRuntimeEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads non-empty process.env by dynamic key", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", " sk_test_runtime ");
    expect(getRuntimeEnv("STRIPE_SECRET_KEY")).toBe("sk_test_runtime");
    expect(runtimeEnvPresent("STRIPE_SECRET_KEY")).toBe(true);
  });

  it("treats blank as missing", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "   ");
    expect(getRuntimeEnv("STRIPE_SECRET_KEY")).toBeUndefined();
  });

  it("reads NEXT_PUBLIC via static member fallback", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    expect(getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL")).toBe(
      "https://example.supabase.co",
    );
  });

  it("diagnostics never expose values", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_secret_value");
    const rows = getRuntimeEnvDiagnostics(["STRIPE_SECRET_KEY"]);
    expect(rows[0]).toEqual({
      key: "STRIPE_SECRET_KEY",
      present: true,
      length: "sk_test_secret_value".length,
    });
    expect(JSON.stringify(rows)).not.toContain("sk_test_secret_value");
  });

  it("reads from OpenNext ALS symbol when present", () => {
    const symbol = Symbol.for("__cloudflare-context__");
    const previous = Object.getOwnPropertyDescriptor(globalThis, symbol);
    Object.defineProperty(globalThis, symbol, {
      configurable: true,
      get() {
        return {
          env: { SUPABASE_SERVICE_ROLE_KEY: " service-role-from-als " },
        };
      },
    });
    try {
      expect(getRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY")).toBe(
        "service-role-from-als",
      );
    } finally {
      if (previous) Object.defineProperty(globalThis, symbol, previous);
      else Reflect.deleteProperty(globalThis, symbol);
    }
  });
});

describe("STRIPE_PRICE_ENV_BY_PRODUCT", () => {
  it("matches BILLING_PRODUCTS envPriceId for checkoutable plans", () => {
    expect(STRIPE_PRICE_ENV_BY_PRODUCT.starter).toBe(
      BILLING_PRODUCTS.starter.envPriceId,
    );
    expect(STRIPE_PRICE_ENV_BY_PRODUCT.pro).toBe(
      BILLING_PRODUCTS.pro.envPriceId,
    );
    expect(STRIPE_PRICE_ENV_BY_PRODUCT.premium_pass_12).toBe(
      BILLING_PRODUCTS.premium_pass_12.envPriceId,
    );
    expect(STRIPE_PRICE_ENV_BY_PRODUCT.premium_pass_18).toBe(
      BILLING_PRODUCTS.premium_pass_18.envPriceId,
    );
    expect(BILLING_PRODUCTS.premium_pass_12.envPriceId).toBe(
      "STRIPE_PRICE_PREMIUM_PASS_12",
    );
  });
});
