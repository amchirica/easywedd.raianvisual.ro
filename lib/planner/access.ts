import type { MemberRole } from "@/types/database";

const PLANNER_WRITE_ROLES: MemberRole[] = [
  "owner",
  "partner",
  "wedding_planner",
  "admin",
];

const GUEST_WRITE_ROLES: MemberRole[] = [
  "owner",
  "partner",
  "wedding_planner",
  "guest_manager",
  "admin",
];

export function canManagePlanner(role: MemberRole | null | undefined) {
  if (!role) return false;
  return PLANNER_WRITE_ROLES.includes(role);
}

export function canManageGuests(role: MemberRole | null | undefined) {
  if (!role) return false;
  return GUEST_WRITE_ROLES.includes(role);
}

export function canAccessFeature(
  entitlements: { feature_key: string; enabled: boolean }[],
  featureKey: string,
) {
  const row = entitlements.find((e) => e.feature_key === featureKey);
  if (!row) return true;
  return row.enabled;
}
