/**
 * AI provider abstraction — swap implementations without touching UI.
 * API keys stay server-side via env.
 */

import "server-only";

export type AssistantCompletionRequest = {
  system: string;
  user: string;
  maxTokens?: number;
  timeoutMs?: number;
};

export type AssistantCompletionResult = {
  text: string;
  provider: string;
};

export interface AssistantAiProvider {
  readonly id: string;
  isConfigured(): boolean;
  complete(
    request: AssistantCompletionRequest,
  ): Promise<AssistantCompletionResult | null>;
}

class NoopProvider implements AssistantAiProvider {
  readonly id = "noop";
  isConfigured() {
    return false;
  }
  async complete() {
    return null;
  }
}

/** OpenAI-compatible Chat Completions (OpenAI, compatible gateways). */
class OpenAiCompatibleProvider implements AssistantAiProvider {
  readonly id = "openai-compatible";

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY?.trim());
  }

  async complete(
    request: AssistantCompletionRequest,
  ): Promise<AssistantCompletionResult | null> {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return null;

    const base =
      process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ||
      "https://api.openai.com/v1";
    const model = process.env.OPENAI_ASSISTANT_MODEL || "gpt-4o-mini";
    const timeoutMs = request.timeoutMs ?? 12_000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: request.maxTokens ?? 400,
          messages: [
            { role: "system", content: request.system },
            { role: "user", content: request.user },
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        console.info("[assistant:ai]", res.status, await res.text().catch(() => ""));
        return null;
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) return null;
      return { text, provider: this.id };
    } catch (error) {
      console.info("[assistant:ai:error]", error);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

let cached: AssistantAiProvider | null = null;

export function getAssistantAiProvider(): AssistantAiProvider {
  if (cached) return cached;
  const openai = new OpenAiCompatibleProvider();
  cached = openai.isConfigured() ? openai : new NoopProvider();
  return cached;
}

/** Test helper */
export function resetAssistantAiProviderCache() {
  cached = null;
}
