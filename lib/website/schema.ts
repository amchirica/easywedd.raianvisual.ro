import { z } from "zod";

import { CONTROLLED_FONTS } from "@/lib/invitations/fonts";
import type { SiteSectionConfig, SiteThemeConfig, WeddingSiteSectionType } from "@/types/website";

export const siteThemeSchema = z.object({
  background: z.string().min(4).max(32),
  foreground: z.string().min(4).max(32),
  accent: z.string().min(4).max(32),
  headingFont: z.enum(CONTROLLED_FONTS),
  bodyFont: z.enum(CONTROLLED_FONTS),
  density: z.enum(["compact", "comfortable", "spacious"]).optional(),
  radius: z.enum(["none", "sm", "md", "lg"]).optional(),
  pageGradientFrom: z.string().max(32).optional(),
  pageGradientTo: z.string().max(32).optional(),
  buttonBackground: z.string().max(32).optional(),
  buttonForeground: z.string().max(32).optional(),
});

export const siteSectionConfigSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().max(5000).optional(),
  imageUrl: z.string().max(500).optional(),
  mapUrl: z.string().max(500).optional(),
  rsvpUrl: z.string().max(500).optional(),
  items: z.array(z.string().max(300)).max(40).optional(),
  date: z.string().max(40).optional(),
  rich: z.record(z.string(), z.unknown()).optional(),
  style: z.record(z.string(), z.unknown()).optional(),
});

export function defaultSiteTheme(): SiteThemeConfig {
  return {
    background: "#F7F4EF",
    foreground: "#2A2420",
    accent: "#C4A574",
    headingFont: "Cormorant Garamond",
    bodyFont: "Source Sans 3",
  };
}

export function defaultSectionConfig(
  type: WeddingSiteSectionType,
  wedding?: {
    couple_name_1?: string | null;
    couple_name_2?: string | null;
    wedding_date?: string | null;
    venue_name?: string | null;
    city?: string | null;
  } | null,
): SiteSectionConfig {
  const couple = [wedding?.couple_name_1, wedding?.couple_name_2]
    .filter(Boolean)
    .join(" & ");

  switch (type) {
    case "hero":
      return {
        title: couple || "Nunta noastră",
        body: wedding?.wedding_date ?? "",
        imageUrl: "",
      };
    case "story":
      return {
        title: "Povestea noastră",
        body: "Ne bucurăm să vă invităm să sărbătoriți alături de noi.",
      };
    case "countdown":
      return { title: "Ne vedem în", date: wedding?.wedding_date ?? "" };
    case "schedule":
      return {
        title: "Programul evenimentului",
        items: [
          "Cununia",
          "Primirea invitaților",
          "Cina festivă",
          "Dansul mirilor",
          "Petrecerea",
        ],
      };
    case "locations":
      return {
        title: "Când și unde",
        body: [wedding?.venue_name, wedding?.city].filter(Boolean).join(", "),
        date: wedding?.wedding_date ?? "",
      };
    case "rsvp":
      return {
        title: "Confirmare participare",
        body: "Vă rugăm să confirmați prezența.",
        rsvpUrl: "",
      };
    case "dress_code":
      return {
        title: "Dress code",
        body: "Vă rugăm să alegeți ținute elegante, potrivite ocaziei.",
        items: ["#8B7355", "#F5F0E8", "#2C2416"],
      };
    case "accommodation":
      return {
        title: "Cazare",
        body: "Recomandări de cazare pentru invitații din afara orașului.",
      };
    case "transport":
      return {
        title: "Transport",
        body: "Informații despre deplasare și transferuri.",
      };
    case "gifts":
      return {
        title: "Daruri",
        body: "Prezența voastră este cel mai frumos cadou.",
      };
    case "faq":
      return {
        title: "Întrebări frecvente",
        items: [
          "Care este dress code-ul?",
          "Până când pot confirma participarea?",
        ],
      };
    case "family":
      return {
        title: "Cuplu & introducere",
        body: "Cu bucurie în inimă, vă invităm să fiți alături de noi.",
      };
    case "contact":
      return {
        title: "Cu drag,",
        body: couple || "",
      };
    case "gallery":
      return {
        title: "Galerie",
        items: [],
      };
    default:
      return { title: type.replaceAll("_", " "), body: "" };
  }
}

export function sanitizeSectionConfig(config: SiteSectionConfig): SiteSectionConfig {
  const strip = (v?: string) => v?.replace(/<[^>]*>/g, "").trim();
  return {
    ...config,
    title: strip(config.title),
    body: strip(config.body),
    imageUrl: strip(config.imageUrl),
    mapUrl: strip(config.mapUrl),
    rsvpUrl: strip(config.rsvpUrl),
    date: strip(config.date),
    items: config.items?.map((i) => i.replace(/<[^>]*>/g, "").trim()),
    rich: config.rich,
    style: config.style,
  };
}
