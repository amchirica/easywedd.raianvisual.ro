"use client";

import {
  PresentationProvider,
  sectionRenderers,
} from "@/components/invitations/sections/section-renderers";
import { normalizeSectionPresentation } from "@/lib/builder/presentation";
import {
  siteConfigToSectionData,
  siteThemeToInvitationTheme,
} from "@/lib/website/section-adapter";
import type {
  SiteSectionConfig,
  SiteThemeConfig,
  WeddingSiteSectionType,
} from "@/types/website";
import type {
  CanonicalSectionKey,
  SectionContentMap,
} from "@/lib/invitations/sections/types";

export type SiteSectionView = {
  id: string;
  section_type: WeddingSiteSectionType | string;
  section_config: SiteSectionConfig;
  is_visible: boolean;
  sort_order: number;
};

export function SiteCanvas({
  theme,
  sections,
  showBranding = true,
}: {
  theme: SiteThemeConfig;
  sections: SiteSectionView[];
  showBranding?: boolean;
}) {
  const visible = [...sections]
    .filter((s) => s.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order);

  const invitationTheme = siteThemeToInvitationTheme(theme);
  const pageBackground =
    theme.pageGradientFrom && theme.pageGradientTo
      ? undefined
      : theme.background;
  const pageBackgroundImage =
    theme.pageGradientFrom && theme.pageGradientTo
      ? `linear-gradient(160deg, ${theme.pageGradientFrom}, ${theme.pageGradientTo})`
      : undefined;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: pageBackground,
        backgroundImage: pageBackgroundImage,
        color: theme.foreground,
        fontFamily: `"${theme.bodyFont}", sans-serif`,
      }}
    >
      {visible.map((section) => (
        <SectionBlock
          key={section.id}
          type={section.section_type}
          config={section.section_config}
          theme={invitationTheme}
        />
      ))}
      {showBranding ? (
        <div className="flex items-center justify-center gap-2 px-6 pb-8 opacity-40">
          {/* eslint-disable-next-line @next/next/no-img-element -- public wedding sites may be static-exported contexts */}
          <img
            src="/brand/raian-mark-32.png"
            alt=""
            width={14}
            height={14}
            className="opacity-80"
          />
          <p className="text-center text-[10px] tracking-[0.2em] uppercase">
            EasyWedd
          </p>
        </div>
      ) : null}
    </div>
  );
}

function SectionBlock({
  type,
  config,
  theme,
}: {
  type: string;
  config: SiteSectionConfig;
  theme: ReturnType<typeof siteThemeToInvitationTheme>;
}) {
  const mapped = siteConfigToSectionData(type, config);
  if (!mapped) {
    return (
      <section className="px-6 py-8 text-center">
        <h2
          className="text-2xl"
          style={{ fontFamily: `"${theme.headingFont}", serif` }}
        >
          {config.title || type.replaceAll("_", " ")}
        </h2>
        {config.body ? (
          <p className="mx-auto mt-3 max-w-xl whitespace-pre-line text-sm opacity-90">
            {config.body}
          </p>
        ) : null}
      </section>
    );
  }

  const presentation = normalizeSectionPresentation(config.style);
  const Renderer = sectionRenderers[mapped.key] as (props: {
    data: SectionContentMap[CanonicalSectionKey];
    theme: typeof theme;
  }) => React.ReactNode;

  return (
    <PresentationProvider style={presentation} theme={theme}>
      <Renderer data={mapped.data} theme={theme} />
    </PresentationProvider>
  );
}

/** Shared with invitation preview — same renderer map */
export { sectionRenderers as sharedSectionRenderers };
