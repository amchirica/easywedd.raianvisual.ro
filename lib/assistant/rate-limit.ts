/**
 * Simple in-memory rate limit for assistant asks (per user).
 * Suitable for single-instance / edge-friendly soft limits in v1.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export const ASSISTANT_RATE_LIMIT = {
  maxMessages: 40,
  windowMs: 60 * 60 * 1000, // 1 hour
  maxInputChars: 500,
  maxAnswerChars: 1200,
  debounceMs: 600,
} as const;

export function checkAssistantRateLimit(userId: string): {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
} {
  const now = Date.now();
  const existing = buckets.get(userId);

  if (!existing || existing.resetAt <= now) {
    buckets.set(userId, {
      count: 0,
      resetAt: now + ASSISTANT_RATE_LIMIT.windowMs,
    });
  }

  const bucket = buckets.get(userId)!;
  if (bucket.count >= ASSISTANT_RATE_LIMIT.maxMessages) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return {
    ok: true,
    remaining: Math.max(0, ASSISTANT_RATE_LIMIT.maxMessages - bucket.count),
    retryAfterSec: 0,
  };
}

export function resetAssistantRateLimitForTests() {
  buckets.clear();
}
