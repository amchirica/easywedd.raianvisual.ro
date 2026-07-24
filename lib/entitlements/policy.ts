import type { EntitlementKey } from "@/lib/entitlements/keys";

/**
 * Free plan — 6 basic capabilities (everything else is premium).
 * Source of truth for product messaging; DB billing_plans.free must match.
 */
export const FREE_PLAN_FEATURES = [
  "planner",
  "guests",
  "budget",
  "invitations",
  "website",
  "wedding_limit",
] as const satisfies readonly EntitlementKey[];

/** Premium / paid-only capabilities */
export const PREMIUM_PLAN_FEATURES = [
  "vendors",
  "seating",
  "website_publish",
  "pdf_export",
  "premium_templates",
  "remove_branding",
  "custom_domain",
  "analytics",
  "white_label",
] as const satisfies readonly EntitlementKey[];

export const FREE_PLAN_LIMITS = {
  guest_limit: 30,
  invitation_projects: 1,
  collaborator_limit: 1,
  storage_mb: 200,
  wedding_limit: 1,
} as const;

export const FEATURE_LABELS_RO: Record<EntitlementKey, string> = {
  planner: "Planner & sarcini",
  invitations: "Invitații digitale",
  website: "Website de nuntă (draft)",
  guests: "Lista de invitați",
  budget: "Buget",
  vendors: "Furnizori",
  seating: "Aranjare mese",
  guest_limit: "Limită invitați",
  invitation_projects: "Proiecte invitații",
  remove_branding: "Fără branding EasyWedd",
  pdf_export: "Export PDF",
  website_publish: "Publicare website",
  custom_domain: "Domeniu personalizat",
  premium_templates: "Șabloane premium",
  analytics: "Analize avansate",
  collaborator_limit: "Colaboratori",
  storage_limit: "Spațiu stocare",
  wedding_limit: "Nunți / workspace",
  white_label: "White label",
};

export const NAV_FEATURE_MAP: Record<string, EntitlementKey | null> = {
  "/dashboard": null,
  "/dashboard/wedding": "planner",
  "/dashboard/planner": "planner",
  "/dashboard/budget": "budget",
  "/dashboard/guests": "guests",
  "/dashboard/seating": "seating",
  "/dashboard/vendors": "vendors",
  "/dashboard/timeline": "planner",
  "/dashboard/contacts": "planner",
  "/dashboard/invitations": "invitations",
  "/dashboard/website": "website",
  "/dashboard/billing": null,
  "/dashboard/privacy": null,
  "/dashboard/settings": null,
};

export function requiredPlanHint(feature: EntitlementKey): string {
  if ((FREE_PLAN_FEATURES as readonly string[]).includes(feature)) {
    return "Inclus în planul Gratuit";
  }
  return "Necesită plan Starter, Essentials sau Premium";
}
