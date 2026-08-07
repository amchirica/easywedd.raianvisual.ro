/** Allowlisted dashboard routes for assistant deep-links. */

export const ASSISTANT_ALLOWED_ROUTES = [
  "/dashboard",
  "/dashboard/wedding",
  "/dashboard/planner",
  "/dashboard/budget",
  "/dashboard/guests",
  "/dashboard/seating",
  "/dashboard/vendors",
  "/dashboard/timeline",
  "/dashboard/contacts",
  "/dashboard/invitations",
  "/dashboard/website",
  "/dashboard/billing",
  "/dashboard/privacy",
  "/dashboard/settings",
] as const;

export type AssistantAllowedRoute = (typeof ASSISTANT_ALLOWED_ROUTES)[number];

export function isAllowedAssistantRoute(href: string): href is AssistantAllowedRoute {
  if (!href.startsWith("/dashboard")) return false;
  // Exact allowlist or known nested prefixes under invitations/website list hubs only
  if ((ASSISTANT_ALLOWED_ROUTES as readonly string[]).includes(href)) return true;
  return false;
}

export function normalizeAssistantPathname(pathname: string): string {
  const clean = pathname.split("?")[0]?.split("#")[0] || "/dashboard";
  if (!clean.startsWith("/dashboard")) return "/dashboard";
  // Map nested invitation/website editor paths to their hub for context
  if (clean.startsWith("/dashboard/invitations")) return "/dashboard/invitations";
  if (clean.startsWith("/dashboard/website")) return "/dashboard/website";
  if (clean.startsWith("/dashboard/billing")) return "/dashboard/billing";
  if (clean.startsWith("/dashboard/onboarding")) return "/dashboard";
  return clean;
}

export function resolveAssistantRoute(href: string): AssistantAllowedRoute | null {
  if (!href.startsWith("/dashboard")) return null;
  const normalized = normalizeAssistantPathname(href);
  return isAllowedAssistantRoute(normalized) ? normalized : null;
}
