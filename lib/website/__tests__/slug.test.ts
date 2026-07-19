import { describe, expect, it } from "vitest";

import { isValidSiteSlug, slugifyCoupleNames } from "@/lib/website/slug";

describe("slugifyCoupleNames", () => {
  it("builds romanian-friendly slug", () => {
    expect(slugifyCoupleNames("Andrei", "Maria")).toBe("andrei-si-maria");
    expect(slugifyCoupleNames("Ștefan", "Ioana")).toBe("stefan-si-ioana");
  });
});

describe("isValidSiteSlug", () => {
  it("validates slug format", () => {
    expect(isValidSiteSlug("andrei-si-maria")).toBe(true);
    expect(isValidSiteSlug("AB")).toBe(false);
    expect(isValidSiteSlug("bad slug")).toBe(false);
  });
});
