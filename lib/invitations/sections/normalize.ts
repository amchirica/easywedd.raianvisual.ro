import { normalizeSectionPresentation } from "@/lib/builder/presentation";
import { sectionDefaults } from "@/lib/invitations/sections/defaults";
import {
  CANONICAL_SECTION_KEYS,
  isCanonicalSectionKey,
  mapLegacySectionKey,
  normalizeSectionOrder,
  type CanonicalSectionKey,
  type InvitationContentConfigV2,
  type InvitationSectionsState,
  type SectionContentMap,
} from "@/lib/invitations/sections/types";

type WeddingLike = {
  couple_name_1?: string | null;
  couple_name_2?: string | null;
  partner1_name?: string | null;
  partner2_name?: string | null;
  wedding_date?: string | null;
} | null;

type LooseRecord = Record<string, unknown>;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function mergeSection<K extends CanonicalSectionKey>(
  key: K,
  existing: unknown,
  wedding: WeddingLike,
): SectionContentMap[K] {
  const defaults = sectionDefaults(key, wedding) as SectionContentMap[K];
  if (!existing || typeof existing !== "object") return defaults;
  const src = existing as LooseRecord;

  switch (key) {
    case "hero":
      return {
        eyebrow: asString(src.eyebrow, (defaults as SectionContentMap["hero"]).eyebrow),
        title: asString(src.title, (defaults as SectionContentMap["hero"]).title),
        subtitle: asString(src.subtitle, (defaults as SectionContentMap["hero"]).subtitle),
        imageUrl: asString(src.imageUrl, (defaults as SectionContentMap["hero"]).imageUrl),
      } as SectionContentMap[K];
    case "announcement":
      return {
        eyebrow: asString(src.eyebrow, (defaults as SectionContentMap["announcement"]).eyebrow),
        title: asString(src.title, (defaults as SectionContentMap["announcement"]).title),
        description: asString(
          src.description,
          (defaults as SectionContentMap["announcement"]).description,
        ),
      } as SectionContentMap[K];
    case "couple":
      return {
        name1: asString(src.name1, (defaults as SectionContentMap["couple"]).name1),
        name2: asString(src.name2, (defaults as SectionContentMap["couple"]).name2),
        introText: asString(src.introText, (defaults as SectionContentMap["couple"]).introText),
        parentsText: asString(
          src.parentsText,
          (defaults as SectionContentMap["couple"]).parentsText,
        ),
        godparentsText: asString(
          src.godparentsText,
          (defaults as SectionContentMap["couple"]).godparentsText,
        ),
      } as SectionContentMap[K];
    case "story": {
      const d = defaults as SectionContentMap["story"];
      const items = asArray<LooseRecord>(src.items).map((item, i) => ({
        id: asString(item.id, `story_${i}`),
        date: asString(item.date),
        title: asString(item.title),
        description: asString(item.description),
        imageUrl: asString(item.imageUrl),
      }));
      return {
        title: asString(src.title, d.title),
        introduction: asString(src.introduction, d.introduction),
        items: items.length ? items : d.items,
      } as SectionContentMap[K];
    }
    case "countdown":
      return {
        title: asString(src.title, (defaults as SectionContentMap["countdown"]).title),
        targetDate: asString(
          src.targetDate,
          (defaults as SectionContentMap["countdown"]).targetDate,
        ),
      } as SectionContentMap[K];
    case "when_where":
      return {
        title: asString(src.title, (defaults as SectionContentMap["when_where"]).title),
        weddingDate: asString(
          src.weddingDate,
          (defaults as SectionContentMap["when_where"]).weddingDate,
        ),
        weddingTime: asString(
          src.weddingTime,
          (defaults as SectionContentMap["when_where"]).weddingTime,
        ),
        ceremonyLocation: asString(
          src.ceremonyLocation,
          (defaults as SectionContentMap["when_where"]).ceremonyLocation,
        ),
        receptionLocation: asString(
          src.receptionLocation,
          (defaults as SectionContentMap["when_where"]).receptionLocation,
        ),
        mapUrl: asString(src.mapUrl, (defaults as SectionContentMap["when_where"]).mapUrl),
      } as SectionContentMap[K];
    case "timeline": {
      const d = defaults as SectionContentMap["timeline"];
      const items = asArray<LooseRecord>(src.items).map((item, i) => ({
        id: asString(item.id, `tl_${i}`),
        time: asString(item.time),
        title: asString(item.title),
        description: asString(item.description),
        location: asString(item.location),
        icon: asString(item.icon, "dot"),
      }));
      return {
        title: asString(src.title, d.title),
        items: items.length ? items : d.items,
      } as SectionContentMap[K];
    }
    case "gallery": {
      const d = defaults as SectionContentMap["gallery"];
      const items = asArray<LooseRecord>(src.items).map((item, i) => ({
        id: asString(item.id, `gal_${i}`),
        url: asString(item.url ?? item.imageUrl),
        caption: asString(item.caption),
      }));
      return {
        title: asString(src.title, d.title),
        items,
      } as SectionContentMap[K];
    }
    case "dress_code": {
      const d = defaults as SectionContentMap["dress_code"];
      const colors = asArray<unknown>(src.colors)
        .filter((c): c is string => typeof c === "string" && c.length > 0);
      return {
        title: asString(src.title, d.title),
        description: asString(src.description, d.description),
        colors: colors.length ? colors : d.colors,
        inspirationImageUrl: asString(src.inspirationImageUrl, d.inspirationImageUrl),
      } as SectionContentMap[K];
    }
    case "accommodation": {
      const d = defaults as SectionContentMap["accommodation"];
      const items = asArray<LooseRecord>(src.items).map((item, i) => ({
        id: asString(item.id, `acc_${i}`),
        name: asString(item.name),
        address: asString(item.address),
        phone: asString(item.phone),
        website: asString(item.website),
        bookingInfo: asString(item.bookingInfo),
        mapUrl: asString(item.mapUrl),
      }));
      return {
        title: asString(src.title, d.title),
        description: asString(src.description, d.description),
        items: items.length ? items : d.items,
      } as SectionContentMap[K];
    }
    case "transport":
      return {
        title: asString(src.title, (defaults as SectionContentMap["transport"]).title),
        description: asString(
          src.description,
          (defaults as SectionContentMap["transport"]).description,
        ),
        pickupPoints: asString(
          src.pickupPoints,
          (defaults as SectionContentMap["transport"]).pickupPoints,
        ),
        departureTimes: asString(
          src.departureTimes,
          (defaults as SectionContentMap["transport"]).departureTimes,
        ),
        returnTimes: asString(
          src.returnTimes,
          (defaults as SectionContentMap["transport"]).returnTimes,
        ),
        contact: asString(src.contact, (defaults as SectionContentMap["transport"]).contact),
      } as SectionContentMap[K];
    case "gifts":
      return {
        title: asString(src.title, (defaults as SectionContentMap["gifts"]).title),
        description: asString(
          src.description,
          (defaults as SectionContentMap["gifts"]).description,
        ),
        bankDetails: asString(
          src.bankDetails,
          (defaults as SectionContentMap["gifts"]).bankDetails,
        ),
        registryUrl: asString(
          src.registryUrl,
          (defaults as SectionContentMap["gifts"]).registryUrl,
        ),
        hideBankDetails: asBool(
          src.hideBankDetails,
          (defaults as SectionContentMap["gifts"]).hideBankDetails,
        ),
      } as SectionContentMap[K];
    case "faq": {
      const d = defaults as SectionContentMap["faq"];
      const items = asArray<LooseRecord>(src.items).map((item, i) => ({
        id: asString(item.id, `faq_${i}`),
        question: asString(item.question),
        answer: asString(item.answer),
      }));
      return {
        title: asString(src.title, d.title),
        items: items.length ? items : d.items,
      } as SectionContentMap[K];
    }
    case "rsvp":
      return {
        title: asString(src.title, (defaults as SectionContentMap["rsvp"]).title),
        message: asString(src.message, (defaults as SectionContentMap["rsvp"]).message),
      } as SectionContentMap[K];
    case "footer":
      return {
        text: asString(src.text, (defaults as SectionContentMap["footer"]).text),
        signature: asString(src.signature, (defaults as SectionContentMap["footer"]).signature),
      } as SectionContentMap[K];
  }
}

/** Build section bag from legacy flat fields (without wiping existing section data). */
function sectionsFromLegacyFlat(
  raw: LooseRecord,
  wedding: WeddingLike,
): Partial<InvitationSectionsState> {
  const n1 = asString(
    raw.coupleName1,
    wedding?.couple_name_1 ?? wedding?.partner1_name ?? "",
  );
  const n2 = asString(
    raw.coupleName2,
    wedding?.couple_name_2 ?? wedding?.partner2_name ?? "",
  );
  const date = asString(raw.weddingDate, wedding?.wedding_date ?? "");

  return {
    hero: {
      eyebrow: "Cu drag vă invităm",
      title: n1 && n2 ? `${n1} & ${n2}` : asString(raw.coupleName1) || "Invitație",
      subtitle: "la nunta noastră",
      imageUrl: asString(raw.heroImageUrl),
    },
    couple: {
      name1: n1 || "Partener 1",
      name2: n2 || "Partener 2",
      ...(typeof raw.introText === "string" && raw.introText.length > 0
        ? { introText: asString(raw.introText) }
        : {}),
      parentsText: asString(raw.parentsText),
      godparentsText: asString(raw.godparentsText),
    } as SectionContentMap["couple"],
    when_where: {
      title: "Când și unde",
      weddingDate: date,
      weddingTime: asString(raw.weddingTime, "16:00"),
      ceremonyLocation: asString(raw.ceremonyLocation),
      receptionLocation: asString(raw.receptionLocation),
      mapUrl: asString(raw.mapUrl),
    },
    ...(asString(raw.scheduleText)
      ? {
          timeline: {
            title: "Programul evenimentului",
            items: [
              {
                id: "tl_legacy",
                time: "",
                title: "Program",
                description: asString(raw.scheduleText),
                location: "",
                icon: "dot",
              },
            ],
          },
        }
      : {}),
    ...(asString(raw.dressCode)
      ? {
          dress_code: {
            title: "Dress code",
            description: asString(raw.dressCode),
            colors: ["#8B7355", "#F5F0E8", "#2C2416"],
            inspirationImageUrl: "",
          },
        }
      : {}),
    ...(asString(raw.travelInfo)
      ? {
          transport: {
            title: "Transport",
            description: asString(raw.travelInfo),
            pickupPoints: "",
            departureTimes: "",
            returnTimes: "",
            contact: "",
          },
        }
      : {}),
    ...(asString(raw.accommodationInfo)
      ? {
          accommodation: {
            title: "Cazare",
            description: asString(raw.accommodationInfo),
            items: [],
          },
        }
      : {}),
    ...(typeof raw.rsvpMessage === "string" && raw.rsvpMessage.length > 0
      ? {
          rsvp: {
            title: "Confirmare participare",
            message: asString(raw.rsvpMessage),
          },
        }
      : {}),
    ...(typeof raw.footerText === "string" && raw.footerText.length > 0
      ? {
          footer: {
            text: asString(raw.footerText),
            signature: n1 && n2 ? `${n1} & ${n2}` : "",
          },
        }
      : {
          footer: {
            text: "Cu drag,",
            signature: n1 && n2 ? `${n1} & ${n2}` : "",
          },
        }),
    ...(date
      ? {
          countdown: {
            title: "Până la ziua cea mare",
            targetDate: date,
          },
        }
      : {}),
  };
}

function syncLegacyFlatFromSections(
  sections: InvitationSectionsState,
): Pick<
  InvitationContentConfigV2,
  | "coupleName1"
  | "coupleName2"
  | "weddingDate"
  | "weddingTime"
  | "ceremonyLocation"
  | "receptionLocation"
  | "scheduleText"
  | "parentsText"
  | "godparentsText"
  | "dressCode"
  | "travelInfo"
  | "accommodationInfo"
  | "mapUrl"
  | "heroImageUrl"
  | "introText"
  | "rsvpMessage"
  | "footerText"
> {
  const timelineText = sections.timeline.items
    .map((i) => [i.time, i.title, i.description].filter(Boolean).join(" — "))
    .filter(Boolean)
    .join("\n");

  return {
    coupleName1: sections.couple.name1,
    coupleName2: sections.couple.name2,
    weddingDate: sections.when_where.weddingDate || sections.countdown.targetDate,
    weddingTime: sections.when_where.weddingTime,
    ceremonyLocation: sections.when_where.ceremonyLocation,
    receptionLocation: sections.when_where.receptionLocation,
    scheduleText: timelineText,
    parentsText: sections.couple.parentsText,
    godparentsText: sections.couple.godparentsText,
    dressCode: sections.dress_code.description,
    travelInfo: sections.transport.description,
    accommodationInfo: sections.accommodation.description,
    mapUrl: sections.when_where.mapUrl,
    heroImageUrl: sections.hero.imageUrl,
    introText: sections.couple.introText,
    rsvpMessage: sections.rsvp.message,
    footerText: sections.footer.text,
  };
}

/**
 * Normalize any stored content_config into V2 shape.
 * Preserves existing section data; fills missing advanced sections with defaults.
 */
export function normalizeInvitationContent(
  input: unknown,
  options?: {
    wedding?: WeddingLike;
    templateSections?: string[] | null;
  },
): InvitationContentConfigV2 {
  const wedding = options?.wedding ?? null;
  const raw = (input && typeof input === "object" ? input : {}) as LooseRecord;
  const fromLegacy = sectionsFromLegacyFlat(raw, wedding);

  const rawSections =
    raw.sections && typeof raw.sections === "object"
      ? (raw.sections as LooseRecord)
      : {};

  const sections = {} as InvitationSectionsState;
  for (const key of CANONICAL_SECTION_KEYS) {
    const existing = rawSections[key] ?? fromLegacy[key];
    Object.assign(sections, {
      [key]: mergeSection(key, existing, wedding),
    });
  }

  // Prefer explicit template order, else saved order, else enabledSections, else all canonical
  const orderSource =
    options?.templateSections ??
    (Array.isArray(raw.sectionOrder) ? (raw.sectionOrder as string[]) : null) ??
    (Array.isArray(raw.enabledSections) ? (raw.enabledSections as string[]) : null);

  let sectionOrder = normalizeSectionOrder(orderSource);

  // When upgrading to an advanced template, ensure every template section appears
  if (options?.templateSections?.length) {
    sectionOrder = normalizeSectionOrder(options.templateSections);
  }

  // enabledSections: preserve previous enables mapped to canonical; newly added sections start enabled
  const previousEnabled = normalizeSectionOrder(
    Array.isArray(raw.enabledSections) ? (raw.enabledSections as string[]) : sectionOrder,
  );
  const previousSet = new Set(previousEnabled);
  const hadOnlyLegacy =
    previousEnabled.every((k) =>
      ["hero", "couple", "when_where", "rsvp", "footer", "timeline", "dress_code", "transport"].includes(
        k,
      ),
    ) && previousEnabled.length <= 9;

  const enabledSections = sectionOrder.filter((key) => {
    if (previousSet.has(key)) return true;
    // New advanced sections when upgrading: enable by default
    if (hadOnlyLegacy || !previousEnabled.length) return true;
    return true;
  });

  const flat = syncLegacyFlatFromSections(sections);

  const sectionStylesRaw =
    raw.sectionStyles && typeof raw.sectionStyles === "object"
      ? (raw.sectionStyles as Record<string, unknown>)
      : {};
  const sectionStyles: InvitationContentConfigV2["sectionStyles"] = {};
  for (const key of CANONICAL_SECTION_KEYS) {
    if (sectionStylesRaw[key]) {
      sectionStyles[key] = normalizeSectionPresentation(sectionStylesRaw[key]);
    }
  }

  return {
    ...flat,
    enabledSections,
    sectionOrder,
    sections,
    sectionStyles:
      Object.keys(sectionStyles).length > 0 ? sectionStyles : undefined,
  };
}

/** Ensure missing keys from a new template are initialized without overwriting existing. */
export function upgradeContentForTemplate(
  content: InvitationContentConfigV2,
  templateSections: string[],
  wedding?: WeddingLike,
): InvitationContentConfigV2 {
  const order = normalizeSectionOrder(templateSections);
  const sections = { ...content.sections };
  for (const key of order) {
    if (!sections[key]) {
      Object.assign(sections, { [key]: sectionDefaults(key, wedding) });
    }
  }
  const enabledSet = new Set(content.enabledSections);
  for (const key of order) {
    if (!enabledSet.has(key)) enabledSet.add(key);
  }
  return {
    ...content,
    sections,
    sectionOrder: order,
    enabledSections: order.filter((k) => enabledSet.has(k)),
  };
}

export function getSectionContent<K extends CanonicalSectionKey>(
  content: InvitationContentConfigV2,
  key: K,
): SectionContentMap[K] {
  return content.sections[key] ?? (sectionDefaults(key) as SectionContentMap[K]);
}

export function isSectionEnabled(
  content: InvitationContentConfigV2,
  key: CanonicalSectionKey,
): boolean {
  return content.enabledSections.includes(key);
}

export function listEditorSections(
  content: InvitationContentConfigV2,
): CanonicalSectionKey[] {
  return content.sectionOrder.length
    ? content.sectionOrder
    : [...CANONICAL_SECTION_KEYS];
}

export function filterUnknownSections(keys: string[]): CanonicalSectionKey[] {
  return keys
    .map((k) => mapLegacySectionKey(k))
    .filter((k): k is CanonicalSectionKey => k !== null);
}

export function safeSectionKey(value: string): CanonicalSectionKey | null {
  return isCanonicalSectionKey(value) ? value : mapLegacySectionKey(value);
}
