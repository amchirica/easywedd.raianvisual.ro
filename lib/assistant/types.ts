import type { EntitlementKey } from "@/lib/entitlements/keys";
import type { Locale } from "@/lib/i18n/config";

export type AssistantLink = {
  href: string;
  label: string;
};

export type KnowledgeEntry = {
  key: string;
  route: string;
  featureKey?: EntitlementKey | null;
  keywords: Record<Locale, string[]>;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  actions: Record<Locale, string[]>;
  steps: Record<Locale, string[]>;
  limitations: Record<Locale, string[]>;
};

export type AssistantPageContext = {
  pathname: string;
  locale: Locale;
  role: string | null;
  enabledFeatures: string[];
};

export type AssistantAskInput = {
  message: string;
  pathname: string;
};

export type AssistantAskResult = {
  answer: string;
  links: AssistantLink[];
  source: "knowledge" | "ai" | "fallback";
  matchedKey: string | null;
  category: string;
  answered: boolean;
  featureUnavailable: boolean;
};

export type AssistantFeedbackInput = {
  helpful: boolean;
  category?: string;
  pathname?: string;
  matchedKey?: string | null;
  comment?: string;
};
