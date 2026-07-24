export type WeddingSiteStatus =
  | "draft"
  | "published"
  | "unpublished"
  | "archived";

export type WeddingSiteDomainStatus =
  | "none"
  | "pending"
  | "verified"
  | "failed";

export type WeddingSiteSectionType =
  | "hero"
  | "story"
  | "countdown"
  | "schedule"
  | "locations"
  | "map"
  | "gallery"
  | "dress_code"
  | "rsvp"
  | "family"
  | "team"
  | "transport"
  | "accommodation"
  | "faq"
  | "playlist"
  | "gifts"
  | "contact"
  | "guestbook";

export type SiteThemeConfig = {
  background: string;
  foreground: string;
  accent: string;
  headingFont: string;
  bodyFont: string;
  density?: "compact" | "comfortable" | "spacious";
  radius?: "none" | "sm" | "md" | "lg";
  pageGradientFrom?: string;
  pageGradientTo?: string;
  buttonBackground?: string;
  buttonForeground?: string;
};

export type SiteSectionConfig = {
  title?: string;
  body?: string;
  imageUrl?: string;
  mapUrl?: string;
  rsvpUrl?: string;
  items?: string[];
  date?: string;
  /** Full canonical section content — source of truth when present */
  rich?: Record<string, unknown>;
  /** Per-section presentation */
  style?: Record<string, unknown>;
};

export const ALL_SITE_SECTIONS: {
  type: WeddingSiteSectionType;
  label: string;
}[] = [
  { type: "hero", label: "Copertă" },
  { type: "story", label: "Povestea noastră" },
  { type: "countdown", label: "Numărătoare inversă" },
  { type: "schedule", label: "Programul evenimentului" },
  { type: "locations", label: "Când și unde" },
  { type: "map", label: "Hartă" },
  { type: "gallery", label: "Galerie" },
  { type: "dress_code", label: "Dress code" },
  { type: "rsvp", label: "Confirmare participare" },
  { type: "family", label: "Cuplu & introducere" },
  { type: "team", label: "Echipă" },
  { type: "transport", label: "Transport" },
  { type: "accommodation", label: "Cazare" },
  { type: "faq", label: "Întrebări frecvente" },
  { type: "playlist", label: "Playlist" },
  { type: "gifts", label: "Daruri" },
  { type: "contact", label: "Încheiere" },
  { type: "guestbook", label: "Mesaje pentru miri" },
];
