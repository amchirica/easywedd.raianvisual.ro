import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getRuntimeEnv,
  getStripeEnvPresence,
  runtimeEnvPresent,
} from "@/lib/runtime-env";

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

  it("reports presence-only stripe diagnostics", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    vi.stubEnv("STRIPE_PRICE_STARTER_MONTHLY", "price_1");
    const presence = getStripeEnvPresence();
    expect(presence.STRIPE_SECRET_KEY).toBe(true);
    expect(presence.STRIPE_PRICE_STARTER_MONTHLY).toBe(true);
    expect(presence.STRIPE_WEBHOOK_SECRET).toBe(false);
  });
});
