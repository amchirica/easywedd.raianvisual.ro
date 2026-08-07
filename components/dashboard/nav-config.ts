import type { EntitlementKey } from "@/lib/entitlements/keys";
import { NAV_FEATURE_MAP } from "@/lib/entitlements/policy";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
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

export type NavLabelKey = keyof Dictionary["nav"];

export type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  iconKey: NavIconKey;
  featureKey?: EntitlementKey | null;
  locked?: boolean;
};

export const dashboardNav: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", iconKey: "dashboard" },
  {
    href: "/dashboard/wedding",
    labelKey: "wedding",
    iconKey: "wedding",
    featureKey: "planner",
  },
  {
    href: "/dashboard/planner",
    labelKey: "planner",
    iconKey: "planner",
    featureKey: "planner",
  },
  {
    href: "/dashboard/budget",
    labelKey: "budget",
    iconKey: "budget",
    featureKey: "budget",
  },
  {
    href: "/dashboard/guests",
    labelKey: "guests",
    iconKey: "guests",
    featureKey: "guests",
  },
  {
    href: "/dashboard/seating",
    labelKey: "seating",
    iconKey: "seating",
    featureKey: "seating",
  },
  {
    href: "/dashboard/vendors",
    labelKey: "vendors",
    iconKey: "vendors",
    featureKey: "vendors",
  },
  {
    href: "/dashboard/timeline",
    labelKey: "timeline",
    iconKey: "timeline",
    featureKey: "planner",
  },
  {
    href: "/dashboard/contacts",
    labelKey: "contacts",
    iconKey: "contacts",
    featureKey: "planner",
  },
  {
    href: "/dashboard/invitations",
    labelKey: "invitations",
    iconKey: "invitations",
    featureKey: "invitations",
  },
  {
    href: "/dashboard/website",
    labelKey: "website",
    iconKey: "website",
    featureKey: "website",
  },
  { href: "/dashboard/billing", labelKey: "billing", iconKey: "billing" },
  { href: "/dashboard/privacy", labelKey: "privacy", iconKey: "privacy" },
  { href: "/dashboard/settings", labelKey: "settings", iconKey: "settings" },
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
