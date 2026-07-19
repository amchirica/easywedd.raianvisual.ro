import { describe, expect, it } from "vitest";

/** Mirrors SQL min cohort size for industry insights. */
export const INDUSTRY_MIN_COHORT = 20;

export function canPublishIndustryCohort(weddingCount: number) {
  return weddingCount >= INDUSTRY_MIN_COHORT;
}

describe("industry threshold", () => {
  it("blocks small cohorts", () => {
    expect(canPublishIndustryCohort(19)).toBe(false);
    expect(canPublishIndustryCohort(20)).toBe(true);
  });
});
