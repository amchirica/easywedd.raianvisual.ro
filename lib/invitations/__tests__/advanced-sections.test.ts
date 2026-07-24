import { describe, expect, it, vi } from "vitest";

import { SharedInvitationSectionsView } from "@/components/invitations/invitation-canvas";
import { uiSectionRegistry } from "@/components/invitations/sections/registry";
import { sectionRenderers } from "@/components/invitations/sections/section-renderers";
import { sharedSectionRenderers } from "@/components/website/site-canvas";
import {
  CANONICAL_SECTION_KEYS,
  SECTION_LABELS_RO,
  normalizeInvitationContent,
  upgradeContentForTemplate,
  listEditorSections,
  isSectionEnabled,
  mapLegacySectionKey,
  safeSectionKey,
} from "@/lib/invitations/sections";
import { mergeTemplateDefaults, defaultContent } from "@/lib/invitations/schema";

const ADVANCED_ORDER = [
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

describe("advanced invitation sections", () => {
  it("exposes all advanced sections in the UI registry with Romanian labels", () => {
    for (const key of ADVANCED_ORDER) {
      expect(uiSectionRegistry[key]).toBeDefined();
      expect(uiSectionRegistry[key].label).toBe(SECTION_LABELS_RO[key]);
      expect(sectionRenderers[key]).toBeTypeOf("function");
    }
    expect(Object.keys(uiSectionRegistry).length).toBeGreaterThanOrEqual(15);
  });

  it("preserves template section order in editor navigation", () => {
    const content = normalizeInvitationContent(
      { enabledSections: ["footer", "hero"] },
      { templateSections: [...ADVANCED_ORDER] },
    );
    expect(listEditorSections(content)).toEqual([...ADVANCED_ORDER]);
    expect(listEditorSections(content).length).toBeGreaterThan(5);
  });

  it("fills missing sections with defaults", () => {
    const content = normalizeInvitationContent(
      {
        coupleName1: "Ana",
        coupleName2: "Mihai",
        enabledSections: ["hero", "couple", "when_where", "rsvp", "footer"],
      },
      { templateSections: [...ADVANCED_ORDER] },
    );
    expect(content.sections.announcement.eyebrow).toBe("Ne căsătorim");
    expect(content.sections.story.title).toBe("Povestea noastră");
    expect(content.sections.timeline.items.length).toBeGreaterThanOrEqual(5);
    expect(content.sections.timeline.items.map((i) => i.title)).toEqual(
      expect.arrayContaining([
        "Cununia",
        "Primirea invitaților",
        "Cina festivă",
        "Dansul mirilor",
        "Petrecerea",
      ]),
    );
    expect(content.sections.gallery.title).toBe("Galerie");
    expect(content.sections.faq.items.length).toBeGreaterThan(0);
  });

  it("preserves legacy content when upgrading", () => {
    const content = normalizeInvitationContent(
      {
        coupleName1: "Ana",
        coupleName2: "Mihai",
        introText: "Text vechi păstrat",
        weddingDate: "2026-09-12",
        ceremonyLocation: "Biserica Sf. Nicolae",
        rsvpMessage: "Confirmați până pe 1 august",
        enabledSections: ["hero", "couple", "when_where", "rsvp", "footer"],
      },
      { templateSections: [...ADVANCED_ORDER] },
    );

    expect(content.sections.couple.introText).toBe("Text vechi păstrat");
    expect(content.sections.couple.name1).toBe("Ana");
    expect(content.sections.when_where.ceremonyLocation).toBe(
      "Biserica Sf. Nicolae",
    );
    expect(content.sections.rsvp.message).toBe("Confirmați până pe 1 august");

    const upgraded = upgradeContentForTemplate(content, [...ADVANCED_ORDER], {
      couple_name_1: "Ana",
      couple_name_2: "Mihai",
    });
    expect(upgraded.sections.couple.introText).toBe("Text vechi păstrat");
    expect(upgraded.sectionOrder).toEqual([...ADVANCED_ORDER]);
  });

  it("advanced template shows more than the five legacy sections", () => {
    const legacy = normalizeInvitationContent({
      enabledSections: ["hero", "couple", "when_where", "rsvp", "footer"],
    });
    const advanced = normalizeInvitationContent(
      {
        enabledSections: ["hero", "couple", "when_where", "rsvp", "footer"],
      },
      { templateSections: [...ADVANCED_ORDER] },
    );
    expect(legacy.sectionOrder.length).toBe(5);
    expect(advanced.sectionOrder.length).toBe(15);
    expect(advanced.sectionOrder.length).toBeGreaterThan(legacy.sectionOrder.length);
  });

  it("does not render disabled sections as enabled", () => {
    const content = normalizeInvitationContent(
      {},
      { templateSections: [...ADVANCED_ORDER] },
    );
    content.enabledSections = content.enabledSections.filter((k) => k !== "gallery");
    expect(isSectionEnabled(content, "gallery")).toBe(false);
    expect(isSectionEnabled(content, "hero")).toBe(true);
  });

  it("maps legacy keys and ignores unknown without crashing", () => {
    expect(mapLegacySectionKey("schedule")).toBe("timeline");
    expect(mapLegacySectionKey("travel")).toBe("transport");
    expect(mapLegacySectionKey("party")).toBe("couple");
    expect(safeSectionKey("not_a_real_section")).toBeNull();
    expect(() =>
      normalizeInvitationContent({
        enabledSections: ["hero", "totally_unknown", "rsvp"],
      }),
    ).not.toThrow();
    const content = normalizeInvitationContent({
      enabledSections: ["hero", "totally_unknown", "rsvp"],
    });
    expect(content.enabledSections).not.toContain("totally_unknown" as never);
  });

  it("editor preview and public website share the same section renderers", () => {
    expect(sharedSectionRenderers).toBe(sectionRenderers);
    expect(SharedInvitationSectionsView).toBeTypeOf("function");
    for (const key of CANONICAL_SECTION_KEYS) {
      expect(sharedSectionRenderers[key]).toBe(sectionRenderers[key]);
    }
  });

  it("autosaves sections independently without clobbering siblings (content merge)", () => {
    const base = normalizeInvitationContent(
      {},
      { templateSections: [...ADVANCED_ORDER] },
    );
    const afterAnnouncement = normalizeInvitationContent({
      ...base,
      sections: {
        ...base.sections,
        announcement: {
          ...base.sections.announcement,
          title: "Titlu anunț salvat",
        },
      },
    });
    const afterFaq = normalizeInvitationContent({
      ...afterAnnouncement,
      sections: {
        ...afterAnnouncement.sections,
        faq: {
          ...afterAnnouncement.sections.faq,
          title: "FAQ salvat",
        },
      },
    });
    expect(afterFaq.sections.announcement.title).toBe("Titlu anunț salvat");
    expect(afterFaq.sections.faq.title).toBe("FAQ salvat");
    expect(afterFaq.sections.couple.name1).toBe(base.sections.couple.name1);
  });
});

describe("mergeTemplateDefaults with advanced sections", () => {
  it("keeps short template lists intact", () => {
    const merged = mergeTemplateDefaults(undefined, ["hero", "rsvp", "footer"], {
      couple_name_1: "Ana",
      couple_name_2: "Mihai",
    });
    expect(merged.content.enabledSections).toEqual(["hero", "rsvp", "footer"]);
    expect(merged.content.sections.hero.title).toContain("Ana");
  });

  it("normalizes legacy schedule/party/travel keys", () => {
    const merged = mergeTemplateDefaults(undefined, [
      "hero",
      "couple",
      "schedule",
      "party",
      "travel",
      "rsvp",
    ]);
    expect(merged.content.sectionOrder).toEqual([
      "hero",
      "couple",
      "timeline",
      "transport",
      "rsvp",
    ]);
  });
});

describe("defaultContent", () => {
  it("always includes a sections bag", () => {
    const content = defaultContent();
    expect(content.sections.hero).toBeDefined();
    expect(content.sections.footer).toBeDefined();
  });
});

// silence unused if tree-shaken in some runners
void vi;
