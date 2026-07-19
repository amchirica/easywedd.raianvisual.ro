import { describe, expect, it } from "vitest";

import {
  mergeTemplateDefaults,
  sanitizePlainText,
  sanitizeContent,
  defaultContent,
} from "@/lib/invitations/schema";

describe("sanitizePlainText", () => {
  it("strips tags", () => {
    expect(sanitizePlainText('<script>x</script>Ana')).toBe("xAna");
  });
});

describe("mergeTemplateDefaults", () => {
  it("merges wedding names into content", () => {
    const merged = mergeTemplateDefaults(
      { accent: "#123456" },
      ["hero", "rsvp", "footer"],
      {
        couple_name_1: "Ana",
        couple_name_2: "Mihai",
        wedding_date: "2026-09-12",
        venue_name: "Casa",
        city: "Iași",
      },
    );
    expect(merged.content.coupleName1).toBe("Ana");
    expect(merged.content.coupleName2).toBe("Mihai");
    expect(merged.theme.accent).toBe("#123456");
    expect(merged.content.enabledSections).toEqual(["hero", "rsvp", "footer"]);
  });
});

describe("sanitizeContent", () => {
  it("sanitizes string fields", () => {
    const content = defaultContent({ introText: "<b>Salut</b>" });
    expect(sanitizeContent(content).introText).toBe("Salut");
  });
});
