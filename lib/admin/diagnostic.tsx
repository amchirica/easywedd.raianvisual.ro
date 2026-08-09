import "server-only";

import {
  getRuntimeEnvSourceFlags,
  getSupabaseEnvPresence,
} from "@/lib/runtime-env";
import { logAdminError } from "@/lib/admin/log";

/**
 * Next.js production redacts thrown Error.message in error.tsx.
 * Return this UI from RSC instead of throwing when possible.
 */
export function AdminDiagnosticPanel({
  route,
  title,
  message,
  code,
}: {
  route: string;
  title?: string;
  message: string;
  code?: string | null;
}) {
  const flags = getRuntimeEnvSourceFlags();
  const presence = getSupabaseEnvPresence();

  return (
    <div className="space-y-4 border border-border bg-card p-6">
      <h1 className="font-heading text-2xl">
        {title ?? "Pagina admin nu s-a putut încărca"}
      </h1>
      <p className="text-sm text-muted-foreground">
        Diagnostic controlat (fără secrete). Rută:{" "}
        <span className="font-mono text-xs">{route}</span>
        {code ? (
          <>
            {" "}
            · cod: <span className="font-mono text-xs">{code}</span>
          </>
        ) : null}
      </p>
      <pre className="overflow-x-auto rounded border border-border bg-background p-3 font-mono text-xs whitespace-pre-wrap">
        {message}
      </pre>
      <pre className="overflow-x-auto rounded border border-border bg-background p-3 font-mono text-xs whitespace-pre-wrap">
        {JSON.stringify(
          {
            als: flags.hasAlsContext,
            NEXT_PUBLIC_SUPABASE_URL: presence.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: presence.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            SUPABASE_SERVICE_ROLE_KEY: presence.SUPABASE_SERVICE_ROLE_KEY,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}

export function captureAdminLoadError(
  route: string,
  operation: string,
  error: unknown,
): {
  message: string;
  code: string | null;
} {
  logAdminError({ route, operation }, error);
  const err = error as { message?: string; code?: string } | null;
  return {
    message:
      err?.message?.trim() ||
      (typeof error === "string" ? error : "Eroare necunoscută pe server."),
    code: err?.code ?? null,
  };
}
