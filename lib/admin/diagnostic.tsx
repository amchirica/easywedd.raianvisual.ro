import "server-only";

import {
  getRuntimeEnvSourceFlags,
  getSupabaseEnvPresence,
  runtimeEnvPresent,
} from "@/lib/runtime-env";
import { logAdminError } from "@/lib/admin/log";

export type AdminProductionProbe = {
  supabaseUrlPresent: boolean;
  anonKeyPresent: boolean;
  serviceRolePresent: boolean;
  userPresent: boolean;
  platformAdmin: boolean;
  platformAdminRpcOk: boolean;
  platformAdminRpcCode: string | null;
  runtime: string;
  envSource: string;
};

/** Safe production probe — never includes secret values. */
export function buildAdminProductionProbe(options?: {
  userPresent?: boolean;
  platformAdmin?: boolean;
  platformAdminRpcOk?: boolean;
  platformAdminRpcCode?: string | null;
}): AdminProductionProbe {
  const flags = getRuntimeEnvSourceFlags();
  const presence = getSupabaseEnvPresence();
  const envSource = flags.hasAlsContext
    ? "cloudflare-als+process.env"
    : "process.env";

  return {
    supabaseUrlPresent: presence.NEXT_PUBLIC_SUPABASE_URL,
    anonKeyPresent: presence.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRolePresent: presence.SUPABASE_SERVICE_ROLE_KEY,
    userPresent: Boolean(options?.userPresent),
    platformAdmin: Boolean(options?.platformAdmin),
    platformAdminRpcOk: options?.platformAdminRpcOk ?? true,
    platformAdminRpcCode: options?.platformAdminRpcCode ?? null,
    runtime: process.env.NEXT_RUNTIME ?? process.env.NODE_ENV ?? "unknown",
    envSource,
  };
}

/**
 * Next.js production redacts thrown Error.message in error.tsx.
 * Return this UI from RSC instead of throwing when possible.
 */
export function AdminDiagnosticPanel({
  route,
  title,
  message,
  code,
  probe,
}: {
  route: string;
  title?: string;
  message: string;
  code?: string | null;
  probe?: AdminProductionProbe;
}) {
  const resolved =
    probe ??
    buildAdminProductionProbe({
      userPresent: runtimeEnvPresent("NEXT_PUBLIC_SUPABASE_URL"),
    });

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
        {JSON.stringify(resolved, null, 2)}
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
