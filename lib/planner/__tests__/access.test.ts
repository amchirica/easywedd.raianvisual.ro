import { describe, expect, it } from "vitest";

import {
  canAccessFeature,
  canManageGuests,
  canManagePlanner,
} from "@/lib/planner/access";

describe("canManagePlanner", () => {
  it("permite owner/partner/wedding_planner/admin", () => {
    expect(canManagePlanner("owner")).toBe(true);
    expect(canManagePlanner("partner")).toBe(true);
    expect(canManagePlanner("wedding_planner")).toBe(true);
    expect(canManagePlanner("admin")).toBe(true);
  });

  it("refuză collaborator și guest_manager", () => {
    expect(canManagePlanner("collaborator")).toBe(false);
    expect(canManagePlanner("guest_manager")).toBe(false);
    expect(canManagePlanner(null)).toBe(false);
  });
});

describe("canManageGuests", () => {
  it("include guest_manager", () => {
    expect(canManageGuests("guest_manager")).toBe(true);
    expect(canManageGuests("owner")).toBe(true);
    expect(canManageGuests("photographer")).toBe(false);
  });
});

describe("canAccessFeature", () => {
  it("default true dacă lipsește entitlement", () => {
    expect(canAccessFeature([], "planner")).toBe(true);
  });

  it("respectă enabled=false", () => {
    expect(
      canAccessFeature([{ feature_key: "budget", enabled: false }], "budget"),
    ).toBe(false);
  });
});
