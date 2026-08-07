export const APP_NAME = "EasyWedd";
export const APP_TAGLINE = "Organizează nunta. Fără haos.";
export const EASYWEDD_PRO_URL = "https://easyweddpro.raianvisual.ro";
export const SUPPORT_EMAIL = "raian.visual@yahoo.com";
export const CONSENT_VERSION = "2026-07-01";
export const WORKSPACE_COOKIE = "ew_workspace_id";
export const DEFAULT_LOCALE = "ro";
export const DEFAULT_TIMEZONE = "Europe/Bucharest";
export const DEFAULT_CURRENCY = "RON";
export const TRIAL_DAYS = 14;

export const DEFAULT_FEATURE_KEYS = [
  "planner",
  "invitations",
  "website",
  "guests",
  "budget",
  "vendors",
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

export type FeatureKey = (typeof DEFAULT_FEATURE_KEYS)[number];
