import { describe, expect, it } from "vitest";

import {
  INVALID_STRIPE_PRICE_MESSAGE,
  isValidStripePriceId,
  isValidStripeProductId,
  looksLikeStripeProductId,
  resolveStripePriceId,
} from "@/lib/billing/stripe-ids";

describe("isValidStripePriceId", () => {
  it("accepts price_ ids", () => {
    expect(isValidStripePriceId("price_1ABC123xyz")).toBe(true);
  });

  it("rejects product ids and empty", () => {
    expect(isValidStripePriceId("prod_UvDfkcwllSETvl")).toBe(false);
    expect(isValidStripePriceId("")).toBe(false);
    expect(isValidStripePriceId(null)).toBe(false);
  });
});

describe("isValidStripeProductId", () => {
  it("accepts prod_ ids", () => {
    expect(isValidStripeProductId("prod_UvDfkcwllSETvl")).toBe(true);
  });

  it("rejects price ids", () => {
    expect(isValidStripeProductId("price_1ABC")).toBe(false);
  });
});

describe("resolveStripePriceId", () => {
  it("prefers first valid price id and skips product ids", () => {
    const result = resolveStripePriceId([
      null,
      "prod_xxx",
      "price_ValidOne",
      "price_Other",
    ]);
    expect(result).toEqual({ priceId: "price_ValidOne" });
  });

  it("errors when only a product id is configured", () => {
    const result = resolveStripePriceId(["prod_UvDfkcwllSETvl"]);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("Product ID");
    }
  });

  it("returns price when candidates are valid", () => {
    const result = resolveStripePriceId([null, "", "price_Abc123"]);
    expect(result).toEqual({ priceId: "price_Abc123" });
  });

  it("returns friendly message when nothing configured", () => {
    expect(resolveStripePriceId([null, undefined, ""])).toEqual({
      error: INVALID_STRIPE_PRICE_MESSAGE,
    });
  });
});

describe("looksLikeStripeProductId", () => {
  it("detects prod_ prefix", () => {
    expect(looksLikeStripeProductId("prod_UvDfkcwllSETvl")).toBe(true);
    expect(looksLikeStripeProductId("price_x")).toBe(false);
  });
});
