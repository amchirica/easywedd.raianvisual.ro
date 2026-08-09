import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isLocalBillingBypassAllowed,
  isStripeConfigured,
} from "@/lib/billing/plans";

describe("isStripeConfigured", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires a non-empty secret key only", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "");
    expect(isStripeConfigured()).toBe(false);

    vi.stubEnv("STRIPE_SECRET_KEY", "  sk_test_x  ");
    expect(isStripeConfigured()).toBe(true);
  });

  it("allows local bypass only outside production without Stripe", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(isLocalBillingBypassAllowed()).toBe(true);

    vi.stubEnv("NODE_ENV", "production");
    expect(isLocalBillingBypassAllowed()).toBe(false);

    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    expect(isLocalBillingBypassAllowed()).toBe(false);
  });
});
