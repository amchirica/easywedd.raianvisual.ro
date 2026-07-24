import { z } from "zod";

import { CONTROLLED_FONTS } from "@/lib/invitations/fonts";
import { normalizeTemplateSchema } from "@/lib/builder/template-schema";
import {
  normalizeInvitationContent,
  normalizeSectionOrder,
} from "@/lib/invitations/sections";
import type {
  InvitationContentConfig,
  InvitationSectionKey,
  InvitationThemeConfig,
} from "@/types/invitations";

export const themeConfigSchema = z.object({
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

/**
 * Loose schema: accept legacy + advanced payloads, then normalize to V2.
 * Unknown section keys in enabledSections are mapped or dropped safely.
 */
export const contentConfigSchema = z
  .object({
    coupleName1: z.string().max(80).optional(),
    coupleName2: z.string().max(80).optional(),
    weddingDate: z.string().max(40).optional(),
    weddingTime: z.string().max(40).optional(),
    ceremonyLocation: z.string().max(200).optional(),
    receptionLocation: z.string().max(200).optional(),
    scheduleText: z.string().max(5000).optional(),
    parentsText: z.string().max(500).optional(),
    godparentsText: z.string().max(500).optional(),
    dressCode: z.string().max(1000).optional(),
    travelInfo: z.string().max(2000).optional(),
    accommodationInfo: z.string().max(2000).optional(),
    mapUrl: z.string().max(500).optional(),
    heroImageUrl: z.string().max(500).optional(),
    introText: z.string().max(2000).optional(),
    rsvpMessage: z.string().max(1000).optional(),
    footerText: z.string().max(500).optional(),
    enabledSections: z.array(z.string()).min(1).optional(),
    sectionOrder: z.array(z.string()).optional(),
    sections: z.record(z.string(), z.unknown()).optional(),
    sectionStyles: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()
  .transform((raw) => normalizeInvitationContent(raw));

function sanitizeDeep(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/<[^>]*>/g, "").trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeDeep);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        sanitizeDeep(v),
      ]),
    );
  }
  return value;
}

export function sanitizePlainText(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

export function sanitizeContent(
  content: InvitationContentConfig,
): InvitationContentConfig {
  return sanitizeDeep(content) as InvitationContentConfig;
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

export function defaultContent(
  partial?: Partial<InvitationContentConfig> & {
    enabledSections?: InvitationSectionKey[];
  },
): InvitationContentConfig {
  const order = normalizeSectionOrder(
    (partial?.sectionOrder as string[] | undefined) ??
      (partial?.enabledSections as string[] | undefined) ??
      [
        "hero",
        "couple",
        "when_where",
        "timeline",
        "dress_code",
        "transport",
        "rsvp",
        "footer",
      ],
  );

  return normalizeInvitationContent(
    {
      ...partial,
      sectionOrder: order,
      enabledSections: order,
    },
    {
      wedding: {
        couple_name_1: partial?.coupleName1,
        couple_name_2: partial?.coupleName2,
        wedding_date: partial?.weddingDate,
      },
      templateSections: order,
    },
  );
}

export function mergeTemplateDefaults(
  templateTheme?: Partial<InvitationThemeConfig>,
  templateSections?: InvitationSectionKey[] | string[],
  wedding?: {
    couple_name_1?: string | null;
    couple_name_2?: string | null;
    wedding_date?: string | null;
    venue_name?: string | null;
    city?: string | null;
  } | null,
  templateSchema?: unknown,
) {
  const normalizedTpl = templateSchema
    ? normalizeTemplateSchema(templateSchema)
    : null;

  const theme = themeConfigSchema.parse({
    ...defaultTheme(),
    ...(normalizedTpl?.theme ?? {}),
    ...templateTheme,
  });

  const order =
    normalizedTpl?.sectionOrder ??
    (templateSections as string[] | undefined);

  const content = normalizeInvitationContent(
    {
      coupleName1: wedding?.couple_name_1 ?? "",
      coupleName2: wedding?.couple_name_2 ?? "",
      weddingDate: wedding?.wedding_date ?? "",
      ceremonyLocation: [wedding?.venue_name, wedding?.city]
        .filter(Boolean)
        .join(", "),
      enabledSections: normalizedTpl?.enabledSections ?? templateSections,
      sectionOrder: order,
      sectionStyles: normalizedTpl?.sectionStyles,
      sections: normalizedTpl?.sectionDefaults
        ? Object.fromEntries(
            Object.entries(normalizedTpl.sectionDefaults).map(([k, v]) => [
              k,
              v,
            ]),
          )
        : undefined,
    },
    {
      wedding: {
        couple_name_1: wedding?.couple_name_1,
        couple_name_2: wedding?.couple_name_2,
        wedding_date: wedding?.wedding_date,
      },
      templateSections: order,
    },
  );

  return { theme, content };
}
