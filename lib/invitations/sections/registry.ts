import { SECTION_LABELS_RO, type CanonicalSectionKey } from "@/lib/invitations/sections/types";
import { sectionDefaults } from "@/lib/invitations/sections/defaults";

export type SectionRegistryEntry = {
  key: CanonicalSectionKey;
  label: string;
  defaults: typeof sectionDefaults;
};

/** Central metadata registry (no React) — labels, defaults factory */
export const sectionRegistry: Record<
  CanonicalSectionKey,
  { label: string; getDefaults: typeof sectionDefaults }
> = {
  hero: { label: SECTION_LABELS_RO.hero, getDefaults: sectionDefaults },
  announcement: { label: SECTION_LABELS_RO.announcement, getDefaults: sectionDefaults },
  couple: { label: SECTION_LABELS_RO.couple, getDefaults: sectionDefaults },
  story: { label: SECTION_LABELS_RO.story, getDefaults: sectionDefaults },
  countdown: { label: SECTION_LABELS_RO.countdown, getDefaults: sectionDefaults },
  when_where: { label: SECTION_LABELS_RO.when_where, getDefaults: sectionDefaults },
  timeline: { label: SECTION_LABELS_RO.timeline, getDefaults: sectionDefaults },
  gallery: { label: SECTION_LABELS_RO.gallery, getDefaults: sectionDefaults },
  dress_code: { label: SECTION_LABELS_RO.dress_code, getDefaults: sectionDefaults },
  accommodation: { label: SECTION_LABELS_RO.accommodation, getDefaults: sectionDefaults },
  transport: { label: SECTION_LABELS_RO.transport, getDefaults: sectionDefaults },
  gifts: { label: SECTION_LABELS_RO.gifts, getDefaults: sectionDefaults },
  faq: { label: SECTION_LABELS_RO.faq, getDefaults: sectionDefaults },
  rsvp: { label: SECTION_LABELS_RO.rsvp, getDefaults: sectionDefaults },
  footer: { label: SECTION_LABELS_RO.footer, getDefaults: sectionDefaults },
};

export function getSectionLabel(key: CanonicalSectionKey): string {
  return sectionRegistry[key]?.label ?? key;
}

export function listRegistrySections(): CanonicalSectionKey[] {
  return Object.keys(sectionRegistry) as CanonicalSectionKey[];
}
