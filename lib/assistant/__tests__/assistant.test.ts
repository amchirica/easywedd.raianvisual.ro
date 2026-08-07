import { describe, expect, it, beforeEach } from "vitest";

import { answerAssistantQuestion } from "@/lib/assistant/answer";
import {
  isAllowedAssistantRoute,
  normalizeAssistantPathname,
  resolveAssistantRoute,
} from "@/lib/assistant/navigation";
import {
  getAssistantAiProvider,
  resetAssistantAiProviderCache,
} from "@/lib/assistant/provider";
import {
  checkAssistantRateLimit,
  resetAssistantRateLimitForTests,
  ASSISTANT_RATE_LIMIT,
} from "@/lib/assistant/rate-limit";
import {
  findKnowledgeForPathname,
  isCurrentPageQuestion,
  searchKnowledge,
} from "@/lib/assistant/search";

describe("assistant navigation allowlist", () => {
  it("allows known dashboard hubs", () => {
    expect(isAllowedAssistantRoute("/dashboard/guests")).toBe(true);
    expect(isAllowedAssistantRoute("/dashboard/budget")).toBe(true);
  });

  it("rejects arbitrary routes", () => {
    expect(isAllowedAssistantRoute("/admin")).toBe(false);
    expect(isAllowedAssistantRoute("https://evil.example")).toBe(false);
    expect(resolveAssistantRoute("/login")).toBe(null);
    expect(isAllowedAssistantRoute("/dashboard/guests/hack")).toBe(false);
  });

  it("normalizes nested invitation paths to hub", () => {
    expect(normalizeAssistantPathname("/dashboard/invitations/abc/edit")).toBe(
      "/dashboard/invitations",
    );
  });
});

describe("assistant knowledge search", () => {
  it("finds guests in RO", () => {
    const hits = searchKnowledge("Cum adaug un invitat?", "ro");
    expect(hits[0]?.entry.key).toBe("guests");
  });

  it("finds budget in EN", () => {
    const hits = searchKnowledge("Where do I see the budget?", "en");
    expect(hits[0]?.entry.key).toBe("budget");
  });

  it("maps current pathname to knowledge", () => {
    expect(findKnowledgeForPathname("/dashboard/budget")?.key).toBe("budget");
  });

  it("detects current-page questions", () => {
    expect(isCurrentPageQuestion("Ce fac aici?", "ro")).toBe(true);
    expect(isCurrentPageQuestion("What can I do here?", "en")).toBe(true);
  });
});

describe("assistant answers", () => {
  beforeEach(() => {
    resetAssistantAiProviderCache();
  });

  it("answers about the current page", async () => {
    const result = await answerAssistantQuestion({
      message: "Ce fac aici?",
      entitlements: [{ feature_key: "budget", enabled: true }],
      context: {
        pathname: "/dashboard/budget",
        locale: "ro",
        role: "owner",
        enabledFeatures: ["budget"],
      },
    });

    expect(result.matchedKey).toBe("budget");
    expect(result.source).toBe("knowledge");
    expect(result.answer.toLowerCase()).toContain("buget");
    expect(result.links[0]?.href).toBe("/dashboard/budget");
  });

  it("marks feature unavailable when entitlement disabled", async () => {
    const result = await answerAssistantQuestion({
      message: "Cum fac seating plan-ul?",
      entitlements: [{ feature_key: "seating", enabled: false }],
      context: {
        pathname: "/dashboard",
        locale: "ro",
        role: "owner",
        enabledFeatures: [],
      },
    });

    expect(result.matchedKey).toBe("seating");
    expect(result.featureUnavailable).toBe(true);
    expect(result.answer).toMatch(/nu este activă/i);
  });

  it("falls back without inventing unknown features", async () => {
    const result = await answerAssistantQuestion({
      message: "Cum integrez blockchain NFT pentru daruri virtuale?",
      entitlements: [],
      context: {
        pathname: "/dashboard",
        locale: "ro",
        role: "owner",
        enabledFeatures: [],
      },
    });

    expect(result.answered).toBe(false);
    expect(result.source).toBe("fallback");
    expect(result.answer).toMatch(/nu este disponibilă/i);
  });

  it("answers in English", async () => {
    const result = await answerAssistantQuestion({
      message: "How do I add vendors?",
      entitlements: [{ feature_key: "vendors", enabled: true }],
      context: {
        pathname: "/dashboard",
        locale: "en",
        role: "partner",
        enabledFeatures: ["vendors"],
      },
    });

    expect(result.matchedKey).toBe("vendors");
    expect(result.answer.toLowerCase()).toContain("vendor");
    expect(result.links[0]?.label.toLowerCase()).toContain("open");
  });

  it("works when AI provider is not configured", async () => {
    delete process.env.OPENAI_API_KEY;
    resetAssistantAiProviderCache();
    expect(getAssistantAiProvider().isConfigured()).toBe(false);

    const result = await answerAssistantQuestion({
      message: "Cum setez un task?",
      entitlements: [{ feature_key: "planner", enabled: true }],
      context: {
        pathname: "/dashboard/planner",
        locale: "ro",
        role: "owner",
        enabledFeatures: ["planner"],
      },
    });

    expect(result.source).toBe("knowledge");
    expect(result.answered).toBe(true);
  });
});

describe("assistant rate limit", () => {
  beforeEach(() => {
    resetAssistantRateLimitForTests();
  });

  it("allows then blocks after max", () => {
    const userId = "test-user";
    for (let i = 0; i < ASSISTANT_RATE_LIMIT.maxMessages; i += 1) {
      expect(checkAssistantRateLimit(userId).ok).toBe(true);
    }
    expect(checkAssistantRateLimit(userId).ok).toBe(false);
  });
});
