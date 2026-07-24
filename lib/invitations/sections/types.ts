import type { InvitationThemeConfig } from "@/types/invitations";

/** Canonical advanced invitation / website section keys */
export const CANONICAL_SECTION_KEYS = [
  "hero",
  "announcement",
  "couple",
  "story",
  "countdown",
  "when_where",
  "timeline",
  "gallery",
  "dress_code",
  "accommodation",
  "transport",
  "gifts",
  "faq",
  "rsvp",
  "footer",
] as const;

export type CanonicalSectionKey = (typeof CANONICAL_SECTION_KEYS)[number];

/** Legacy keys still accepted from stored JSON / old templates */
export type LegacySectionKey =
  | "schedule"
  | "party"
  | "travel"
  | CanonicalSectionKey;

export const SECTION_LABELS_RO: Record<CanonicalSectionKey, string> = {
  hero: "Copertă",
  announcement: "Anunț",
  couple: "Cuplu & introducere",
  story: "Povestea noastră",
  countdown: "Numărătoare inversă",
  when_where: "Când și unde",
  timeline: "Programul evenimentului",
  gallery: "Galerie",
  dress_code: "Dress code",
  accommodation: "Cazare",
  transport: "Transport",
  gifts: "Daruri",
  faq: "Întrebări frecvente",
  rsvp: "Confirmare participare",
  footer: "Încheiere",
};

export type StoryItem = {
  id: string;
  date: string;
  title: string;
  description: string;
  imageUrl: string;
};

export type TimelineItem = {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  icon: string;
};

export type GalleryItem = {
  id: string;
  url: string;
  caption: string;
};

export type AccommodationItem = {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  bookingInfo: string;
  mapUrl: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type SectionContentMap = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    imageUrl: string;
  };
  announcement: {
    eyebrow: string;
    title: string;
    description: string;
  };
  couple: {
    name1: string;
    name2: string;
    introText: string;
    parentsText: string;
    godparentsText: string;
  };
  story: {
    title: string;
    introduction: string;
    items: StoryItem[];
  };
  countdown: {
    title: string;
    targetDate: string;
  };
  when_where: {
    title: string;
    weddingDate: string;
    weddingTime: string;
    ceremonyLocation: string;
    receptionLocation: string;
    mapUrl: string;
  };
  timeline: {
    title: string;
    items: TimelineItem[];
  };
  gallery: {
    title: string;
    items: GalleryItem[];
  };
  dress_code: {
    title: string;
    description: string;
    colors: string[];
    inspirationImageUrl: string;
  };
  accommodation: {
    title: string;
    description: string;
    items: AccommodationItem[];
  };
  transport: {
    title: string;
    description: string;
    pickupPoints: string;
    departureTimes: string;
    returnTimes: string;
    contact: string;
  };
  gifts: {
    title: string;
    description: string;
    bankDetails: string;
    registryUrl: string;
    hideBankDetails: boolean;
  };
  faq: {
    title: string;
    items: FaqItem[];
  };
  rsvp: {
    title: string;
    message: string;
  };
  footer: {
    text: string;
    signature: string;
  };
};

export type InvitationSectionsState = {
  [K in CanonicalSectionKey]: SectionContentMap[K];
};

export type InvitationContentConfigV2 = {
  /** Legacy flat fields — kept for backward compatibility */
  coupleName1: string;
  coupleName2: string;
  weddingDate: string;
  weddingTime: string;
  ceremonyLocation: string;
  receptionLocation: string;
  scheduleText: string;
  parentsText: string;
  godparentsText: string;
  dressCode: string;
  travelInfo: string;
  accommodationInfo: string;
  mapUrl: string;
  heroImageUrl: string;
  introText: string;
  rsvpMessage: string;
  footerText: string;
  /** Template order + enable flags */
  enabledSections: CanonicalSectionKey[];
  sectionOrder: CanonicalSectionKey[];
  /** Rich per-section content */
  sections: InvitationSectionsState;
  /** Per-section presentation (layout, colors, variants, etc.) */
  sectionStyles?: Partial<
    Record<CanonicalSectionKey, import("@/lib/builder/presentation").SectionPresentation>
  >;
};

export type SectionRenderContext = {
  theme: InvitationThemeConfig;
  guestName?: string;
  preview?: boolean;
};

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isCanonicalSectionKey(value: string): value is CanonicalSectionKey {
  return (CANONICAL_SECTION_KEYS as readonly string[]).includes(value);
}

/** Map legacy template/content keys → canonical */
export function mapLegacySectionKey(key: string): CanonicalSectionKey | null {
  if (key === "schedule") return "timeline";
  if (key === "travel") return "transport";
  if (key === "party") return "couple";
  if (isCanonicalSectionKey(key)) return key;
  return null;
}

export function normalizeSectionOrder(
  keys: string[] | null | undefined,
): CanonicalSectionKey[] {
  const out: CanonicalSectionKey[] = [];
  const seen = new Set<CanonicalSectionKey>();
  for (const raw of keys ?? []) {
    const mapped = mapLegacySectionKey(raw);
    if (!mapped || seen.has(mapped)) continue;
    seen.add(mapped);
    out.push(mapped);
  }
  if (!out.length) {
    return [...CANONICAL_SECTION_KEYS];
  }
  return out;
}
