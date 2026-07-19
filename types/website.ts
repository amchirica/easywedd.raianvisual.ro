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
};

export type SiteSectionConfig = {
  title?: string;
  body?: string;
  imageUrl?: string;
  mapUrl?: string;
  rsvpUrl?: string;
  items?: string[];
  date?: string;
};

export const ALL_SITE_SECTIONS: {
  type: WeddingSiteSectionType;
  label: string;
}[] = [
  { type: "hero", label: "Hero" },
  { type: "story", label: "Povestea noastră" },
  { type: "countdown", label: "Countdown" },
  { type: "schedule", label: "Program" },
  { type: "locations", label: "Locații" },
  { type: "map", label: "Hartă" },
  { type: "gallery", label: "Galerie" },
  { type: "dress_code", label: "Dress code" },
  { type: "rsvp", label: "RSVP" },
  { type: "family", label: "Părinți și nași" },
  { type: "team", label: "Echipă" },
  { type: "transport", label: "Transport" },
  { type: "accommodation", label: "Cazare" },
  { type: "faq", label: "Întrebări frecvente" },
  { type: "playlist", label: "Playlist" },
  { type: "gifts", label: "Cadouri" },
  { type: "contact", label: "Contact" },
  { type: "guestbook", label: "Mesaje pentru miri" },
];
