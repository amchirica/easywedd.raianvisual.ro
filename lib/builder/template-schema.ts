/**
 * Template JSON contract — single source of truth for builders.
 * Stored in invitation_templates.template_schema / wedding_site_templates.template_schema
 */

import {
  normalizeSectionPresentation,
  normalizeThemePresentation,
  type SectionPresentation,
  type ThemePresentation,
} from "@/lib/builder/presentation";
import {
  CANONICAL_SECTION_KEYS,
  mapLegacySectionKey,
  type CanonicalSectionKey,
} from "@/lib/invitations/sections/types";

export type TemplateSectionConfig = {
  key: CanonicalSectionKey;
  enabled?: boolean;
  style?: Partial<SectionPresentation>;
  /** Default content overrides from template */
  defaults?: Record<string, unknown>;
};

export type EasyWeddTemplateSchema = {
  version: number;
  sections: CanonicalSectionKey[] | TemplateSectionConfig[];
  theme?: Partial<ThemePresentation>;
  /** Global defaults applied when creating a project/site */
  sectionStyles?: Partial<Record<CanonicalSectionKey, Partial<SectionPresentation>>>;
  modules?: {
    rsvp?: boolean;
    guestbook?: boolean;
    playlist?: boolean;
  };
};

export type NormalizedTemplate = {
  version: number;
  sectionOrder: CanonicalSectionKey[];
  enabledSections: CanonicalSectionKey[];
  theme: ThemePresentation;
  sectionStyles: Record<CanonicalSectionKey, SectionPresentation>;
  sectionDefaults: Partial<Record<CanonicalSectionKey, Record<string, unknown>>>;
  modules: NonNullable<EasyWeddTemplateSchema["modules"]>;
};

function asSectionList(
  sections: EasyWeddTemplateSchema["sections"] | undefined,
): TemplateSectionConfig[] {
  if (!sections?.length) {
    return CANONICAL_SECTION_KEYS.map((key) => ({ key, enabled: true }));
  }
  const out: TemplateSectionConfig[] = [];
  const seen = new Set<CanonicalSectionKey>();
  for (const entry of sections) {
    if (typeof entry === "string") {
      const key = mapLegacySectionKey(entry);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ key, enabled: true });
    } else if (entry && typeof entry === "object" && "key" in entry) {
      const key = mapLegacySectionKey(String(entry.key));
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({
        key,
        enabled: entry.enabled !== false,
        style: entry.style,
        defaults: entry.defaults,
      });
    }
  }
  return out.length
    ? out
    : CANONICAL_SECTION_KEYS.map((key) => ({ key, enabled: true }));
}

export function normalizeTemplateSchema(input: unknown): NormalizedTemplate {
  const raw =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const version = typeof raw.version === "number" ? raw.version : 1;
  const list = asSectionList(
    raw.sections as EasyWeddTemplateSchema["sections"] | undefined,
  );
  const theme = normalizeThemePresentation(raw.theme);
  const stylesRaw =
    raw.sectionStyles && typeof raw.sectionStyles === "object"
      ? (raw.sectionStyles as Record<string, unknown>)
      : {};

  const sectionStyles = {} as Record<CanonicalSectionKey, SectionPresentation>;
  const sectionDefaults: Partial<
    Record<CanonicalSectionKey, Record<string, unknown>>
  > = {};
  const sectionOrder: CanonicalSectionKey[] = [];
  const enabledSections: CanonicalSectionKey[] = [];

  for (const item of list) {
    sectionOrder.push(item.key);
    if (item.enabled !== false) enabledSections.push(item.key);
    const fromGlobal = stylesRaw[item.key];
    sectionStyles[item.key] = normalizeSectionPresentation({
      ...((fromGlobal && typeof fromGlobal === "object" ? fromGlobal : {}) as object),
      ...(item.style ?? {}),
    });
    if (item.defaults) sectionDefaults[item.key] = item.defaults;
  }

  // Ensure every canonical key has a style entry for editor completeness
  for (const key of CANONICAL_SECTION_KEYS) {
    if (!sectionStyles[key]) {
      sectionStyles[key] = normalizeSectionPresentation(stylesRaw[key]);
    }
  }

  const modulesRaw =
    raw.modules && typeof raw.modules === "object"
      ? (raw.modules as Record<string, unknown>)
      : {};

  return {
    version,
    sectionOrder,
    enabledSections: enabledSections.length ? enabledSections : [...sectionOrder],
    theme,
    sectionStyles,
    sectionDefaults,
    modules: {
      rsvp: modulesRaw.rsvp !== false,
      guestbook: Boolean(modulesRaw.guestbook),
      playlist: Boolean(modulesRaw.playlist),
    },
  };
}

export function emptyTemplateSchema(): EasyWeddTemplateSchema {
  return {
    version: 1,
    sections: [...CANONICAL_SECTION_KEYS],
    theme: normalizeThemePresentation({}),
    sectionStyles: {},
    modules: { rsvp: true },
  };
}
