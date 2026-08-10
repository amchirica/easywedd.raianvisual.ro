import "server-only";

/**
 * Structured admin/server logs — never include secrets or tokens.
 */
export function logAdminError(
  context: {
    route?: string;
    action?: string;
    operation: string;
  },
  error: unknown,
) {
  const err = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
    name?: string;
  } | null;

  const payload = {
    scope: "admin",
    ...context,
    code: err?.code ?? null,
    message: sanitizeAdminLogText(err?.message ?? String(error)),
    details: err?.details ? sanitizeAdminLogText(err.details) : null,
    hint: err?.hint ? sanitizeAdminLogText(err.hint) : null,
    name: err?.name ?? null,
  };

  console.error("[admin-error]", JSON.stringify(payload));
}

export function logAdminInfo(
  context: {
    route?: string;
    operation: string;
  },
  data: Record<string, unknown> = {},
) {
  console.info(
    "[admin-info]",
    JSON.stringify({
      scope: "admin",
      ...context,
      ...data,
    }),
  );
}

/** Strip JWT-like / key-like substrings from log text. */
export function sanitizeAdminLogText(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[jwt]")
    .replace(/\b(sb_secret_|sb_publishable_|re_|sk_|rk_)[A-Za-z0-9_-]{8,}\b/g, "[key]")
    .slice(0, 500);
}
