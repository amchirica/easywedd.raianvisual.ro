import { describe, expect, it } from "vitest";

import { raianVisualUrl } from "@/lib/marketing/raian-visual";

describe("raianVisualUrl", () => {
  it("adds UTM params for landing home", () => {
    const url = new URL(raianVisualUrl("/", "landing"));
    expect(url.origin).toBe("https://raianvisual.ro");
    expect(url.searchParams.get("utm_source")).toBe("easywedd");
    expect(url.searchParams.get("utm_medium")).toBe("referral");
    expect(url.searchParams.get("utm_campaign")).toBe("platform_cross_promo");
    expect(url.searchParams.get("utm_content")).toBe("landing");
  });

  it("preserves path for gallery/vendors", () => {
    const url = new URL(raianVisualUrl("/gallery", "vendors"));
    expect(url.pathname).toBe("/gallery");
    expect(url.searchParams.get("utm_content")).toBe("vendors");
  });
});
