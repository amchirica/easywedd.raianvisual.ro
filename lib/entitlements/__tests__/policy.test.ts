import { describe, expect, it } from "vitest";

import {
  FREE_PLAN_FEATURES,
  PREMIUM_PLAN_FEATURES,
  FEATURE_LABELS_RO,
  requiredPlanHint,
} from "@/lib/entitlements/policy";
import { canAccessFeature } from "@/lib/planner/access";
import { isFeatureEnabled } from "@/lib/entitlements/service";

describe("free vs premium entitlements policy", () => {
  it("defines six free basics and premium locks", () => {
    expect(FREE_PLAN_FEATURES).toHaveLength(6);
    expect(FREE_PLAN_FEATURES).toEqual(
      expect.arrayContaining([
        "planner",
        "guests",
        "budget",
        "invitations",
        "website",
        "wedding_limit",
      ]),
    );
    expect(PREMIUM_PLAN_FEATURES).toEqual(
      expect.arrayContaining([
        "vendors",
        "seating",
        "website_publish",
        "pdf_export",
        "premium_templates",
      ]),
    );
    for (const key of FREE_PLAN_FEATURES) {
      expect(FEATURE_LABELS_RO[key]).toBeTruthy();
    }
  });

  it("fails closed when entitlement row is missing", () => {
    expect(canAccessFeature([], "vendors")).toBe(false);
    expect(canAccessFeature([{ feature_key: "vendors", enabled: true }], "vendors")).toBe(
      true,
    );
    expect(
      isFeatureEnabled([{ feature_key: "seating", enabled: false }], "seating", false),
    ).toBe(false);
  });

  it("explains required plan in Romanian", () => {
    expect(requiredPlanHint("planner")).toContain("Gratuit");
    expect(requiredPlanHint("website_publish")).toMatch(/Starter|Essentials|Premium/);
  });
});
