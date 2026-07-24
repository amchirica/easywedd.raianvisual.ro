import {
  CANONICAL_SECTION_KEYS,
  newId,
  type CanonicalSectionKey,
  type InvitationSectionsState,
  type SectionContentMap,
} from "@/lib/invitations/sections/types";

export function defaultStoryItems(): SectionContentMap["story"]["items"] {
  return [
    {
      id: newId("story"),
      date: "",
      title: "Prima întâlnire",
      description: "Momentul în care totul a început.",
      imageUrl: "",
    },
    {
      id: newId("story"),
      date: "",
      title: "Cererea în căsătorie",
      description: "Ziua în care am spus da vieții împreună.",
      imageUrl: "",
    },
  ];
}

export function defaultTimelineItems(): SectionContentMap["timeline"]["items"] {
  return [
    {
      id: newId("tl"),
      time: "14:00",
      title: "Cununia",
      description: "Ceremonie oficială.",
      location: "",
      icon: "rings",
    },
    {
      id: newId("tl"),
      time: "16:00",
      title: "Primirea invitaților",
      description: "Welcome drink și fotografii.",
      location: "",
      icon: "glass",
    },
    {
      id: newId("tl"),
      time: "18:00",
      title: "Cina festivă",
      description: "Masa de nuntă.",
      location: "",
      icon: "dinner",
    },
    {
      id: newId("tl"),
      time: "21:00",
      title: "Dansul mirilor",
      description: "Primul dans.",
      location: "",
      icon: "dance",
    },
    {
      id: newId("tl"),
      time: "22:00",
      title: "Petrecerea",
      description: "Dans și bucurie până târziu.",
      location: "",
      icon: "party",
    },
  ];
}

export function defaultFaqItems(): SectionContentMap["faq"]["items"] {
  return [
    {
      id: newId("faq"),
      question: "Care este dress code-ul?",
      answer: "Vă rugăm să consultați secțiunea Dress code.",
    },
    {
      id: newId("faq"),
      question: "Până când pot confirma participarea?",
      answer: "Vă rugăm să confirmați cât mai curând posibil.",
    },
  ];
}

export function defaultAccommodationItems(): SectionContentMap["accommodation"]["items"] {
  return [
    {
      id: newId("acc"),
      name: "Hotel recomandat",
      address: "",
      phone: "",
      website: "",
      bookingInfo: "Menționați nunta când rezervați.",
      mapUrl: "",
    },
  ];
}

export type WeddingDefaultsInput = {
  couple_name_1?: string | null;
  couple_name_2?: string | null;
  partner1_name?: string | null;
  partner2_name?: string | null;
  wedding_date?: string | null;
} | null;

export function sectionDefaults(
  key: CanonicalSectionKey,
  wedding?: WeddingDefaultsInput,
): SectionContentMap[CanonicalSectionKey] {
  const n1 =
    wedding?.couple_name_1?.trim() ||
    wedding?.partner1_name?.trim() ||
    "Partener 1";
  const n2 =
    wedding?.couple_name_2?.trim() ||
    wedding?.partner2_name?.trim() ||
    "Partener 2";
  const date = wedding?.wedding_date ?? "";

  switch (key) {
    case "hero":
      return {
        eyebrow: "Cu drag vă invităm",
        title: `${n1} & ${n2}`,
        subtitle: "la nunta noastră",
        imageUrl: "",
      };
    case "announcement":
      return {
        eyebrow: "Ne căsătorim",
        title: "Vă invităm să sărbătoriți alături de noi",
        description:
          "Cu emoție și bucurie, vă așteptăm alături de noi în ziua cea mare.",
      };
    case "couple":
      return {
        name1: n1,
        name2: n2,
        introText:
          "Cu bucurie în inimă, vă invităm să fiți alături de noi în această zi specială.",
        parentsText: "",
        godparentsText: "",
      };
    case "story":
      return {
        title: "Povestea noastră",
        introduction: "Câteva momente care ne-au adus până aici.",
        items: defaultStoryItems(),
      };
    case "countdown":
      return {
        title: "Până la ziua cea mare",
        targetDate: date,
      };
    case "when_where":
      return {
        title: "Când și unde",
        weddingDate: date,
        weddingTime: "16:00",
        ceremonyLocation: "",
        receptionLocation: "",
        mapUrl: "",
      };
    case "timeline":
      return {
        title: "Programul evenimentului",
        items: defaultTimelineItems(),
      };
    case "gallery":
      return {
        title: "Galerie",
        items: [],
      };
    case "dress_code":
      return {
        title: "Dress code",
        description: "Vă rugăm să alegeți ținute elegante, potrivite ocaziei.",
        colors: ["#8B7355", "#F5F0E8", "#2C2416"],
        inspirationImageUrl: "",
      };
    case "accommodation":
      return {
        title: "Cazare",
        description: "Recomandări de cazare pentru invitații din afara orașului.",
        items: defaultAccommodationItems(),
      };
    case "transport":
      return {
        title: "Transport",
        description: "Informații despre deplasare și transferuri.",
        pickupPoints: "",
        departureTimes: "",
        returnTimes: "",
        contact: "",
      };
    case "gifts":
      return {
        title: "Daruri",
        description:
          "Prezența voastră este cel mai frumos cadou. Dacă doriți totuși să ne oferiți ceva, găsiți detaliile mai jos.",
        bankDetails: "",
        registryUrl: "",
        hideBankDetails: true,
      };
    case "faq":
      return {
        title: "Întrebări frecvente",
        items: defaultFaqItems(),
      };
    case "rsvp":
      return {
        title: "Confirmare participare",
        message: "Vă rugăm să confirmați prezența până la data limită.",
      };
    case "footer":
      return {
        text: "Cu drag,",
        signature: `${n1} & ${n2}`,
      };
  }
}

export function createDefaultSections(
  wedding?: WeddingDefaultsInput,
): InvitationSectionsState {
  const sections = {} as InvitationSectionsState;
  for (const key of CANONICAL_SECTION_KEYS) {
    // Per-key assignment — avoid intersecting all section shapes
    Object.assign(sections, { [key]: sectionDefaults(key, wedding) });
  }
  return sections;
}
