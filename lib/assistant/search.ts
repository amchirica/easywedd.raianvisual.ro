import { EASYWEDD_KNOWLEDGE } from "@/lib/assistant/easywedd-knowledge";
import { normalizeAssistantPathname } from "@/lib/assistant/navigation";
import type { KnowledgeEntry } from "@/lib/assistant/types";
import type { Locale } from "@/lib/i18n/config";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreEntry(entry: KnowledgeEntry, query: string, locale: Locale): number {
  const q = normalizeText(query);
  if (!q) return 0;

  let score = 0;
  const title = normalizeText(entry.title[locale]);
  const description = normalizeText(entry.description[locale]);
  const keywords = entry.keywords[locale].map(normalizeText);
  const actions = entry.actions[locale].map(normalizeText);
  const route = normalizeText(entry.route);

  if (title === q) score += 40;
  if (title.includes(q) || q.includes(title)) score += 24;

  for (const kw of keywords) {
    if (!kw) continue;
    if (q === kw) score += 30;
    else if (q.includes(kw) || kw.includes(q)) score += 16;
  }

  for (const action of actions) {
    if (action && (q.includes(action) || action.includes(q))) score += 8;
  }

  if (description.includes(q)) score += 6;
  if (route.includes(q.replace(/\s+/g, ""))) score += 4;

  // Token overlap
  const tokens = q.split(" ").filter((t) => t.length > 2);
  for (const token of tokens) {
    if (title.includes(token)) score += 4;
    if (keywords.some((kw) => kw.includes(token))) score += 5;
    if (description.includes(token)) score += 2;
  }

  return score;
}

export type KnowledgeSearchHit = {
  entry: KnowledgeEntry;
  score: number;
};

export function searchKnowledge(
  query: string,
  locale: Locale,
  options?: { limit?: number; minScore?: number },
): KnowledgeSearchHit[] {
  const limit = options?.limit ?? 5;
  const minScore = options?.minScore ?? 8;

  return EASYWEDD_KNOWLEDGE.map((entry) => ({
    entry,
    score: scoreEntry(entry, query, locale),
  }))
    .filter((hit) => hit.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function findKnowledgeForPathname(
  pathname: string,
): KnowledgeEntry | undefined {
  const route = normalizeAssistantPathname(pathname);
  return EASYWEDD_KNOWLEDGE.find(
    (e) => e.route === route && !["rsvp", "documents"].includes(e.key),
  );
}

/** Detect “what can I do here?” style questions about the current page. */
export function isCurrentPageQuestion(query: string, locale: Locale): boolean {
  const q = normalizeText(query);
  const patterns =
    locale === "en"
      ? ["what can i do", "what do i do here", "help with this page", "explain this page", "this page"]
      : ["ce fac aici", "ce pot face aici", "ajutor pe pagina", "explica pagina", "pagina asta", "aici"];
  return patterns.some((p) => q.includes(p));
}
