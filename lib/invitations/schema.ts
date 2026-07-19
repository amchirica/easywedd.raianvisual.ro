import { z } from "zod";

import { CONTROLLED_FONTS } from "@/lib/invitations/fonts";
import type {
  InvitationContentConfig,
  InvitationSectionKey,
  InvitationThemeConfig,
} from "@/types/invitations";

const sectionKeySchema = z.enum([
  "hero",
  "couple",
  "when_where",
  "schedule",
  "party",
  "dress_code",
  "travel",
  "rsvp",
  "footer",
]);

export const themeConfigSchema = z.object({
  background: z.string().min(4).max(32),
  foreground: z.string().min(4).max(32),
  accent: z.string().min(4).max(32),
  headingFont: z.enum(CONTROLLED_FONTS),
  bodyFont: z.enum(CONTROLLED_FONTS),
});

export const contentConfigSchema = z.object({
  coupleName1: z.string().max(80).default(""),
  coupleName2: z.string().max(80).default(""),
  weddingDate: z.string().max(40).default(""),
  weddingTime: z.string().max(40).default(""),
  ceremonyLocation: z.string().max(200).default(""),
  receptionLocation: z.string().max(200).default(""),
  scheduleText: z.string().max(2000).default(""),
  parentsText: z.string().max(500).default(""),
  godparentsText: z.string().max(500).default(""),
  dressCode: z.string().max(300).default(""),
  travelInfo: z.string().max(1000).default(""),
  accommodationInfo: z.string().max(1000).default(""),
  mapUrl: z.string().max(500).default(""),
  heroImageUrl: z.string().max(500).default(""),
  introText: z.string().max(1000).default(""),
  rsvpMessage: z.string().max(500).default(""),
  footerText: z.string().max(300).default(""),
  enabledSections: z.array(sectionKeySchema).min(1),
});

export function sanitizePlainText(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

export function sanitizeContent(
  content: InvitationContentConfig,
): InvitationContentConfig {
  const entries = Object.entries(content).map(([key, value]) => {
    if (key === "enabledSections") return [key, value];
    if (typeof value === "string") return [key, sanitizePlainText(value)];
    return [key, value];
  });
  return Object.fromEntries(entries) as InvitationContentConfig;
}

export function defaultTheme(): InvitationThemeConfig {
  return {
    background: "#F7F4EF",
    foreground: "#2A2420",
    accent: "#C4A574",
    headingFont: "Cormorant Garamond",
    bodyFont: "Source Sans 3",
  };
}

export function defaultContent(partial?: Partial<InvitationContentConfig>): InvitationContentConfig {
  return {
    coupleName1: "",
    coupleName2: "",
    weddingDate: "",
    weddingTime: "",
    ceremonyLocation: "",
    receptionLocation: "",
    scheduleText: "",
    parentsText: "",
    godparentsText: "",
    dressCode: "",
    travelInfo: "",
    accommodationInfo: "",
    mapUrl: "",
    heroImageUrl: "",
    introText: "Cu bucurie vă invităm să sărbătoriți alături de noi.",
    rsvpMessage: "Vă rugăm să confirmați prezența.",
    footerText: "Cu drag,",
    enabledSections: [
      "hero",
      "couple",
      "when_where",
      "schedule",
      "party",
      "dress_code",
      "travel",
      "rsvp",
      "footer",
    ],
    ...partial,
  };
}

export function mergeTemplateDefaults(
  templateTheme?: Partial<InvitationThemeConfig>,
  templateSections?: InvitationSectionKey[],
  wedding?: {
    couple_name_1?: string | null;
    couple_name_2?: string | null;
    wedding_date?: string | null;
    venue_name?: string | null;
    city?: string | null;
  } | null,
) {
  const theme = themeConfigSchema.parse({
    ...defaultTheme(),
    ...templateTheme,
  });

  const content = defaultContent({
    coupleName1: wedding?.couple_name_1 ?? "",
    coupleName2: wedding?.couple_name_2 ?? "",
    weddingDate: wedding?.wedding_date ?? "",
    ceremonyLocation: [wedding?.venue_name, wedding?.city].filter(Boolean).join(", "),
    enabledSections: templateSections?.length
      ? templateSections
      : defaultContent().enabledSections,
  });

  return { theme, content };
}
