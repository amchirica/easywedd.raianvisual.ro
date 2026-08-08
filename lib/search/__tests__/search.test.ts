import { describe, expect, it } from "vitest";

import {
  escapeIlike,
  groupSearchHits,
  guestDisplayName,
  isSearchQueryReady,
  normalizeSearchQuery,
  SEARCH_MIN_CHARS,
  type SearchHit,
} from "@/lib/search/types";

describe("workspace search helpers", () => {
  it("requires minimum characters", () => {
    expect(SEARCH_MIN_CHARS).toBe(2);
    expect(isSearchQueryReady("a")).toBe(false);
    expect(isSearchQueryReady("  a ")).toBe(false);
    expect(isSearchQueryReady("ab")).toBe(true);
    expect(isSearchQueryReady("  ab  ")).toBe(true);
  });

  it("normalizes whitespace", () => {
    expect(normalizeSearchQuery("  Ana   Pop  ")).toBe("Ana Pop");
  });

  it("escapes ilike wildcards and filter breakers", () => {
    expect(escapeIlike("100%_ok")).toBe("100\\%\\_ok");
    expect(escapeIlike("a,b(c)")).toBe("a b c");
  });

  it("groups hits in stable category order", () => {
    const hits: SearchHit[] = [
      {
        id: "1",
        category: "website",
        title: "site",
        href: "/dashboard/website/1",
      },
      {
        id: "2",
        category: "guests",
        title: "Ana",
        href: "/dashboard/guests",
      },
      {
        id: "3",
        category: "budget",
        title: "Foto",
        href: "/dashboard/budget",
      },
    ];
    const groups = groupSearchHits(hits);
    expect(groups.map((g) => g.category)).toEqual([
      "guests",
      "budget",
      "website",
    ]);
  });

  it("builds guest display names", () => {
    expect(guestDisplayName("Ana", "Pop")).toBe("Ana Pop");
    expect(guestDisplayName("Ana", "")).toBe("Ana");
  });
});
