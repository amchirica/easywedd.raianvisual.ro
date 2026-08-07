import {
  buildKnowledgeContextBlock,
  buildUserPrompt,
  ASSISTANT_SYSTEM_RULES,
} from "@/lib/assistant/prompts";
import { getAssistantAiProvider } from "@/lib/assistant/provider";
import { ASSISTANT_RATE_LIMIT } from "@/lib/assistant/rate-limit";
import {
  findKnowledgeForPathname,
  isCurrentPageQuestion,
  searchKnowledge,
} from "@/lib/assistant/search";
import { resolveAssistantRoute } from "@/lib/assistant/navigation";
import type {
  AssistantAskResult,
  AssistantLink,
  AssistantPageContext,
  KnowledgeEntry,
} from "@/lib/assistant/types";
import type { Locale } from "@/lib/i18n/config";
import { getDictionarySync } from "@/lib/i18n/get-dictionary";
import { t } from "@/lib/i18n/t";
import { canAccessFeature } from "@/lib/planner/access";

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function sanitizeUserMessage(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, ASSISTANT_RATE_LIMIT.maxInputChars);
}

function assistantCopy(locale: Locale) {
  return getDictionarySync(locale).assistant;
}

function linkFor(entry: KnowledgeEntry, locale: Locale): AssistantLink | null {
  const href = resolveAssistantRoute(entry.route);
  if (!href) return null;
  const a = assistantCopy(locale);
  return {
    href,
    label: t(a as never, "openLink", {
      params: { title: entry.title[locale] },
    }),
  };
}

function formatKnowledgeAnswer(
  entry: KnowledgeEntry,
  locale: Locale,
  options?: { featureUnavailable?: boolean },
): string {
  const a = assistantCopy(locale);
  if (options?.featureUnavailable) {
    return a.featureUnavailable;
  }

  const lines = [
    entry.description[locale],
    "",
    a.whatYouCanDo,
    ...entry.actions[locale].map((action) => `• ${action}`),
    "",
    a.steps,
    ...entry.steps[locale].map((step, i) => `${i + 1}. ${step}`),
  ];

  if (entry.limitations[locale].length) {
    lines.push(
      "",
      a.notes,
      ...entry.limitations[locale].map((limitation) => `• ${limitation}`),
    );
  }

  return truncate(lines.join("\n"), ASSISTANT_RATE_LIMIT.maxAnswerChars);
}

function unknownFallback(locale: Locale): AssistantAskResult {
  return {
    answer: assistantCopy(locale).unknownFallback,
    links: [],
    source: "fallback",
    matchedKey: null,
    category: "unknown",
    answered: false,
    featureUnavailable: false,
  };
}

function isFeatureEnabled(
  entry: KnowledgeEntry,
  enabledFeatures: string[],
  entitlements: { feature_key: string; enabled: boolean }[],
): boolean {
  if (!entry.featureKey) return true;
  if (enabledFeatures.includes(entry.featureKey)) return true;
  return canAccessFeature(entitlements, entry.featureKey);
}

/**
 * Prefer local knowledge for simple menu/how-to questions.
 * Optionally refine with AI when configured and knowledge is incomplete for phrasing.
 */
export async function answerAssistantQuestion(input: {
  message: string;
  context: AssistantPageContext;
  entitlements: { feature_key: string; enabled: boolean }[];
  preferAi?: boolean;
}): Promise<AssistantAskResult> {
  const locale = input.context.locale;
  const message = sanitizeUserMessage(input.message);
  if (!message) {
    return {
      answer: assistantCopy(locale).emptyPrompt,
      links: [],
      source: "fallback",
      matchedKey: null,
      category: "empty",
      answered: false,
      featureUnavailable: false,
    };
  }

  // Current-page questions
  if (isCurrentPageQuestion(message, locale)) {
    const pageEntry = findKnowledgeForPathname(input.context.pathname);
    if (pageEntry) {
      const available = isFeatureEnabled(
        pageEntry,
        input.context.enabledFeatures,
        input.entitlements,
      );
      const link = linkFor(pageEntry, locale);
      return {
        answer: formatKnowledgeAnswer(pageEntry, locale, {
          featureUnavailable: !available,
        }),
        links: link ? [link] : [],
        source: "knowledge",
        matchedKey: pageEntry.key,
        category: pageEntry.key,
        answered: true,
        featureUnavailable: !available,
      };
    }
  }

  const hits = searchKnowledge(message, locale, { limit: 3, minScore: 12 });
  const best = hits[0];

  if (!best) {
    // Try AI only if we have some nearby knowledge OR overview context
    const pageEntry = findKnowledgeForPathname(input.context.pathname);
    const seed = pageEntry ? [pageEntry] : [];
    const aiAnswer = await maybeAiAnswer({
      message,
      context: input.context,
      entries: seed,
    });
    if (aiAnswer) return aiAnswer;
    return unknownFallback(locale);
  }

  const available = isFeatureEnabled(
    best.entry,
    input.context.enabledFeatures,
    input.entitlements,
  );

  // Strong local match → answer from knowledge (cost control)
  if (best.score >= 14) {
    const link = linkFor(best.entry, locale);
    if (!available) {
      return {
        answer: formatKnowledgeAnswer(best.entry, locale, {
          featureUnavailable: true,
        }),
        links: [
          {
            href: "/dashboard/billing",
            label: assistantCopy(locale).openBilling,
          },
        ],
        source: "knowledge",
        matchedKey: best.entry.key,
        category: best.entry.key,
        answered: true,
        featureUnavailable: true,
      };
    }

    // Optional AI polish when configured and query is longer / multi-intent
    const shouldPolish =
      Boolean(input.preferAi) ||
      message.length > 80 ||
      /\b(and|și|also|de asemenea)\b/i.test(message);

    if (shouldPolish) {
      const polished = await maybeAiAnswer({
        message,
        context: input.context,
        entries: hits.map((h) => h.entry),
      });
      if (polished) return polished;
    }

    return {
      answer: formatKnowledgeAnswer(best.entry, locale),
      links: link ? [link] : [],
      source: "knowledge",
      matchedKey: best.entry.key,
      category: best.entry.key,
      answered: true,
      featureUnavailable: false,
    };
  }

  const aiAnswer = await maybeAiAnswer({
    message,
    context: input.context,
    entries: hits.map((h) => h.entry),
  });
  if (aiAnswer) return aiAnswer;

  return unknownFallback(locale);
}

async function maybeAiAnswer(input: {
  message: string;
  context: AssistantPageContext;
  entries: KnowledgeEntry[];
}): Promise<AssistantAskResult | null> {
  const provider = getAssistantAiProvider();
  if (!provider.isConfigured()) return null;

  const locale = input.context.locale;
  const knowledgeBlock = buildKnowledgeContextBlock(input.entries, locale);
  const completion = await provider.complete({
    system: ASSISTANT_SYSTEM_RULES,
    user: buildUserPrompt({
      locale,
      pathname: input.context.pathname,
      role: input.context.role,
      enabledFeatures: input.context.enabledFeatures,
      message: input.message,
      knowledgeBlock,
    }),
    maxTokens: 400,
    timeoutMs: 12_000,
  });

  if (!completion?.text) return null;

  const primary = input.entries[0];
  const link = primary ? linkFor(primary, locale) : null;

  return {
    answer: truncate(completion.text, ASSISTANT_RATE_LIMIT.maxAnswerChars),
    links: link ? [link] : [],
    source: "ai",
    matchedKey: primary?.key ?? null,
    category: primary?.key ?? "ai",
    answered: true,
    featureUnavailable: false,
  };
}
