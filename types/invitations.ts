import type {
  CanonicalSectionKey,
  InvitationContentConfigV2,
} from "@/lib/invitations/sections/types";
import { CANONICAL_SECTION_KEYS, SECTION_LABELS_RO } from "@/lib/invitations/sections/types";

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

/** @deprecated Prefer CanonicalSectionKey — kept for legacy template strings */
export type InvitationSectionKey =
  | CanonicalSectionKey
  | "schedule"
  | "party"
  | "travel";

export type InvitationThemeConfig = {
  background: string;
  foreground: string;
  accent: string;
  headingFont: string;
  bodyFont: string;
  density?: "compact" | "comfortable" | "spacious";
  radius?: "none" | "sm" | "md" | "lg";
  pageGradientFrom?: string;
  pageGradientTo?: string;
  buttonBackground?: string;
  buttonForeground?: string;
};

export type InvitationContentConfig = InvitationContentConfigV2;

export type InvitationTemplate = {
  id: string;
  name: string;
  slug: string;
  category: InvitationTemplateCategory;
  thumbnail_url: string | null;
  template_schema: {
    sections?: string[];
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

/** Sidebar labels — use template order from content.sectionOrder in the editor */
export const ALL_SECTIONS: { key: CanonicalSectionKey; label: string }[] =
  CANONICAL_SECTION_KEYS.map((key) => ({
    key,
    label: SECTION_LABELS_RO[key],
  }));
