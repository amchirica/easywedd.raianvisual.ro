export type { CanonicalSectionKey, InvitationContentConfigV2, InvitationSectionsState, SectionContentMap } from "@/lib/invitations/sections/types";
export {
  CANONICAL_SECTION_KEYS,
  SECTION_LABELS_RO,
  isCanonicalSectionKey,
  mapLegacySectionKey,
  normalizeSectionOrder,
  newId,
} from "@/lib/invitations/sections/types";
export { createDefaultSections, sectionDefaults } from "@/lib/invitations/sections/defaults";
export {
  normalizeInvitationContent,
  upgradeContentForTemplate,
  getSectionContent,
  isSectionEnabled,
  listEditorSections,
  filterUnknownSections,
  safeSectionKey,
} from "@/lib/invitations/sections/normalize";
export { sectionRegistry, getSectionLabel, listRegistrySections } from "@/lib/invitations/sections/registry";
