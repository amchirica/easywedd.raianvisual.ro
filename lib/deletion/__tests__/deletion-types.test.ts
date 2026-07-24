import { describe, expect, it } from "vitest";

import { emptyImpact } from "@/lib/deletion/types";

describe("deletion contracts", () => {
  it("builds empty impact with defaults", () => {
    const impact = emptyImpact({
      resourceLabel: "website",
      resourceName: "/w/demo",
    });
    expect(impact.canSoftDelete).toBe(true);
    expect(impact.canHardDelete).toBe(true);
    expect(impact.typedConfirmPhrase).toBe("STERGE");
    expect(impact.items).toEqual([]);
  });

  it("allows overriding safety flags", () => {
    const impact = emptyImpact({
      resourceLabel: "utilizator",
      resourceName: "test@example.com",
      canSoftDelete: false,
      requiresTypedConfirm: true,
      blockers: ["Are workspace-uri"],
    });
    expect(impact.canSoftDelete).toBe(false);
    expect(impact.blockers).toHaveLength(1);
    expect(impact.requiresTypedConfirm).toBe(true);
  });
});
