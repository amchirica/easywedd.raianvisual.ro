import { describe, expect, it } from "vitest";

import {
  assertWithinLimit,
  isFeatureEnabled,
  invitationLimitsFromEntitlements,
} from "@/lib/entitlements/service";

describe("isFeatureEnabled", () => {
  it("reads enabled flag", () => {
    expect(
      isFeatureEnabled(
        [{ feature_key: "pdf_export", enabled: true }],
        "pdf_export",
      ),
    ).toBe(true);
    expect(
      isFeatureEnabled(
        [{ feature_key: "pdf_export", enabled: false }],
        "pdf_export",
      ),
    ).toBe(false);
  });
});

describe("assertWithinLimit", () => {
  it("enforces usage_limit", () => {
    const rows = [
      { feature_key: "invitation_projects", enabled: true, usage_limit: 1 },
    ];
    expect(assertWithinLimit(rows, "invitation_projects", 0)).toBe(true);
    expect(assertWithinLimit(rows, "invitation_projects", 1)).toBe(false);
  });
});

describe("invitationLimitsFromEntitlements", () => {
  it("maps branding and pdf from rows", () => {
    const limits = invitationLimitsFromEntitlements("premium", [
      { feature_key: "remove_branding", enabled: true },
      { feature_key: "pdf_export", enabled: true },
      { feature_key: "invitation_projects", enabled: true, usage_limit: 3 },
      { feature_key: "guest_limit", enabled: true, usage_limit: 500 },
      { feature_key: "premium_templates", enabled: true },
      { feature_key: "analytics", enabled: true },
    ]);
    expect(limits.watermark).toBe(false);
    expect(limits.allowPdf).toBe(true);
    expect(limits.maxProjects).toBe(3);
  });
});
