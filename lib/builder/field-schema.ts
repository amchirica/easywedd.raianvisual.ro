/**
 * Schema-driven field definitions for the visual builder.
 * Content fields + presentation fields are declared here; UI is generated from them.
 */

import type { CanonicalSectionKey } from "@/lib/invitations/sections/types";
import {
  ALIGN_OPTIONS,
  ANIMATION_OPTIONS,
  COUNTDOWN_STYLES,
  DENSITY_OPTIONS,
  DIVIDER_OPTIONS,
  GALLERY_LAYOUTS,
  HERO_VARIANTS,
  OVERLAY_OPTIONS,
  PADDING_Y_OPTIONS,
  RADIUS_OPTIONS,
  SECTION_VARIANTS,
  TIMELINE_LAYOUTS,
} from "@/lib/builder/presentation";
import { CONTROLLED_FONTS } from "@/lib/invitations/fonts";

export type FieldType =
  | "text"
  | "textarea"
  | "url"
  | "date"
  | "time"
  | "color"
  | "boolean"
  | "select"
  | "number";

export type FieldDef = {
  path: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  group?: string;
  /** Section keys that show this presentation field (empty = all) */
  sectionKeys?: CanonicalSectionKey[];
};

const enumOptions = (values: readonly string[], labels?: Record<string, string>) =>
  values.map((value) => ({
    value,
    label: labels?.[value] ?? value,
  }));

/** Presentation fields editable for every section */
export const PRESENTATION_FIELD_SCHEMA: FieldDef[] = [
  {
    path: "align",
    label: "Aliniere",
    type: "select",
    group: "Layout",
    options: enumOptions(ALIGN_OPTIONS, {
      left: "Stânga",
      center: "Centru",
      right: "Dreapta",
    }),
  },
  {
    path: "paddingY",
    label: "Spațiere verticală",
    type: "select",
    group: "Layout",
    options: enumOptions(PADDING_Y_OPTIONS, {
      sm: "Compact",
      md: "Mediu",
      lg: "Generos",
      xl: "Foarte generos",
    }),
  },
  {
    path: "variant",
    label: "Variantă secțiune",
    type: "select",
    group: "Layout",
    options: enumOptions(SECTION_VARIANTS, {
      default: "Implicit",
      band: "Bandă",
      split: "Split",
      card: "Card",
      fullscreen: "Fullscreen",
    }),
  },
  {
    path: "heroVariant",
    label: "Variantă hero",
    type: "select",
    group: "Layout",
    sectionKeys: ["hero"],
    options: enumOptions(HERO_VARIANTS, {
      centered: "Centrat",
      overlay: "Overlay",
      split: "Split",
      minimal: "Minimal",
    }),
  },
  {
    path: "galleryLayout",
    label: "Layout galerie",
    type: "select",
    group: "Layout",
    sectionKeys: ["gallery"],
    options: enumOptions(GALLERY_LAYOUTS),
  },
  {
    path: "timelineLayout",
    label: "Layout timeline",
    type: "select",
    group: "Layout",
    sectionKeys: ["timeline"],
    options: enumOptions(TIMELINE_LAYOUTS, {
      vertical: "Vertical",
      alternating: "Alternant",
      compact: "Compact",
    }),
  },
  {
    path: "countdownStyle",
    label: "Stil countdown",
    type: "select",
    group: "Layout",
    sectionKeys: ["countdown"],
    options: enumOptions(COUNTDOWN_STYLES, {
      digits: "Cifre mari",
      inline: "Inline",
      cards: "Carduri",
    }),
  },
  {
    path: "showAccentRule",
    label: "Linie accent",
    type: "boolean",
    group: "Decorative",
  },
  {
    path: "decorative",
    label: "Elemente decorative",
    type: "boolean",
    group: "Decorative",
  },
  {
    path: "divider",
    label: "Divider",
    type: "select",
    group: "Decorative",
    options: enumOptions(DIVIDER_OPTIONS, {
      none: "Fără",
      line: "Linie",
      ornament: "Ornament",
      dots: "Puncte",
    }),
  },
  {
    path: "showIcons",
    label: "Afișează iconițe",
    type: "boolean",
    group: "Decorative",
  },
  {
    path: "background",
    label: "Fundal secțiune",
    type: "color",
    group: "Culori",
  },
  {
    path: "foreground",
    label: "Text secțiune",
    type: "color",
    group: "Culori",
  },
  {
    path: "accent",
    label: "Accent secțiune",
    type: "color",
    group: "Culori",
  },
  {
    path: "gradientFrom",
    label: "Gradient de la",
    type: "color",
    group: "Culori",
  },
  {
    path: "gradientTo",
    label: "Gradient până la",
    type: "color",
    group: "Culori",
  },
  {
    path: "overlay",
    label: "Overlay imagine",
    type: "select",
    group: "Imagini",
    options: enumOptions(OVERLAY_OPTIONS, {
      none: "Fără",
      soft: "Soft",
      strong: "Puternic",
      gradient: "Gradient",
    }),
  },
  {
    path: "imageStyle",
    label: "Stil imagine",
    type: "select",
    group: "Imagini",
    options: enumOptions(["cover", "contain", "rounded", "circle"] as const, {
      cover: "Cover",
      contain: "Contain",
      rounded: "Rotunjit",
      circle: "Cerc",
    }),
  },
  {
    path: "cardStyle",
    label: "Container tip card",
    type: "boolean",
    group: "Card & border",
  },
  {
    path: "border",
    label: "Bordură",
    type: "boolean",
    group: "Card & border",
  },
  {
    path: "shadow",
    label: "Umbră",
    type: "select",
    group: "Card & border",
    options: enumOptions(["none", "sm", "md"] as const, {
      none: "Fără",
      sm: "Mică",
      md: "Medie",
    }),
  },
  {
    path: "buttonStyle",
    label: "Stil butoane / linkuri",
    type: "select",
    group: "Butoane",
    options: enumOptions(["solid", "outline", "ghost", "underline"] as const, {
      solid: "Solid",
      outline: "Outline",
      ghost: "Ghost",
      underline: "Underline",
    }),
  },
  {
    path: "animation",
    label: "Animație",
    type: "select",
    group: "Mișcare",
    options: enumOptions(ANIMATION_OPTIONS, {
      none: "Fără",
      fade: "Fade",
      "fade-up": "Fade up",
      scale: "Scale",
    }),
  },
];

export const THEME_FIELD_SCHEMA: FieldDef[] = [
  { path: "background", label: "Fundal pagină", type: "color", group: "Temă" },
  { path: "foreground", label: "Text", type: "color", group: "Temă" },
  { path: "accent", label: "Accent", type: "color", group: "Temă" },
  {
    path: "headingFont",
    label: "Font titluri",
    type: "select",
    group: "Tipografie",
    options: CONTROLLED_FONTS.map((f) => ({ value: f, label: f })),
  },
  {
    path: "bodyFont",
    label: "Font text",
    type: "select",
    group: "Tipografie",
    options: CONTROLLED_FONTS.map((f) => ({ value: f, label: f })),
  },
  {
    path: "density",
    label: "Densitate",
    type: "select",
    group: "Spațiere",
    options: enumOptions(DENSITY_OPTIONS, {
      compact: "Compact",
      comfortable: "Confortabil",
      spacious: "Spațios",
    }),
  },
  {
    path: "radius",
    label: "Raze colțuri",
    type: "select",
    group: "Spațiere",
    options: enumOptions(RADIUS_OPTIONS),
  },
  {
    path: "pageGradientFrom",
    label: "Gradient pagină de la",
    type: "color",
    group: "Temă",
  },
  {
    path: "pageGradientTo",
    label: "Gradient pagină până la",
    type: "color",
    group: "Temă",
  },
  {
    path: "buttonBackground",
    label: "Buton fundal",
    type: "color",
    group: "Butoane",
  },
  {
    path: "buttonForeground",
    label: "Buton text",
    type: "color",
    group: "Butoane",
  },
];

/** Flat content field schemas for section types (paths relative to content object) */
export const CONTENT_FIELD_SCHEMAS: Record<CanonicalSectionKey, FieldDef[]> = {
  hero: [
    { path: "eyebrow", label: "Eyebrow", type: "text", group: "Conținut" },
    { path: "title", label: "Titlu", type: "text", group: "Conținut" },
    { path: "subtitle", label: "Subtitlu", type: "text", group: "Conținut" },
    { path: "imageUrl", label: "URL imagine", type: "url", group: "Conținut" },
  ],
  announcement: [
    { path: "eyebrow", label: "Eyebrow", type: "text", group: "Conținut" },
    { path: "title", label: "Titlu", type: "text", group: "Conținut" },
    { path: "description", label: "Descriere", type: "textarea", group: "Conținut" },
  ],
  couple: [
    { path: "name1", label: "Nume 1", type: "text", group: "Conținut" },
    { path: "name2", label: "Nume 2", type: "text", group: "Conținut" },
    { path: "introText", label: "Introducere", type: "textarea", group: "Conținut" },
    { path: "parentsText", label: "Părinți", type: "textarea", group: "Conținut" },
    { path: "godparentsText", label: "Nași", type: "textarea", group: "Conținut" },
  ],
  story: [
    { path: "title", label: "Titlu", type: "text", group: "Conținut" },
    { path: "introduction", label: "Introducere", type: "textarea", group: "Conținut" },
  ],
  countdown: [
    { path: "title", label: "Titlu", type: "text", group: "Conținut" },
    { path: "targetDate", label: "Data țintă", type: "date", group: "Conținut" },
  ],
  when_where: [
    { path: "title", label: "Titlu", type: "text", group: "Conținut" },
    { path: "weddingDate", label: "Data", type: "date", group: "Conținut" },
    { path: "weddingTime", label: "Ora", type: "time", group: "Conținut" },
    { path: "ceremonyLocation", label: "Locație ceremonie", type: "text", group: "Conținut" },
    { path: "receptionLocation", label: "Locație petrecere", type: "text", group: "Conținut" },
    { path: "mapUrl", label: "URL hartă", type: "url", group: "Conținut" },
  ],
  timeline: [{ path: "title", label: "Titlu", type: "text", group: "Conținut" }],
  gallery: [{ path: "title", label: "Titlu", type: "text", group: "Conținut" }],
  dress_code: [
    { path: "title", label: "Titlu", type: "text", group: "Conținut" },
    { path: "description", label: "Descriere", type: "textarea", group: "Conținut" },
    {
      path: "inspirationImageUrl",
      label: "Imagine inspirație",
      type: "url",
      group: "Conținut",
    },
  ],
  accommodation: [
    { path: "title", label: "Titlu", type: "text", group: "Conținut" },
    { path: "description", label: "Descriere", type: "textarea", group: "Conținut" },
  ],
  transport: [
    { path: "title", label: "Titlu", type: "text", group: "Conținut" },
    { path: "description", label: "Descriere", type: "textarea", group: "Conținut" },
    { path: "pickupPoints", label: "Puncte preluare", type: "textarea", group: "Conținut" },
    { path: "departureTimes", label: "Ore plecare", type: "text", group: "Conținut" },
    { path: "returnTimes", label: "Ore întoarcere", type: "text", group: "Conținut" },
    { path: "contact", label: "Contact", type: "text", group: "Conținut" },
  ],
  gifts: [
    { path: "title", label: "Titlu", type: "text", group: "Conținut" },
    { path: "description", label: "Descriere", type: "textarea", group: "Conținut" },
    { path: "bankDetails", label: "Detalii bancare", type: "textarea", group: "Conținut" },
    { path: "registryUrl", label: "URL listă cadouri", type: "url", group: "Conținut" },
    {
      path: "hideBankDetails",
      label: "Ascunde detalii financiare",
      type: "boolean",
      group: "Conținut",
    },
  ],
  faq: [{ path: "title", label: "Titlu", type: "text", group: "Conținut" }],
  rsvp: [
    { path: "title", label: "Titlu", type: "text", group: "Conținut" },
    { path: "message", label: "Mesaj", type: "textarea", group: "Conținut" },
  ],
  footer: [
    { path: "text", label: "Text", type: "text", group: "Conținut" },
    { path: "signature", label: "Semnătură", type: "text", group: "Conținut" },
  ],
};

export function presentationFieldsForSection(
  sectionKey: CanonicalSectionKey,
): FieldDef[] {
  return PRESENTATION_FIELD_SCHEMA.filter(
    (f) => !f.sectionKeys || f.sectionKeys.includes(sectionKey),
  );
}

export function getPathValue(obj: Record<string, unknown>, path: string): unknown {
  return obj[path];
}

export function setPathValue<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown,
): T {
  return { ...obj, [path]: value };
}
