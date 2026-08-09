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
    message: err?.message ?? String(error),
    details: err?.details ?? null,
    hint: err?.hint ?? null,
    name: err?.name ?? null,
  };

  console.error("[admin-error]", JSON.stringify(payload));
}
