export const ENTITLEMENT_KEYS = [
  "planner",
  "invitations",
  "website",
  "guests",
  "budget",
  "vendors",
  "seating",
  "guest_limit",
  "invitation_projects",
  "remove_branding",
  "pdf_export",
  "website_publish",
  "custom_domain",
  "premium_templates",
  "analytics",
  "collaborator_limit",
  "storage_limit",
  "wedding_limit",
  "white_label",
] as const;

export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[number];

export function isEntitlementKey(value: string): value is EntitlementKey {
  return (ENTITLEMENT_KEYS as readonly string[]).includes(value);
}
