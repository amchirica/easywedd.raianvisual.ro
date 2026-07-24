import type { CSSProperties } from "react";

/**
 * Presentation layer shared by invitation + website builders.
 * Template JSON / theme_config / section style are the source of truth.
 */

export const ALIGN_OPTIONS = ["left", "center", "right"] as const;
export const PADDING_Y_OPTIONS = ["sm", "md", "lg", "xl"] as const;
export const SECTION_VARIANTS = [
  "default",
  "band",
  "split",
  "card",
  "fullscreen",
] as const;
export const HERO_VARIANTS = [
  "centered",
  "overlay",
  "split",
  "minimal",
] as const;
export const GALLERY_LAYOUTS = ["grid-2", "grid-3", "masonry", "carousel"] as const;
export const TIMELINE_LAYOUTS = ["vertical", "alternating", "compact"] as const;
export const COUNTDOWN_STYLES = ["digits", "inline", "cards"] as const;
export const DENSITY_OPTIONS = ["compact", "comfortable", "spacious"] as const;
export const RADIUS_OPTIONS = ["none", "sm", "md", "lg"] as const;
export const OVERLAY_OPTIONS = ["none", "soft", "strong", "gradient"] as const;
export const ANIMATION_OPTIONS = ["none", "fade", "fade-up", "scale"] as const;
export const DIVIDER_OPTIONS = ["none", "line", "ornament", "dots"] as const;

export type AlignOption = (typeof ALIGN_OPTIONS)[number];
export type PaddingYOption = (typeof PADDING_Y_OPTIONS)[number];
export type SectionVariant = (typeof SECTION_VARIANTS)[number];
export type HeroVariant = (typeof HERO_VARIANTS)[number];
export type GalleryLayout = (typeof GALLERY_LAYOUTS)[number];
export type TimelineLayout = (typeof TIMELINE_LAYOUTS)[number];
export type CountdownStyle = (typeof COUNTDOWN_STYLES)[number];

/** Per-section visual presentation */
export type SectionPresentation = {
  align: AlignOption;
  paddingY: PaddingYOption;
  variant: SectionVariant;
  heroVariant?: HeroVariant;
  galleryLayout?: GalleryLayout;
  timelineLayout?: TimelineLayout;
  countdownStyle?: CountdownStyle;
  showAccentRule: boolean;
  background: string;
  foreground: string;
  accent: string;
  gradientFrom: string;
  gradientTo: string;
  overlay: (typeof OVERLAY_OPTIONS)[number];
  imageStyle: "cover" | "contain" | "rounded" | "circle";
  cardStyle: boolean;
  border: boolean;
  shadow: "none" | "sm" | "md";
  buttonStyle: "solid" | "outline" | "ghost" | "underline";
  showIcons: boolean;
  animation: (typeof ANIMATION_OPTIONS)[number];
  divider: (typeof DIVIDER_OPTIONS)[number];
  decorative: boolean;
};

/** Extended global theme */
export type ThemePresentation = {
  background: string;
  foreground: string;
  accent: string;
  headingFont: string;
  bodyFont: string;
  density: (typeof DENSITY_OPTIONS)[number];
  radius: (typeof RADIUS_OPTIONS)[number];
  pageGradientFrom: string;
  pageGradientTo: string;
  buttonBackground: string;
  buttonForeground: string;
};

export const DEFAULT_SECTION_PRESENTATION: SectionPresentation = {
  align: "center",
  paddingY: "sm",
  variant: "default",
  heroVariant: "centered",
  galleryLayout: "grid-3",
  timelineLayout: "alternating",
  countdownStyle: "digits",
  showAccentRule: true,
  background: "",
  foreground: "",
  accent: "",
  gradientFrom: "",
  gradientTo: "",
  overlay: "none",
  imageStyle: "cover",
  cardStyle: false,
  border: false,
  shadow: "none",
  buttonStyle: "underline",
  showIcons: true,
  animation: "none",
  divider: "none",
  decorative: false,
};

export function defaultThemePresentation(
  partial?: Partial<ThemePresentation>,
): ThemePresentation {
  return {
    background: "#F7F4EF",
    foreground: "#2A2420",
    accent: "#C4A574",
    headingFont: "Cormorant Garamond",
    bodyFont: "Source Sans 3",
    density: "comfortable",
    radius: "sm",
    pageGradientFrom: "",
    pageGradientTo: "",
    buttonBackground: "#C4A574",
    buttonForeground: "#2A2420",
    ...partial,
  };
}

function pickEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeSectionPresentation(
  input: unknown,
): SectionPresentation {
  const src =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const d = DEFAULT_SECTION_PRESENTATION;
  return {
    align: pickEnum(src.align, ALIGN_OPTIONS, d.align),
    paddingY: pickEnum(src.paddingY, PADDING_Y_OPTIONS, d.paddingY),
    variant: pickEnum(src.variant, SECTION_VARIANTS, d.variant),
    heroVariant: pickEnum(src.heroVariant, HERO_VARIANTS, d.heroVariant!),
    galleryLayout: pickEnum(src.galleryLayout, GALLERY_LAYOUTS, d.galleryLayout!),
    timelineLayout: pickEnum(
      src.timelineLayout,
      TIMELINE_LAYOUTS,
      d.timelineLayout!,
    ),
    countdownStyle: pickEnum(
      src.countdownStyle,
      COUNTDOWN_STYLES,
      d.countdownStyle!,
    ),
    showAccentRule: asBool(src.showAccentRule, d.showAccentRule),
    background: asString(src.background),
    foreground: asString(src.foreground),
    accent: asString(src.accent),
    gradientFrom: asString(src.gradientFrom),
    gradientTo: asString(src.gradientTo),
    overlay: pickEnum(src.overlay, OVERLAY_OPTIONS, d.overlay),
    imageStyle: pickEnum(
      src.imageStyle,
      ["cover", "contain", "rounded", "circle"] as const,
      d.imageStyle,
    ),
    cardStyle: asBool(src.cardStyle, d.cardStyle),
    border: asBool(src.border, d.border),
    shadow: pickEnum(src.shadow, ["none", "sm", "md"] as const, d.shadow),
    buttonStyle: pickEnum(
      src.buttonStyle,
      ["solid", "outline", "ghost", "underline"] as const,
      d.buttonStyle,
    ),
    showIcons: asBool(src.showIcons, d.showIcons),
    animation: pickEnum(src.animation, ANIMATION_OPTIONS, d.animation),
    divider: pickEnum(src.divider, DIVIDER_OPTIONS, d.divider),
    decorative: asBool(src.decorative, d.decorative),
  };
}

export function normalizeThemePresentation(
  input: unknown,
): ThemePresentation {
  const src =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return defaultThemePresentation({
    background: asString(src.background, "#F7F4EF"),
    foreground: asString(src.foreground, "#2A2420"),
    accent: asString(src.accent, "#C4A574"),
    headingFont: asString(src.headingFont, "Cormorant Garamond"),
    bodyFont: asString(src.bodyFont, "Source Sans 3"),
    density: pickEnum(src.density, DENSITY_OPTIONS, "comfortable"),
    radius: pickEnum(src.radius, RADIUS_OPTIONS, "sm"),
    pageGradientFrom: asString(src.pageGradientFrom),
    pageGradientTo: asString(src.pageGradientTo),
    buttonBackground: asString(src.buttonBackground, asString(src.accent, "#C4A574")),
    buttonForeground: asString(src.buttonForeground, "#2A2420"),
  });
}

export function paddingYClass(paddingY: PaddingYOption): string {
  switch (paddingY) {
    case "sm":
      return "py-4";
    case "lg":
      return "py-12";
    case "xl":
      return "py-20";
    default:
      return "py-8";
  }
}

export function alignClass(align: AlignOption): string {
  switch (align) {
    case "left":
      return "text-left items-start";
    case "right":
      return "text-right items-end";
    default:
      return "text-center items-center";
  }
}

export function shadowClass(shadow: SectionPresentation["shadow"]): string {
  switch (shadow) {
    case "sm":
      return "shadow-sm";
    case "md":
      return "shadow-md";
    default:
      return "";
  }
}

export function radiusClass(radius: ThemePresentation["radius"]): string {
  switch (radius) {
    case "none":
      return "rounded-none";
    case "md":
      return "rounded-md";
    case "lg":
      return "rounded-lg";
    default:
      return "rounded-sm";
  }
}

export function presentationToInlineStyle(
  style: SectionPresentation,
  theme: ThemePresentation,
): CSSProperties {
  const bg =
    style.background ||
    (style.gradientFrom && style.gradientTo
      ? undefined
      : undefined);
  const backgroundImage =
    style.gradientFrom && style.gradientTo
      ? `linear-gradient(160deg, ${style.gradientFrom}, ${style.gradientTo})`
      : theme.pageGradientFrom && theme.pageGradientTo
        ? undefined
        : undefined;

  return {
    background: bg || (backgroundImage ? undefined : style.background || undefined),
    backgroundImage,
    color: style.foreground || undefined,
  };
}
