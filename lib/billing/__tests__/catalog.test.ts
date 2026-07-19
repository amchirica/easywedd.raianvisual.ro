import { describe, expect, it } from "vitest";

import {
  accessEndsAtFromInterval,
  BILLING_PRODUCTS,
  mrrEstimateRon,
} from "@/lib/billing/catalog";

describe("BILLING_PRODUCTS", () => {
  it("maps premium pass to premium plan payment mode", () => {
    expect(BILLING_PRODUCTS.premium_pass_12.mapsToPlan).toBe("premium");
    expect(BILLING_PRODUCTS.premium_pass_12.mode).toBe("payment");
    expect(BILLING_PRODUCTS.premium_pass_18.interval).toBe("one_time_18m");
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
