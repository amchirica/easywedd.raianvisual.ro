/** Cross-promo URLs for Raian Fine Arts / Raian Fine Arts. */

export const RAIAN_VISUAL_ORIGIN = "https://raianvisual.ro";

export type RaianPromoContent =
  | "landing"
  | "dashboard"
  | "vendors"
  | "onboarding"
  | "footer"
  | "planner"
  | "wedding";

const UTM = {
  utm_source: "easywedd",
  utm_medium: "referral",
  utm_campaign: "platform_cross_promo",
} as const;

export function raianVisualUrl(
  pathOrUrl: string,
  content: RaianPromoContent,
): string {
  const base = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${RAIAN_VISUAL_ORIGIN}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
  const url = new URL(base);
  url.searchParams.set("utm_source", UTM.utm_source);
  url.searchParams.set("utm_medium", UTM.utm_medium);
  url.searchParams.set("utm_campaign", UTM.utm_campaign);
  url.searchParams.set("utm_content", content);
  return url.toString();
}

export const RAIAN_LINKS = {
  home: (content: RaianPromoContent) => raianVisualUrl("/", content),
  gallery: (content: RaianPromoContent) => raianVisualUrl("/gallery", content),
  videos: (content: RaianPromoContent) => raianVisualUrl("/videos", content),
  contact: (content: RaianPromoContent) => raianVisualUrl("/contact", content),
} as const;
