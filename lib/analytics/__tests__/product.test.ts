import { describe, expect, it } from "vitest";

import { sanitizeEventProperties } from "@/lib/analytics/product";

describe("sanitizeEventProperties", () => {
  it("strips PII keys and emails", () => {
    expect(
      sanitizeEventProperties({
        email: "a@b.com",
        guest_count: 12,
        note: "x",
        first_name: "Ana",
        source: "csv",
      }),
    ).toEqual({ guest_count: 12, source: "csv" });
  });
});
