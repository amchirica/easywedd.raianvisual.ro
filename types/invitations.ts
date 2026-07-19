export type InvitationProjectStatus = "draft" | "published" | "archived";

export type InvitationTemplateCategory =
  | "editorial"
  | "elegant"
  | "minimalist"
  | "romantic"
  | "botanical"
  | "luxury"
  | "modern"
  | "traditional_romanian"
  | "destination_wedding";

export type InvitationSectionKey =
  | "hero"
  | "couple"
  | "when_where"
  | "schedule"
  | "party"
  | "dress_code"
  | "travel"
  | "rsvp"
  | "footer";

export type InvitationThemeConfig = {
  background: string;
  foreground: string;
  accent: string;
  headingFont: string;
  bodyFont: string;
};

export type InvitationContentConfig = {
  coupleName1: string;
  coupleName2: string;
  weddingDate: string;
  weddingTime: string;
  ceremonyLocation: string;
  receptionLocation: string;
  scheduleText: string;
  parentsText: string;
  godparentsText: string;
  dressCode: string;
  travelInfo: string;
  accommodationInfo: string;
  mapUrl: string;
  heroImageUrl: string;
  introText: string;
  rsvpMessage: string;
  footerText: string;
  enabledSections: InvitationSectionKey[];
};

export type InvitationTemplate = {
  id: string;
  name: string;
  slug: string;
  category: InvitationTemplateCategory;
  thumbnail_url: string | null;
  template_schema: {
    sections?: InvitationSectionKey[];
    theme?: Partial<InvitationThemeConfig>;
  };
  is_premium: boolean;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
};

export type InvitationProject = {
  id: string;
  workspace_id: string;
  wedding_id: string;
  name: string;
  template_id: string | null;
  status: InvitationProjectStatus;
  theme_config: InvitationThemeConfig;
  content_config: InvitationContentConfig;
  language: string;
  preview_key: string;
  rsvp_deadline: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export const TEMPLATE_CATEGORIES: {
  value: InvitationTemplateCategory;
  label: string;
}[] = [
  { value: "editorial", label: "Editorial" },
  { value: "elegant", label: "Elegant" },
  { value: "minimalist", label: "Minimalist" },
  { value: "romantic", label: "Romantic" },
  { value: "botanical", label: "Botanical" },
  { value: "luxury", label: "Luxury" },
  { value: "modern", label: "Modern" },
  { value: "traditional_romanian", label: "Tradițional românesc" },
  { value: "destination_wedding", label: "Destination wedding" },
];

export const ALL_SECTIONS: { key: InvitationSectionKey; label: string }[] = [
  { key: "hero", label: "Hero" },
  { key: "couple", label: "Cuplu" },
  { key: "when_where", label: "Când & unde" },
  { key: "schedule", label: "Program" },
  { key: "party", label: "Părinți & nași" },
  { key: "dress_code", label: "Dress code" },
  { key: "travel", label: "Transport & cazare" },
  { key: "rsvp", label: "RSVP" },
  { key: "footer", label: "Footer" },
];
