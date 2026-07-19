import type { SiteSectionConfig, SiteThemeConfig, WeddingSiteSectionType } from "@/types/website";

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

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: theme.background,
        color: theme.foreground,
        fontFamily: `"${theme.bodyFont}", sans-serif`,
      }}
    >
      {visible.map((section) => (
        <SectionBlock
          key={section.id}
          type={section.section_type}
          config={section.section_config}
          theme={theme}
        />
      ))}
      {showBranding ? (
        <p className="px-6 pb-8 text-center text-[10px] tracking-[0.2em] uppercase opacity-40">
          EasyWedd
        </p>
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
  theme: SiteThemeConfig;
}) {
  const headingStyle = { fontFamily: `"${theme.headingFont}", serif` };

  if (type === "hero") {
    return (
      <section className="relative min-h-[280px] px-6 py-16 text-center">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background: `linear-gradient(160deg, ${theme.accent}66, transparent 65%)`,
          }}
        />
        <div className="relative">
          <h1 className="text-4xl sm:text-5xl" style={headingStyle}>
            {config.title || "Nunta noastră"}
          </h1>
          {config.body ? <p className="mt-4 text-sm opacity-80">{config.body}</p> : null}
        </div>
      </section>
    );
  }

  if (type === "rsvp") {
    return (
      <section className="px-6 py-10 text-center">
        <h2 className="text-2xl" style={headingStyle}>
          {config.title || "RSVP"}
        </h2>
        <p className="mt-3 text-sm opacity-90">{config.body}</p>
        {config.rsvpUrl ? (
          <a
            href={config.rsvpUrl}
            className="mt-4 inline-block text-sm underline underline-offset-4"
            style={{ color: theme.accent }}
          >
            Confirmă prezența
          </a>
        ) : null}
      </section>
    );
  }

  return (
    <section className="px-6 py-8 text-center">
      <h2 className="text-2xl capitalize" style={headingStyle}>
        {config.title || type.replaceAll("_", " ")}
      </h2>
      {config.body ? (
        <p className="mx-auto mt-3 max-w-xl whitespace-pre-line text-sm opacity-90">
          {config.body}
        </p>
      ) : null}
      {config.items?.length ? (
        <ul className="mx-auto mt-4 max-w-md space-y-2 text-sm opacity-90">
          {config.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {config.mapUrl ? (
        <a
          href={config.mapUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm underline"
          style={{ color: theme.accent }}
        >
          Vezi pe hartă
        </a>
      ) : null}
    </section>
  );
}
