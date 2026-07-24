import type { EntitlementKey } from "@/lib/entitlements/keys";
import { NAV_FEATURE_MAP } from "@/lib/entitlements/policy";
import { canAccessFeature } from "@/lib/planner/access";

/** Serializable icon keys — resolve to Lucide components only in Client Components */
export type NavIconKey =
  | "dashboard"
  | "wedding"
  | "planner"
  | "budget"
  | "guests"
  | "seating"
  | "vendors"
  | "timeline"
  | "contacts"
  | "invitations"
  | "website"
  | "billing"
  | "privacy"
  | "settings";

export type NavItem = {
  href: string;
  label: string;
  iconKey: NavIconKey;
  featureKey?: EntitlementKey | null;
  locked?: boolean;
};

export const dashboardNav: NavItem[] = [
  { href: "/dashboard", label: "Prezentare", iconKey: "dashboard" },
  {
    href: "/dashboard/wedding",
    label: "Nunta",
    iconKey: "wedding",
    featureKey: "planner",
  },
  {
    href: "/dashboard/planner",
    label: "Planner",
    iconKey: "planner",
    featureKey: "planner",
  },
  {
    href: "/dashboard/budget",
    label: "Buget",
    iconKey: "budget",
    featureKey: "budget",
  },
  {
    href: "/dashboard/guests",
    label: "Invitați",
    iconKey: "guests",
    featureKey: "guests",
  },
  {
    href: "/dashboard/seating",
    label: "Seating",
    iconKey: "seating",
    featureKey: "seating",
  },
  {
    href: "/dashboard/vendors",
    label: "Furnizori",
    iconKey: "vendors",
    featureKey: "vendors",
  },
  {
    href: "/dashboard/timeline",
    label: "Timeline",
    iconKey: "timeline",
    featureKey: "planner",
  },
  {
    href: "/dashboard/contacts",
    label: "Contacte",
    iconKey: "contacts",
    featureKey: "planner",
  },
  {
    href: "/dashboard/invitations",
    label: "Invitații",
    iconKey: "invitations",
    featureKey: "invitations",
  },
  {
    href: "/dashboard/website",
    label: "Website",
    iconKey: "website",
    featureKey: "website",
  },
  { href: "/dashboard/billing", label: "Abonament", iconKey: "billing" },
  { href: "/dashboard/privacy", label: "Privacy", iconKey: "privacy" },
  { href: "/dashboard/settings", label: "Setări", iconKey: "settings" },
];

export function filterDashboardNav(
  entitlements: { feature_key: string; enabled: boolean }[],
  options?: { showLocked?: boolean },
): NavItem[] {
  const showLocked = options?.showLocked ?? true;
  return dashboardNav
    .map((item) => {
      const key =
        item.featureKey ??
        (NAV_FEATURE_MAP[item.href] as EntitlementKey | null | undefined);
      if (!key) return { ...item, locked: false };
      const allowed = canAccessFeature(entitlements, key);
      return { ...item, locked: !allowed, featureKey: key };
    })
    .filter((item) => showLocked || !item.locked);
}
