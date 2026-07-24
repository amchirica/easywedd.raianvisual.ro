import { describe, expect, it } from "vitest";

import {
  normalizeSectionPresentation,
  normalizeThemePresentation,
} from "@/lib/builder/presentation";
import {
  CONTENT_FIELD_SCHEMAS,
  presentationFieldsForSection,
  THEME_FIELD_SCHEMA,
} from "@/lib/builder/field-schema";
import { normalizeTemplateSchema } from "@/lib/builder/template-schema";
import { normalizeInvitationContent } from "@/lib/invitations/sections";
import { CANONICAL_SECTION_KEYS } from "@/lib/invitations/sections/types";

describe("visual builder schema", () => {
  it("exposes content fields for every canonical section", () => {
    for (const key of CANONICAL_SECTION_KEYS) {
      expect(CONTENT_FIELD_SCHEMAS[key]?.length).toBeGreaterThan(0);
    }
  });

  it("exposes presentation + theme fields", () => {
    expect(THEME_FIELD_SCHEMA.length).toBeGreaterThan(5);
    expect(presentationFieldsForSection("hero").some((f) => f.path === "heroVariant")).toBe(
      true,
    );
    expect(
      presentationFieldsForSection("gallery").some((f) => f.path === "galleryLayout"),
    ).toBe(true);
    expect(
      presentationFieldsForSection("footer").every(
        (f) => !f.sectionKeys || f.sectionKeys.includes("footer"),
      ),
    ).toBe(true);
  });

  it("normalizes presentation with defaults", () => {
    const style = normalizeSectionPresentation({
      align: "left",
      paddingY: "xl",
      galleryLayout: "grid-2",
    });
    expect(style.align).toBe("left");
    expect(style.paddingY).toBe("xl");
    expect(style.galleryLayout).toBe("grid-2");
    expect(style.showAccentRule).toBe(true);
  });

  it("normalizes template JSON as single source of truth", () => {
    const tpl = normalizeTemplateSchema({
      version: 2,
      sections: [
        { key: "hero", enabled: true, style: { heroVariant: "overlay" } },
        { key: "gallery", enabled: false },
        "rsvp",
      ],
      theme: { accent: "#112233", density: "spacious" },
      sectionStyles: {
        gallery: { galleryLayout: "carousel" },
      },
    });
    expect(tpl.sectionOrder).toEqual(["hero", "gallery", "rsvp"]);
    expect(tpl.enabledSections).toEqual(["hero", "rsvp"]);
    expect(tpl.sectionStyles.hero.heroVariant).toBe("overlay");
    expect(tpl.sectionStyles.gallery.galleryLayout).toBe("carousel");
    expect(tpl.theme.accent).toBe("#112233");
    expect(tpl.theme.density).toBe("spacious");
  });

  it("preserves sectionStyles through content normalize", () => {
    const content = normalizeInvitationContent({
      sections: { hero: { title: "A & B" } },
      enabledSections: ["hero", "rsvp"],
      sectionOrder: ["hero", "rsvp"],
      sectionStyles: {
        hero: { align: "left", paddingY: "lg" },
      },
    });
    expect(content.sectionStyles?.hero?.align).toBe("left");
    expect(content.sectionStyles?.hero?.paddingY).toBe("lg");
  });

  it("normalizes extended theme", () => {
    const theme = normalizeThemePresentation({
      background: "#fff",
      pageGradientFrom: "#aaa",
      pageGradientTo: "#bbb",
      density: "compact",
    });
    expect(theme.pageGradientFrom).toBe("#aaa");
    expect(theme.density).toBe("compact");
  });
});
