import { afterEach, describe, expect, it } from "vitest";

import {
  accessEndsAtFromInterval,
  BILLING_PRODUCTS,
  getStripePriceId,
  mrrEstimateRon,
} from "@/lib/billing/catalog";

describe("BILLING_PRODUCTS", () => {
  it("maps premium pass to premium plan payment mode", () => {
    expect(BILLING_PRODUCTS.premium_pass_12.mapsToPlan).toBe("premium");
    expect(BILLING_PRODUCTS.premium_pass_12.mode).toBe("payment");
    expect(BILLING_PRODUCTS.premium_pass_18.interval).toBe("one_time_18m");
  });

  it("separates price vs product env var names", () => {
    expect(BILLING_PRODUCTS.premium_pass_18.envPriceId).toBe(
      "STRIPE_PRICE_PREMIUM_PASS_18",
    );
    expect(BILLING_PRODUCTS.premium_pass_18.envProductId).toBe(
      "STRIPE_PRODUCT_PREMIUM_PASS_18",
    );
  });
});

describe("getStripePriceId", () => {
  const envKey = BILLING_PRODUCTS.premium_pass_18.envPriceId;

  afterEach(() => {
    delete process.env[envKey];
  });

  it("rejects product ids stored in STRIPE_PRICE_*", () => {
    process.env[envKey] = "prod_UvDfkcwllSETvl";
    expect(getStripePriceId(BILLING_PRODUCTS.premium_pass_18)).toBeNull();
  });

  it("accepts price_ ids", () => {
    process.env[envKey] = "price_1TestPremium18";
    expect(getStripePriceId(BILLING_PRODUCTS.premium_pass_18)).toBe(
      "price_1TestPremium18",
    );
  });
});

describe("accessEndsAtFromInterval", () => {
  it("adds months for pass", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const ends = accessEndsAtFromInterval("one_time_12m", from);
    expect(ends).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("mrrEstimateRon", () => {
  it("returns catalog monthly for active plans", () => {
    expect(mrrEstimateRon("starter", "active")).toBe(49);
    expect(mrrEstimateRon("trial", "trialing")).toBe(0);
  });
});
