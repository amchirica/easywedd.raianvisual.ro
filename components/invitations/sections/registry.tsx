"use client";

import { SectionEditorPanel } from "@/components/invitations/sections/section-editors";
import { sectionRenderers } from "@/components/invitations/sections/section-renderers";
import { getSectionLabel, sectionRegistry } from "@/lib/invitations/sections/registry";
import { sectionDefaults } from "@/lib/invitations/sections/defaults";
import type { CanonicalSectionKey } from "@/lib/invitations/sections/types";

/**
 * UI section registry — single source for editor panels, renderers, defaults, labels.
 * Do not add parallel switch statements elsewhere; look up here.
 */
export const uiSectionRegistry = {
  hero: {
    label: getSectionLabel("hero"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.hero,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) => sectionDefaults("hero", w),
  },
  announcement: {
    label: getSectionLabel("announcement"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.announcement,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) =>
      sectionDefaults("announcement", w),
  },
  couple: {
    label: getSectionLabel("couple"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.couple,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) => sectionDefaults("couple", w),
  },
  story: {
    label: getSectionLabel("story"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.story,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) => sectionDefaults("story", w),
  },
  countdown: {
    label: getSectionLabel("countdown"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.countdown,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) =>
      sectionDefaults("countdown", w),
  },
  when_where: {
    label: getSectionLabel("when_where"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.when_where,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) =>
      sectionDefaults("when_where", w),
  },
  timeline: {
    label: getSectionLabel("timeline"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.timeline,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) =>
      sectionDefaults("timeline", w),
  },
  gallery: {
    label: getSectionLabel("gallery"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.gallery,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) =>
      sectionDefaults("gallery", w),
  },
  dress_code: {
    label: getSectionLabel("dress_code"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.dress_code,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) =>
      sectionDefaults("dress_code", w),
  },
  accommodation: {
    label: getSectionLabel("accommodation"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.accommodation,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) =>
      sectionDefaults("accommodation", w),
  },
  transport: {
    label: getSectionLabel("transport"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.transport,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) =>
      sectionDefaults("transport", w),
  },
  gifts: {
    label: getSectionLabel("gifts"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.gifts,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) => sectionDefaults("gifts", w),
  },
  faq: {
    label: getSectionLabel("faq"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.faq,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) => sectionDefaults("faq", w),
  },
  rsvp: {
    label: getSectionLabel("rsvp"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.rsvp,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) => sectionDefaults("rsvp", w),
  },
  footer: {
    label: getSectionLabel("footer"),
    editor: SectionEditorPanel,
    renderer: sectionRenderers.footer,
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) => sectionDefaults("footer", w),
  },
} as const satisfies Record<
  CanonicalSectionKey,
  {
    label: string;
    editor: typeof SectionEditorPanel;
    renderer: (typeof sectionRenderers)[CanonicalSectionKey];
    defaults: (w?: Parameters<typeof sectionDefaults>[1]) => ReturnType<typeof sectionDefaults>;
  }
>;

export { sectionRegistry, getSectionLabel };
