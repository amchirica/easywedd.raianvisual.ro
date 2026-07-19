import { describe, expect, it } from "vitest";

import {
  canCreateProject,
  getInvitationLimits,
  tierFromPlan,
} from "@/lib/invitations/plan-limits";

describe("tierFromPlan", () => {
  it("maps plans to tiers", () => {
    expect(tierFromPlan("trial")).toBe("starter");
    expect(tierFromPlan("starter")).toBe("starter");
    expect(tierFromPlan("essentials")).toBe("premium");
    expect(tierFromPlan("premium")).toBe("premium");
    expect(tierFromPlan("agency")).toBe("pro");
  });
});

describe("getInvitationLimits", () => {
  it("starter has watermark and 1 project", () => {
    const limits = getInvitationLimits("trial");
    expect(limits.maxProjects).toBe(1);
    expect(limits.watermark).toBe(true);
    expect(limits.allowPdf).toBe(false);
    expect(limits.maxRecipients).toBe(50);
  });

  it("premium unlocks PDF and 3 projects", () => {
    const limits = getInvitationLimits("premium");
    expect(limits.maxProjects).toBe(3);
    expect(limits.watermark).toBe(false);
    expect(limits.allowPdf).toBe(true);
    expect(limits.maxRecipients).toBe(500);
  });
});

describe("canCreateProject", () => {
  it("blocks over limit", () => {
    expect(canCreateProject(1, "starter")).toBe(false);
    expect(canCreateProject(0, "starter")).toBe(true);
    expect(canCreateProject(2, "premium")).toBe(true);
  });
});
