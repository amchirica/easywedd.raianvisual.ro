import { sectionDefaults } from "@/lib/invitations/sections/defaults";
import {
  mapLegacySectionKey,
  type CanonicalSectionKey,
  type SectionContentMap,
} from "@/lib/invitations/sections/types";
import type { SiteSectionConfig, SiteThemeConfig } from "@/types/website";
import type { InvitationThemeConfig } from "@/types/invitations";

/** Map wedding-site section types onto invitation canonical keys when possible */
export function mapWebsiteSectionType(type: string): CanonicalSectionKey | null {
  if (type === "schedule") return "timeline";
  if (type === "locations" || type === "map") return "when_where";
  if (type === "family") return "couple";
  if (type === "contact") return "footer";
  return mapLegacySectionKey(type);
}

export function siteThemeToInvitationTheme(
  theme: SiteThemeConfig,
): InvitationThemeConfig {
  return {
    background: theme.background,
    foreground: theme.foreground,
    accent: theme.accent,
    headingFont: theme.headingFont,
    bodyFont: theme.bodyFont,
  };
}

/**
 * Convert stored website section_config into rich section content.
 * Prefer `config.rich` when present; otherwise derive from legacy title/body/items.
 */
export function siteConfigToSectionData(
  type: string,
  config: SiteSectionConfig & { rich?: Partial<SectionContentMap[CanonicalSectionKey]> },
): { key: CanonicalSectionKey; data: SectionContentMap[CanonicalSectionKey] } | null {
  const key = mapWebsiteSectionType(type);
  if (!key) return null;

  const defaults = sectionDefaults(key);
  const rich = config.rich;

  if (rich && typeof rich === "object") {
    return { key, data: { ...defaults, ...rich } as SectionContentMap[CanonicalSectionKey] };
  }

  switch (key) {
    case "hero":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["hero"]),
          title: config.title || (defaults as SectionContentMap["hero"]).title,
          subtitle: config.body || "",
          imageUrl: config.imageUrl || "",
        },
      };
    case "story":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["story"]),
          title: config.title || (defaults as SectionContentMap["story"]).title,
          introduction: config.body || (defaults as SectionContentMap["story"]).introduction,
        },
      };
    case "countdown":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["countdown"]),
          title: config.title || (defaults as SectionContentMap["countdown"]).title,
          targetDate: config.date || "",
        },
      };
    case "timeline":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["timeline"]),
          title: config.title || (defaults as SectionContentMap["timeline"]).title,
          items: (config.items?.length
            ? config.items.map((title, i) => ({
                id: `site_tl_${i}`,
                time: "",
                title,
                description: "",
                location: "",
                icon: "dot",
              }))
            : (defaults as SectionContentMap["timeline"]).items),
        },
      };
    case "when_where":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["when_where"]),
          title: config.title || (defaults as SectionContentMap["when_where"]).title,
          ceremonyLocation: config.body || "",
          mapUrl: config.mapUrl || "",
        },
      };
    case "gallery":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["gallery"]),
          title: config.title || (defaults as SectionContentMap["gallery"]).title,
          items: (config.items ?? []).map((url, i) => ({
            id: `site_gal_${i}`,
            url,
            caption: "",
          })),
        },
      };
    case "dress_code":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["dress_code"]),
          title: config.title || (defaults as SectionContentMap["dress_code"]).title,
          description: config.body || (defaults as SectionContentMap["dress_code"]).description,
        },
      };
    case "faq":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["faq"]),
          title: config.title || (defaults as SectionContentMap["faq"]).title,
          items: (config.items?.length
            ? config.items.map((q, i) => ({
                id: `site_faq_${i}`,
                question: q,
                answer: "",
              }))
            : (defaults as SectionContentMap["faq"]).items),
        },
      };
    case "gifts":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["gifts"]),
          title: config.title || (defaults as SectionContentMap["gifts"]).title,
          description: config.body || (defaults as SectionContentMap["gifts"]).description,
        },
      };
    case "transport":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["transport"]),
          title: config.title || (defaults as SectionContentMap["transport"]).title,
          description: config.body || (defaults as SectionContentMap["transport"]).description,
        },
      };
    case "accommodation":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["accommodation"]),
          title: config.title || (defaults as SectionContentMap["accommodation"]).title,
          description:
            config.body || (defaults as SectionContentMap["accommodation"]).description,
        },
      };
    case "rsvp":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["rsvp"]),
          title: config.title || (defaults as SectionContentMap["rsvp"]).title,
          message: config.body || (defaults as SectionContentMap["rsvp"]).message,
        },
      };
    case "couple":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["couple"]),
          introText: config.body || (defaults as SectionContentMap["couple"]).introText,
          parentsText: config.items?.[0] || "",
          godparentsText: config.items?.[1] || "",
        },
      };
    case "footer":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["footer"]),
          text: config.title || (defaults as SectionContentMap["footer"]).text,
          signature: config.body || "",
        },
      };
    case "announcement":
      return {
        key,
        data: {
          ...(defaults as SectionContentMap["announcement"]),
          title: config.title || (defaults as SectionContentMap["announcement"]).title,
          description:
            config.body || (defaults as SectionContentMap["announcement"]).description,
        },
      };
    default:
      return { key, data: defaults };
  }
}

/** Persist rich section content + presentation back into website section_config */
export function sectionDataToSiteConfig(
  key: CanonicalSectionKey,
  data: SectionContentMap[CanonicalSectionKey],
  style?: Record<string, unknown>,
  previous?: SiteSectionConfig,
): SiteSectionConfig {
  const base: SiteSectionConfig = {
    ...previous,
    rich: data as unknown as Record<string, unknown>,
    style: style ?? previous?.style,
  };

  switch (key) {
    case "hero": {
      const d = data as SectionContentMap["hero"];
      return { ...base, title: d.title, body: d.subtitle, imageUrl: d.imageUrl };
    }
    case "story": {
      const d = data as SectionContentMap["story"];
      return { ...base, title: d.title, body: d.introduction };
    }
    case "countdown": {
      const d = data as SectionContentMap["countdown"];
      return { ...base, title: d.title, date: d.targetDate };
    }
    case "timeline": {
      const d = data as SectionContentMap["timeline"];
      return {
        ...base,
        title: d.title,
        items: d.items.map((i) => i.title).filter(Boolean),
      };
    }
    case "when_where": {
      const d = data as SectionContentMap["when_where"];
      return {
        ...base,
        title: d.title,
        body: d.ceremonyLocation,
        mapUrl: d.mapUrl,
        date: d.weddingDate,
      };
    }
    case "gallery": {
      const d = data as SectionContentMap["gallery"];
      return {
        ...base,
        title: d.title,
        items: d.items.map((i) => i.url).filter(Boolean),
      };
    }
    case "faq": {
      const d = data as SectionContentMap["faq"];
      return {
        ...base,
        title: d.title,
        items: d.items.map((i) => i.question).filter(Boolean),
      };
    }
    case "rsvp": {
      const d = data as SectionContentMap["rsvp"];
      return { ...base, title: d.title, body: d.message, rsvpUrl: previous?.rsvpUrl };
    }
    case "footer": {
      const d = data as SectionContentMap["footer"];
      return { ...base, title: d.text, body: d.signature };
    }
    case "couple": {
      const d = data as SectionContentMap["couple"];
      return {
        ...base,
        title: [d.name1, d.name2].filter(Boolean).join(" & "),
        body: d.introText,
        items: [d.parentsText, d.godparentsText].filter(Boolean),
      };
    }
    default: {
      const titled = data as { title?: string; description?: string };
      return {
        ...base,
        title: titled.title ?? previous?.title,
        body: titled.description ?? previous?.body,
      };
    }
  }
}
