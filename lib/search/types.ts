export type SearchCategory =
  | "guests"
  | "vendors"
  | "tasks"
  | "calendar"
  | "budget"
  | "documents"
  | "timeline"
  | "seating"
  | "invitations"
  | "website";

export type SearchHit = {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  href: string;
};

export type SearchGroup = {
  category: SearchCategory;
  items: SearchHit[];
};

export type SearchResult = {
  groups: SearchGroup[];
  error?: string;
  errorCode?: string;
};

export const SEARCH_MIN_CHARS = 2;
export const SEARCH_LIMIT_PER_CATEGORY = 8;

/** Strip chars that break PostgREST `.or()` filters; escape ilike wildcards. */
export function escapeIlike(raw: string): string {
  return raw
    .replace(/[,.()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function isSearchQueryReady(raw: string): boolean {
  return normalizeSearchQuery(raw).length >= SEARCH_MIN_CHARS;
}

export function groupSearchHits(hits: SearchHit[]): SearchGroup[] {
  const order: SearchCategory[] = [
    "guests",
    "vendors",
    "tasks",
    "calendar",
    "budget",
    "documents",
    "timeline",
    "seating",
    "invitations",
    "website",
  ];
  const byCategory = new Map<SearchCategory, SearchHit[]>();
  for (const hit of hits) {
    const list = byCategory.get(hit.category) ?? [];
    list.push(hit);
    byCategory.set(hit.category, list);
  }
  return order
    .filter((cat) => (byCategory.get(cat)?.length ?? 0) > 0)
    .map((category) => ({
      category,
      items: byCategory.get(category)!,
    }));
}

export function guestDisplayName(first: string, last: string): string {
  return `${first} ${last}`.trim() || first || last;
}

export function guestSearchHref(query: string, guestId: string): string {
  const q = encodeURIComponent(query);
  return `/dashboard/guests?q=${q}#guest-${guestId}`;
}
