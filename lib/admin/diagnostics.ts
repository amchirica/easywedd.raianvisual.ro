import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildAdminProductionProbe } from "@/lib/admin/diagnostic";
import { maskEmail, maskId } from "@/lib/admin/diagnostics-mask";
import {
  type DiagnosticCheck,
  type DiagnosticReport,
  type DiagnosticSection,
  type DiagnosticStatus,
  sectionStatus,
} from "@/lib/admin/diagnostics-types";
import { sanitizeAdminLogText } from "@/lib/admin/log";
import { getPublicSiteUrlFromEnv } from "@/lib/env";
import {
  getRuntimeEnv,
  getRuntimeEnvSourceFlags,
  hydrateRuntimeEnvAsync,
  runtimeEnvPresent,
} from "@/lib/runtime-env";
import { getStripe } from "@/lib/stripe";
import { createAdminClientAsync } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type {
  DiagnosticCheck,
  DiagnosticOverall,
  DiagnosticReport,
  DiagnosticSection,
  DiagnosticStatus,
} from "@/lib/admin/diagnostics-types";

const EXTERNAL_TIMEOUT_MS = 4000;
const WORKER_NAME = "easywedd-raianvisual";
const COMPATIBILITY_DATE = "2026-07-30";

const ENV_GROUPS = {
  public: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  ],
  server: ["SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY", "OPENAI_BASE_URL"],
  billing: [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_STARTER_MONTHLY",
    "STRIPE_PRICE_PRO_MONTHLY",
    "STRIPE_PRICE_PREMIUM_PASS_12",
    "STRIPE_PRICE_PREMIUM_PASS_18",
    "STRIPE_PRODUCT_STARTER_MONTHLY",
    "STRIPE_PRODUCT_PRO_MONTHLY",
    "STRIPE_PRODUCT_PREMIUM_PASS_12",
    "STRIPE_PRODUCT_PREMIUM_PASS_18",
  ],
  email: ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_FROM_NAME"],
  cron: ["CRON_SECRET"],
} as const;

const COUNT_TABLES: Array<{ key: string; table: string }> = [
  { key: "profiles", table: "profiles" },
  { key: "workspaces", table: "workspaces" },
  { key: "workspace_members", table: "workspace_members" },
  { key: "subscriptions", table: "subscriptions" },
  { key: "contracts", table: "contracts" },
  { key: "weddings", table: "weddings" },
  { key: "invitation_projects", table: "invitation_projects" },
  { key: "guests", table: "guests" },
  { key: "one_time_payments", table: "one_time_payments" },
  { key: "payments", table: "payments" },
  { key: "invitation_templates", table: "invitation_templates" },
  { key: "wedding_site_templates", table: "wedding_site_templates" },
  { key: "audit_logs", table: "audit_logs" },
  { key: "email_outbox", table: "email_outbox" },
  { key: "invitation_deliveries", table: "invitation_deliveries" },
  { key: "stripe_events", table: "stripe_events" },
];

const CRITICAL_TABLES = [
  "profiles",
  "workspaces",
  "workspace_members",
  "subscriptions",
  "weddings",
  "audit_logs",
] as const;

const CRITICAL_COLUMNS: Array<{ table: string; column: string }> = [
  { table: "subscriptions", column: "stripe_customer_id" },
  { table: "subscriptions", column: "stripe_subscription_id" },
  { table: "profiles", column: "onboarding_completed" },
  { table: "workspaces", column: "workspace_type" },
];

type RpcProbe =
  | { name: string; mode: "call"; args?: Record<string, unknown> }
  | { name: string; mode: "metadata_only"; reason: string };

const RPC_PROBES: RpcProbe[] = [
  { name: "is_platform_admin", mode: "call" },
  {
    name: "ensure_own_profile",
    mode: "metadata_only",
    reason: "Upsert RPC — not executed for diagnostics (typed in schema)",
  },
  {
    name: "is_workspace_member",
    mode: "call",
    args: { p_workspace_id: "00000000-0000-4000-8000-000000000000" },
  },
  {
    name: "has_workspace_role",
    mode: "call",
    args: {
      p_workspace_id: "00000000-0000-4000-8000-000000000000",
      p_roles: ["admin" as const],
    },
  },
  {
    name: "create_onboarding_workspace",
    mode: "metadata_only",
    reason: "Write RPC — not executed for diagnostics",
  },
  {
    name: "sync_workspace_entitlements",
    mode: "metadata_only",
    reason: "Write RPC — not executed for diagnostics",
  },
  {
    name: "claim_email_outbox",
    mode: "metadata_only",
    reason: "Mutating outbox claim — not executed for diagnostics",
  },
  {
    name: "workspace_analytics_summary",
    mode: "metadata_only",
    reason: "Not defined in app Database types / PostgREST schema",
  },
];

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms (${label})`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function presenceCheck(
  id: string,
  label: string,
  present: boolean,
  critical = false,
): DiagnosticCheck {
  return {
    id,
    label,
    present,
    status: present ? "healthy" : critical ? "error" : "warning",
    value: present,
    message: present ? "present" : "missing",
  };
}

function settledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

function readPackageVersions(): {
  next: string;
  opennext: string;
  supabaseJs: string;
  wrangler: string;
  app: string;
} {
  try {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    ) as {
      version?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return {
      app: pkg.version ?? "unknown",
      next: pkg.dependencies?.next ?? "unknown",
      opennext: pkg.dependencies?.["@opennextjs/cloudflare"] ?? "unknown",
      supabaseJs: pkg.dependencies?.["@supabase/supabase-js"] ?? "unknown",
      wrangler: pkg.devDependencies?.wrangler ?? "unknown",
    };
  } catch {
    return {
      app: "unknown",
      next: "unknown",
      opennext: "unknown",
      supabaseJs: "unknown",
      wrangler: "unknown",
    };
  }
}

function readCfContextEnv(): Record<string, unknown> | null {
  try {
    const ctx = (
      globalThis as Record<symbol, { env?: Record<string, unknown> } | undefined>
    )[Symbol.for("__cloudflare-context__")];
    return ctx?.env ?? null;
  } catch {
    return null;
  }
}

async function headOrGet(
  url: string,
  expected: number[],
): Promise<DiagnosticCheck> {
  const started = Date.now();
  try {
    const res = await withTimeout(
      fetch(url, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        headers: { Accept: "text/html,*/*" },
      }),
      EXTERNAL_TIMEOUT_MS,
      url,
    );
    const latencyMs = Date.now() - started;
    const status = res.status;
    const healthy = expected.includes(status);
    return {
      id: `route:${new URL(url).pathname || "/"}`,
      label: new URL(url).pathname || "/",
      status: healthy ? "healthy" : status >= 500 ? "error" : "warning",
      value: status,
      latencyMs,
      message: `HTTP ${status}; expected ${expected.join("|")}`,
    };
  } catch (err) {
    return {
      id: `route:${url}`,
      label: url,
      status: "error",
      latencyMs: Date.now() - started,
      message: sanitizeAdminLogText(
        err instanceof Error ? err.message : "fetch failed",
      ),
    };
  }
}

async function pingUrl(
  id: string,
  label: string,
  url: string,
): Promise<DiagnosticCheck> {
  const started = Date.now();
  try {
    const res = await withTimeout(
      fetch(url, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
      }),
      EXTERNAL_TIMEOUT_MS,
      label,
    );
    return {
      id,
      label,
      status: res.status < 500 ? "healthy" : "error",
      value: res.status,
      latencyMs: Date.now() - started,
      message: `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      id,
      label,
      status: "error",
      latencyMs: Date.now() - started,
      message: sanitizeAdminLogText(
        err instanceof Error ? err.message : "unreachable",
      ),
    };
  }
}

async function countTable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  table: string,
): Promise<DiagnosticCheck> {
  try {
    const { count, error } = await admin
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) {
      const missing =
        error.code === "42P01" ||
        /does not exist|Could not find the table/i.test(error.message ?? "");
      return {
        id: `table:${table}`,
        label: table,
        status: missing ? "warning" : "error",
        value: missing ? "missing" : null,
        code: error.code ?? null,
        message: sanitizeAdminLogText(error.message ?? "query failed"),
      };
    }
    return {
      id: `table:${table}`,
      label: table,
      status: "healthy",
      value: count ?? 0,
      message: "ok",
    };
  } catch (err) {
    return {
      id: `table:${table}`,
      label: table,
      status: "error",
      message: sanitizeAdminLogText(
        err instanceof Error ? err.message : "count failed",
      ),
    };
  }
}

async function probeRpc(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  probe: RpcProbe,
): Promise<DiagnosticCheck> {
  if (probe.mode === "metadata_only") {
    const knownInTypes = [
      "is_platform_admin",
      "ensure_own_profile",
      "is_workspace_member",
      "create_onboarding_workspace",
      "sync_workspace_entitlements",
      "claim_email_outbox",
      "mark_email_outbox",
      "accept_workspace_invitation",
      "get_pending_invite",
    ].includes(probe.name);
    return {
      id: `rpc:${probe.name}`,
      label: probe.name,
      status: knownInTypes ? "warning" : "unknown",
      value: knownInTypes ? "typed_not_called" : "not_in_app_types",
      message: probe.reason,
    };
  }

  try {
    const { data, error } = await client.rpc(probe.name, probe.args ?? {});
    if (error) {
      const missing =
        error.code === "PGRST202" ||
        error.code === "42883" ||
        /Could not find the function|does not exist/i.test(error.message ?? "");
      // Arg/validation errors mean the function exists.
      const exists =
        !missing &&
        (error.code === "22P02" ||
          error.code === "PGRST102" ||
          /invalid input|required/i.test(error.message ?? "") ||
          true);
      if (missing) {
        return {
          id: `rpc:${probe.name}`,
          label: probe.name,
          status: "error",
          value: "missing",
          code: error.code ?? null,
          message: sanitizeAdminLogText(error.message ?? "missing"),
        };
      }
      return {
        id: `rpc:${probe.name}`,
        label: probe.name,
        status: probe.name === "is_platform_admin" ? "error" : "healthy",
        value: exists ? "available" : "unknown",
        code: error.code ?? null,
        message: sanitizeAdminLogText(error.message ?? "rpc error"),
      };
    }
    return {
      id: `rpc:${probe.name}`,
      label: probe.name,
      status: "healthy",
      value:
        typeof data === "boolean" || typeof data === "number"
          ? data
          : "ok",
      message: "callable",
    };
  } catch (err) {
    return {
      id: `rpc:${probe.name}`,
      label: probe.name,
      status: "error",
      message: sanitizeAdminLogText(
        err instanceof Error ? err.message : "rpc failed",
      ),
    };
  }
}

export type BuildDiagnosticsOptions = {
  headersList: Headers;
  origin: string;
  user: User;
  platformAdmin: boolean;
};

export async function buildDiagnosticReport(
  options: BuildDiagnosticsOptions,
): Promise<DiagnosticReport> {
  await hydrateRuntimeEnvAsync();
  const generatedAt = new Date().toISOString();
  const versions = readPackageVersions();
  const flags = getRuntimeEnvSourceFlags();
  const cfEnv = readCfContextEnv();
  const unimplemented: DiagnosticReport["unimplemented"] = [];
  const h = options.headersList;

  const hostname =
    h.get("x-forwarded-host") ?? h.get("host") ?? "unknown";
  const appUrl =
    getPublicSiteUrlFromEnv() ??
    getRuntimeEnv("NEXT_PUBLIC_APP_URL") ??
    options.origin;
  const gitSha =
    getRuntimeEnv("CF_PAGES_COMMIT_SHA") ||
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    null;
  const cfRay = h.get("cf-ray");
  const cfColo = h.get("cf-ipcountry") ? null : null;
  const colo =
    h.get("cf-ray")?.split("-").pop() ??
    h.get("x-vercel-id")?.split("::")[0] ??
    null;
  const country = h.get("cf-ipcountry");
  const proto = h.get("x-forwarded-proto") ?? "unknown";

  // --- Env presence ---
  const envChecks: DiagnosticCheck[] = [];
  for (const [group, keys] of Object.entries(ENV_GROUPS)) {
    for (const key of keys) {
      const present =
        key.startsWith("NEXT_PUBLIC_") || key.startsWith("STRIPE_") || key === "SUPABASE_SERVICE_ROLE_KEY"
          ? runtimeEnvPresent(key) || Boolean(process.env[key]?.trim())
          : Boolean(process.env[key]?.trim()) || runtimeEnvPresent(key);
      const critical =
        key === "NEXT_PUBLIC_SUPABASE_URL" ||
        key === "NEXT_PUBLIC_SUPABASE_ANON_KEY" ||
        key === "SUPABASE_SERVICE_ROLE_KEY";
      const check = presenceCheck(`env:${key}`, `${group}/${key}`, present, critical);
      // CRON_SECRET / OPENAI are optional → warning only if we marked critical=false
      if (key === "CRON_SECRET" && !present) {
        check.status = "unknown";
        check.message = "not used by app (no cron routes)";
        unimplemented.push({
          check: "CRON_SECRET",
          reason: "No CRON_SECRET usage or cron routes in codebase",
        });
      }
      if (key.startsWith("OPENAI_") && !present) {
        check.status = "unknown";
        check.message = "optional assistant feature";
      }
      envChecks.push(check);
    }
  }

  const envSection: DiagnosticSection = {
    id: "env",
    title: "Environment variable presence",
    status: sectionStatus(envChecks),
    checks: envChecks,
  };

  // --- Runtime ---
  const runtimeChecks: DiagnosticCheck[] = [
    {
      id: "runtime",
      label: "runtime",
      status: "healthy",
      value: process.env.NEXT_RUNTIME ?? "nodejs",
    },
    {
      id: "envSource",
      label: "envSource",
      status: flags.hasAlsContext ? "healthy" : "warning",
      value: flags.hasAlsContext
        ? "cloudflare-als+process.env"
        : "process.env",
    },
    {
      id: "NODE_ENV",
      label: "NODE_ENV",
      status: "healthy",
      value: process.env.NODE_ENV ?? "unknown",
    },
    {
      id: "cloudflareMode",
      label: "Cloudflare mode",
      status: flags.hasAlsContext || Boolean(cfEnv) ? "healthy" : "warning",
      value: flags.hasAlsContext || Boolean(cfEnv) ? "worker" : "node-local",
    },
    {
      id: "workerName",
      label: "Worker name",
      status: "healthy",
      value: WORKER_NAME,
    },
    {
      id: "compatDate",
      label: "compatibility date",
      status: "healthy",
      value: COMPATIBILITY_DATE,
      message: "from wrangler.jsonc (build-time constant)",
    },
    {
      id: "deploymentId",
      label: "deployment/version id",
      status: process.env.CF_VERSION_METADATA || process.env.CF_PAGES_COMMIT_SHA
        ? "healthy"
        : "unknown",
      value:
        process.env.CF_VERSION_METADATA ||
        process.env.CF_PAGES_COMMIT_SHA ||
        gitSha ||
        "unavailable",
    },
    {
      id: "region",
      label: "region/colo",
      status: colo ? "healthy" : "unknown",
      value: colo ?? "unavailable",
    },
    {
      id: "timestamp",
      label: "request timestamp UTC",
      status: "healthy",
      value: generatedAt,
    },
    {
      id: "hostname",
      label: "hostname",
      status: "healthy",
      value: hostname,
    },
    {
      id: "appUrl",
      label: "app URL",
      status: appUrl ? "healthy" : "warning",
      value: appUrl ?? "missing",
    },
    {
      id: "gitSha",
      label: "git commit SHA",
      status: gitSha ? "healthy" : "unknown",
      value: gitSha ? maskId(gitSha) : "unavailable",
    },
    {
      id: "nextVersion",
      label: "Next.js version",
      status: "healthy",
      value: versions.next,
    },
    {
      id: "opennextVersion",
      label: "@opennextjs/cloudflare version",
      status: "healthy",
      value: versions.opennext,
    },
    {
      id: "wranglerVersion",
      label: "wrangler version",
      status: "healthy",
      value: versions.wrangler,
      message: "from package.json (build-time)",
    },
    {
      id: "supabaseJsVersion",
      label: "@supabase/supabase-js version",
      status: "healthy",
      value: versions.supabaseJs,
    },
  ];

  const runtimeSection: DiagnosticSection = {
    id: "runtime",
    title: "Runtime / Environment",
    status: sectionStatus(runtimeChecks),
    checks: runtimeChecks,
  };

  // Parallel core clients + connectivity
  const supabaseUser = await createClient();
  const [
    adminResult,
    authUserResult,
    platformAdminResult,
    profileResult,
    membershipResult,
  ] = await Promise.allSettled([
    createAdminClientAsync(),
    supabaseUser.auth.getUser(),
    supabaseUser.rpc("is_platform_admin"),
    supabaseUser
      .from("profiles")
      .select("id, onboarding_completed, account_status, created_at, updated_at")
      .eq("id", options.user.id)
      .maybeSingle(),
    supabaseUser
      .from("workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", options.user.id)
      .eq("invitation_status", "accepted"),
  ]);

  const admin =
    adminResult.status === "fulfilled" ? adminResult.value : null;
  const authBundle = settledValue(authUserResult);
  const user = authBundle?.data?.user ?? options.user;
  const adminRpc = settledValue(platformAdminResult);
  const profileBundle = settledValue(profileResult);
  const membershipBundle = settledValue(membershipResult);

  const dbLatencyStart = Date.now();
  let dbLatencyMs: number | null = null;
  let dbTimestamp: string | null = null;
  let serviceRoleQueryOk = false;
  let serviceRoleInitOk = Boolean(admin);
  let serviceRoleInitError: string | null =
    adminResult.status === "rejected"
      ? sanitizeAdminLogText(
          adminResult.reason instanceof Error
            ? adminResult.reason.message
            : "admin client failed",
        )
      : null;

  if (admin) {
    try {
      const { data, error } = await admin
        .from("profiles")
        .select("id")
        .limit(1);
      dbLatencyMs = Date.now() - dbLatencyStart;
      serviceRoleQueryOk = !error;
      if (error) {
        serviceRoleInitError = sanitizeAdminLogText(error.message);
      } else {
        dbTimestamp = generatedAt;
        void data;
      }
    } catch (err) {
      dbLatencyMs = Date.now() - dbLatencyStart;
      serviceRoleInitError = sanitizeAdminLogText(
        err instanceof Error ? err.message : "service role query failed",
      );
    }
  }

  const supabaseUrl = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseReachable = supabaseUrl
    ? await pingUrl(
        "supabase-endpoint",
        "Supabase endpoint",
        `${supabaseUrl.replace(/\/$/, "")}/auth/v1/health`,
      )
    : ({
        id: "supabase-endpoint",
        label: "Supabase endpoint",
        status: "error" as const,
        message: "NEXT_PUBLIC_SUPABASE_URL missing",
      } satisfies DiagnosticCheck);

  const supabaseChecks: DiagnosticCheck[] = [
    {
      id: "supabase-reachable",
      label: "Supabase reachable",
      status: supabaseReachable.status,
      latencyMs: supabaseReachable.latencyMs,
      message: supabaseReachable.message,
      value: supabaseReachable.value,
    },
    {
      id: "auth-user-query",
      label: "auth user query works",
      status: authBundle?.data?.user ? "healthy" : "error",
      value: Boolean(authBundle?.data?.user),
    },
    {
      id: "current-user",
      label: "current user exists",
      status: user ? "healthy" : "error",
      value: Boolean(user),
    },
    {
      id: "is-platform-admin-rpc",
      label: "is_platform_admin RPC works",
      status: adminRpc?.error
        ? "error"
        : typeof adminRpc?.data === "boolean"
          ? "healthy"
          : "warning",
      code: adminRpc?.error?.code ?? null,
      message: adminRpc?.error
        ? sanitizeAdminLogText(adminRpc.error.message)
        : `result=${String(adminRpc?.data)}`,
      value: adminRpc?.error ? false : Boolean(adminRpc?.data),
    },
    {
      id: "service-role-init",
      label: "service role client can initialize",
      status: serviceRoleInitOk ? "healthy" : "error",
      value: serviceRoleInitOk,
      message: serviceRoleInitError,
    },
    {
      id: "service-role-query",
      label: "service role query works",
      status: serviceRoleQueryOk ? "healthy" : "error",
      value: serviceRoleQueryOk,
      latencyMs: dbLatencyMs,
      message: serviceRoleInitError,
    },
    {
      id: "db-latency",
      label: "database latency ms",
      status:
        dbLatencyMs == null
          ? "unknown"
          : dbLatencyMs > 2000
            ? "warning"
            : "healthy",
      value: dbLatencyMs,
    },
    {
      id: "db-timestamp",
      label: "current DB timestamp",
      status: dbTimestamp ? "healthy" : "unknown",
      value: dbTimestamp,
      message: "request UTC (no DB now() RPC available)",
    },
    {
      id: "user-id-masked",
      label: "authenticated user id (masked)",
      status: "healthy",
      value: maskId(user?.id),
    },
    {
      id: "email-masked",
      label: "email (masked)",
      status: "healthy",
      value: maskEmail(user?.email),
    },
  ];

  const supabaseSection: DiagnosticSection = {
    id: "supabase",
    title: "Supabase connectivity",
    status: sectionStatus(supabaseChecks),
    checks: supabaseChecks,
  };

  // --- DB counts ---
  const countChecks: DiagnosticCheck[] = admin
    ? await Promise.all(
        COUNT_TABLES.map((t) => countTable(admin, t.table)),
      )
    : COUNT_TABLES.map((t) => ({
        id: `table:${t.table}`,
        label: t.table,
        status: "error" as const,
        message: "service role unavailable",
      }));

  // cron/jobs table does not exist
  countChecks.push({
    id: "table:cron_jobs",
    label: "cron/jobs",
    status: "unknown",
    value: "missing",
    message: "No cron/jobs table in schema",
  });
  unimplemented.push({
    check: "cron/jobs counts",
    reason: "No cron job table or scheduler in this codebase",
  });

  const dbSection: DiagnosticSection = {
    id: "database",
    title: "Database health",
    status: sectionStatus(countChecks),
    checks: countChecks,
  };

  // --- RPC probes ---
  const rpcClient = admin ?? supabaseUser;
  const rpcChecks = await Promise.all(
    RPC_PROBES.map((p) => {
      if (p.name === "is_platform_admin") {
        return probeRpc(supabaseUser, p);
      }
      if (p.mode === "call" && p.name === "has_workspace_role") {
        // Not in generated Database types — attempt via any client
        return probeRpc(rpcClient, p);
      }
      return probeRpc(rpcClient, p);
    }),
  );

  const rpcSection: DiagnosticSection = {
    id: "rpc",
    title: "Critical DB functions / RPC",
    status: sectionStatus(rpcChecks),
    checks: rpcChecks,
  };

  // --- Auth health ---
  const identity = user?.identities?.[0];
  const authChecks: DiagnosticCheck[] = [
    {
      id: "authenticated",
      label: "user authenticated",
      status: user ? "healthy" : "error",
      value: Boolean(user),
    },
    {
      id: "email-confirmed",
      label: "email confirmed",
      status: user?.email_confirmed_at ? "healthy" : "warning",
      value: Boolean(user?.email_confirmed_at),
    },
    {
      id: "last-sign-in",
      label: "last sign-in timestamp",
      status: user?.last_sign_in_at ? "healthy" : "unknown",
      value: user?.last_sign_in_at ?? null,
    },
    {
      id: "auth-provider",
      label: "auth provider",
      status: "healthy",
      value: identity?.provider ?? user?.app_metadata?.provider ?? "email",
    },
    {
      id: "session-detected",
      label: "session detected",
      status: user ? "healthy" : "error",
      value: Boolean(user),
      message: "derived from getUser(); tokens never exposed",
    },
    {
      id: "profile-exists",
      label: "profile exists",
      status: profileBundle?.data ? "healthy" : "warning",
      value: Boolean(profileBundle?.data),
    },
    {
      id: "membership-exists",
      label: "workspace membership exists",
      status: (membershipBundle?.count ?? 0) > 0 ? "healthy" : "warning",
      value: membershipBundle?.count ?? 0,
    },
    {
      id: "platform-admin",
      label: "platform admin",
      status: options.platformAdmin ? "healthy" : "error",
      value: options.platformAdmin,
    },
    {
      id: "onboarding",
      label: "onboarding state",
      status: "healthy",
      value: profileBundle?.data?.onboarding_completed
        ? "completed"
        : profileBundle?.data
          ? "incomplete"
          : "no_profile",
    },
  ];

  const authSection: DiagnosticSection = {
    id: "auth",
    title: "Auth health",
    status: sectionStatus(authChecks),
    checks: authChecks,
  };

  // --- Stripe ---
  const stripeKeyPresent = runtimeEnvPresent("STRIPE_SECRET_KEY");
  const webhookPresent = runtimeEnvPresent("STRIPE_WEBHOOK_SECRET");
  let stripeReachable: DiagnosticCheck = {
    id: "stripe-api",
    label: "Stripe API reachable",
    status: stripeKeyPresent ? "unknown" : "warning",
    message: stripeKeyPresent ? "not checked" : "key missing",
  };
  let livemode: boolean | null = null;
  let accountOk = false;

  if (stripeKeyPresent) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        stripeReachable = {
          id: "stripe-api",
          label: "Stripe API reachable",
          status: "error",
          message: "getStripe() returned null",
        };
      } else {
        const started = Date.now();
        // balance.retrieve is a safe read — no customers/charges created.
        const balance = await withTimeout(
          stripe.balance.retrieve(),
          EXTERNAL_TIMEOUT_MS,
          "stripe.balance.retrieve",
        );
        livemode = Boolean(balance.livemode);
        // Infer mode from key prefix only — never persist or return the key.
        const mode = (() => {
          const key = getRuntimeEnv("STRIPE_SECRET_KEY");
          if (!key) return "unknown";
          if (key.startsWith("sk_live")) return "livemode";
          if (key.startsWith("sk_test")) return "testmode";
          return balance.livemode ? "livemode" : "testmode";
        })();
        accountOk = true;
        stripeReachable = {
          id: "stripe-api",
          label: "Stripe API reachable",
          status: "healthy",
          latencyMs: Date.now() - started,
          value: mode,
          message: `account accessible via balance.retrieve; mode=${mode}`,
        };
        void livemode;
      }
    } catch (err) {
      stripeReachable = {
        id: "stripe-api",
        label: "Stripe API reachable",
        status: "error",
        message: sanitizeAdminLogText(
          err instanceof Error ? err.message : "stripe error",
        ),
      };
    }
  }

  let activeSubs = 0;
  let missingCustomer = 0;
  let missingSubId = 0;
  let lastWebhookAt: string | null = null;

  if (admin) {
    const [activeRes, missCust, missSub, lastWh] = await Promise.allSettled([
      admin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .in("status", ["active", "trialing"]),
      admin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .is("stripe_customer_id", null),
      admin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .is("stripe_subscription_id", null)
        .in("status", ["active", "trialing"]),
      admin
        .from("stripe_events")
        .select("processed_at")
        .order("processed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (activeRes.status === "fulfilled") {
      activeSubs = activeRes.value.count ?? 0;
    }
    if (missCust.status === "fulfilled") {
      missingCustomer = missCust.value.count ?? 0;
    }
    if (missSub.status === "fulfilled") {
      missingSubId = missSub.value.count ?? 0;
    }
    if (lastWh.status === "fulfilled") {
      lastWebhookAt = lastWh.value.data?.processed_at ?? null;
    }
  }

  const stripeChecks: DiagnosticCheck[] = [
    presenceCheck("stripe-key", "STRIPE_SECRET_KEY present", stripeKeyPresent),
    stripeReachable,
    {
      id: "stripe-account",
      label: "account accessible",
      status: !stripeKeyPresent
        ? "warning"
        : accountOk
          ? "healthy"
          : "error",
      value: accountOk,
    },
    {
      id: "stripe-mode",
      label: "livemode/testmode",
      status: stripeReachable.value ? "healthy" : "unknown",
      value: stripeReachable.value ?? null,
    },
    presenceCheck(
      "stripe-webhook-secret",
      "webhook secret present",
      webhookPresent,
    ),
    {
      id: "stripe-active-subs",
      label: "active subscriptions count (DB)",
      status: "healthy",
      value: activeSubs,
    },
    {
      id: "stripe-missing-customer",
      label: "subscriptions missing stripe_customer_id",
      status: missingCustomer > 0 ? "warning" : "healthy",
      value: missingCustomer,
    },
    {
      id: "stripe-missing-sub",
      label: "subscriptions missing stripe_subscription_id",
      status: missingSubId > 0 ? "warning" : "healthy",
      value: missingSubId,
    },
    {
      id: "stripe-last-webhook",
      label: "last webhook processed timestamp",
      status: lastWebhookAt ? "healthy" : "unknown",
      value: lastWebhookAt,
    },
  ];

  const stripeSection: DiagnosticSection = {
    id: "stripe",
    title: "Stripe health",
    status: sectionStatus(stripeChecks),
    checks: stripeChecks,
  };

  // --- Email / Resend ---
  const resendKey = Boolean(process.env.RESEND_API_KEY?.trim());
  const resendFrom = Boolean(process.env.RESEND_FROM_EMAIL?.trim());
  const resendName = Boolean(process.env.RESEND_FROM_NAME?.trim());
  let failedDeliveries = 0;
  let lastEmailAt: string | null = null;
  let recentOutbox: DiagnosticCheck[] = [];

  if (admin) {
    const [failed, lastSent, recent] = await Promise.allSettled([
      admin
        .from("email_outbox")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed"),
      admin
        .from("email_outbox")
        .select("sent_at")
        .eq("status", "sent")
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("email_outbox")
        .select("status, last_error, updated_at, event_type")
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);
    if (failed.status === "fulfilled") failedDeliveries = failed.value.count ?? 0;
    if (lastSent.status === "fulfilled") {
      lastEmailAt = lastSent.value.data?.sent_at ?? null;
    }
    if (recent.status === "fulfilled" && recent.value.data) {
      recentOutbox = recent.value.data.map((row, i) => ({
        id: `outbox-${i}`,
        label: row.event_type ?? "outbox",
        status:
          row.status === "failed"
            ? ("error" as const)
            : row.status === "sent"
              ? ("healthy" as const)
              : ("warning" as const),
        value: row.status,
        message: row.last_error
          ? sanitizeAdminLogText(String(row.last_error))
          : row.updated_at,
      }));
    }
  }

  // Safe Resend API domains list (no send)
  let resendApiCheck: DiagnosticCheck = {
    id: "resend-api",
    label: "Resend API",
    status: resendKey ? "unknown" : "warning",
    message: resendKey
      ? "no safe non-send probe used; key presence only"
      : "RESEND_API_KEY missing",
  };
  unimplemented.push({
    check: "Resend API reachability without send",
    reason:
      "Resend has no guaranteed free health endpoint; presence + outbox used instead",
  });

  const emailChecks: DiagnosticCheck[] = [
    presenceCheck("resend-key", "RESEND_API_KEY present", resendKey),
    presenceCheck("resend-from", "sender/from configured", resendFrom),
    {
      id: "resend-from-name",
      label: "email domain/from name config present",
      status: resendFrom ? "healthy" : "warning",
      value: resendFrom,
      message: resendName
        ? "RESEND_FROM_EMAIL + RESEND_FROM_NAME present"
        : resendFrom
          ? "RESEND_FROM_EMAIL present (name optional)"
          : "missing",
    },
    resendApiCheck,
    {
      id: "failed-deliveries",
      label: "failed deliveries count",
      status: failedDeliveries > 0 ? "warning" : "healthy",
      value: failedDeliveries,
    },
    {
      id: "last-email",
      label: "last successful email timestamp",
      status: lastEmailAt ? "healthy" : "unknown",
      value: lastEmailAt,
    },
    ...recentOutbox,
  ];

  const emailSection: DiagnosticSection = {
    id: "email",
    title: "Resend / Email health",
    status: sectionStatus(emailChecks),
    checks: emailChecks,
  };

  // --- Cloudflare ---
  const assetsAvailable = Boolean(
    cfEnv && Object.prototype.hasOwnProperty.call(cfEnv, "ASSETS"),
  );
  const selfRefAvailable = Boolean(
    cfEnv &&
      Object.prototype.hasOwnProperty.call(cfEnv, "WORKER_SELF_REFERENCE"),
  );
  const cfChecks: DiagnosticCheck[] = [
    {
      id: "cf-worker-active",
      label: "worker/runtime active",
      status: flags.hasAlsContext || Boolean(cfEnv) ? "healthy" : "warning",
      value: flags.hasAlsContext || Boolean(cfEnv),
    },
    {
      id: "cf-assets",
      label: "ASSETS binding available",
      status: assetsAvailable
        ? "healthy"
        : flags.hasAlsContext
          ? "warning"
          : "unknown",
      value: assetsAvailable,
    },
    {
      id: "cf-self-ref",
      label: "WORKER_SELF_REFERENCE available",
      status: selfRefAvailable
        ? "healthy"
        : flags.hasAlsContext
          ? "warning"
          : "unknown",
      value: selfRefAvailable,
    },
    {
      id: "cf-request",
      label: "Cloudflare request detected",
      status: cfRay || country ? "healthy" : "unknown",
      value: Boolean(cfRay || country),
    },
    {
      id: "cf-colo",
      label: "cf colo",
      status: colo ? "healthy" : "unknown",
      value: colo,
    },
    {
      id: "cf-country",
      label: "country",
      status: country ? "healthy" : "unknown",
      value: country,
    },
    {
      id: "cf-proto",
      label: "http protocol",
      status: "healthy",
      value: proto,
    },
    {
      id: "cf-ray",
      label: "request ray id",
      status: cfRay ? "healthy" : "unknown",
      value: cfRay ? `${cfRay.slice(0, 8)}…` : null,
    },
    {
      id: "cf-als",
      label: "cache/runtime context availability",
      status: flags.hasAlsContext ? "healthy" : "warning",
      value: flags.hasAlsContext,
    },
  ];
  void cfColo;

  const cfSection: DiagnosticSection = {
    id: "cloudflare",
    title: "Cloudflare / Worker",
    status: sectionStatus(cfChecks),
    checks: cfChecks,
  };

  // --- Routes ---
  const origin = options.origin.replace(/\/$/, "");
  const routeDefs: Array<{ path: string; expected: number[] }> = [
    { path: "/", expected: [200, 307, 308] },
    { path: "/login", expected: [200] },
    { path: "/register", expected: [200] },
    { path: "/dashboard", expected: [307, 308, 200] },
    { path: "/admin", expected: [307, 308, 200] },
    { path: "/admin/users", expected: [307, 308, 200] },
    { path: "/admin/subscriptions", expected: [307, 308, 200] },
    { path: "/admin/contracts", expected: [307, 308, 200] },
    { path: "/admin/access", expected: [307, 308, 200] },
    { path: "/auth/confirm", expected: [307, 308, 400, 200] },
    { path: "/auth/error", expected: [200] },
    { path: "/pricing", expected: [200] },
  ];

  const routeChecks = (
    await Promise.allSettled(
      routeDefs.map((r) => headOrGet(`${origin}${r.path}`, r.expected)),
    )
  ).map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    return {
      id: `route:${routeDefs[i].path}`,
      label: routeDefs[i].path,
      status: "error" as const,
      message: "route check failed",
    };
  });

  const routesSection: DiagnosticSection = {
    id: "routes",
    title: "Application route checks",
    status: sectionStatus(routeChecks),
    checks: routeChecks,
  };

  // --- External deps ---
  const externalChecks = (
    await Promise.allSettled([
      supabaseReachable.id === "supabase-endpoint"
        ? Promise.resolve(supabaseReachable)
        : pingUrl(
            "ext-supabase",
            "Supabase endpoint",
            `${(supabaseUrl ?? "").replace(/\/$/, "")}/auth/v1/health`,
          ),
      pingUrl("ext-stripe", "Stripe API", "https://api.stripe.com/v1"),
      pingUrl("ext-origin", "EasyWedd public origin", origin),
    ])
  ).map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      id: `ext-${i}`,
      label: "external",
      status: "error" as const,
      message: "check failed",
    };
  });

  // Stripe API without auth returns 401 — that still means reachable
  const normalizedExternal = externalChecks.map((c) => {
    if (c.id === "ext-stripe" && (c.value === 401 || c.value === 403)) {
      return {
        ...c,
        status: "healthy" as DiagnosticStatus,
        message: `reachable (HTTP ${c.value} without auth — expected)`,
      };
    }
    return c;
  });

  const externalSection: DiagnosticSection = {
    id: "external",
    title: "External dependency checks",
    status: sectionStatus(normalizedExternal),
    checks: normalizedExternal,
  };

  // --- Recent errors ---
  const recentErrors: DiagnosticReport["recentErrors"] = [];
  if (admin) {
    const [audits, outboxFails, stripeFails] = await Promise.allSettled([
      admin
        .from("audit_logs")
        .select("created_at, action, entity_type, metadata")
        .order("created_at", { ascending: false })
        .limit(10),
      admin
        .from("email_outbox")
        .select("updated_at, status, last_error, event_type")
        .eq("status", "failed")
        .order("updated_at", { ascending: false })
        .limit(10),
      admin
        .from("stripe_events")
        .select("processed_at, event_type")
        .order("processed_at", { ascending: false })
        .limit(5),
    ]);

    if (audits.status === "fulfilled" && audits.value.data) {
      for (const row of audits.value.data) {
        recentErrors.push({
          timestamp: row.created_at,
          source: "audit_logs",
          severity: "info",
          code: row.entity_type ?? null,
          message: sanitizeAdminLogText(String(row.action ?? "")),
        });
      }
    }
    if (outboxFails.status === "fulfilled" && outboxFails.value.data) {
      for (const row of outboxFails.value.data) {
        recentErrors.push({
          timestamp: row.updated_at,
          source: "email_outbox",
          severity: "error",
          code: row.event_type ?? null,
          message: sanitizeAdminLogText(String(row.last_error ?? "failed")),
        });
      }
    }
    if (stripeFails.status === "fulfilled" && stripeFails.value.data) {
      for (const row of stripeFails.value.data) {
        recentErrors.push({
          timestamp: row.processed_at,
          source: "stripe_events",
          severity: "info",
          code: row.event_type ?? null,
          message: "processed (payload omitted)",
        });
      }
    }
  }

  recentErrors.sort((a, b) =>
    String(b.timestamp ?? "").localeCompare(String(a.timestamp ?? "")),
  );
  const recentTrimmed = recentErrors.slice(0, 20);

  const errorsSection: DiagnosticSection = {
    id: "errors",
    title: "Recent errors",
    status: recentTrimmed.some((e) => e.severity === "error")
      ? "warning"
      : "healthy",
    checks: recentTrimmed.map((e, i) => ({
      id: `err-${i}`,
      label: e.source,
      status: e.severity === "error" ? "error" : "healthy",
      code: e.code,
      message: `${e.timestamp ?? "?"} · ${e.message}`,
      value: e.severity,
    })),
  };

  // --- Schema ---
  const schemaChecks: DiagnosticCheck[] = [];
  for (const table of CRITICAL_TABLES) {
    const found = countChecks.find((c) => c.id === `table:${table}`);
    schemaChecks.push({
      id: `schema-table:${table}`,
      label: `table ${table}`,
      status:
        found?.value === "missing"
          ? "error"
          : found?.status === "healthy"
            ? "healthy"
            : found?.status ?? "unknown",
      value: found?.value ?? null,
      message: found?.message,
      code: found?.code,
    });
  }

  if (admin) {
    for (const col of CRITICAL_COLUMNS) {
      try {
        const { error } = await admin.from(col.table).select(col.column).limit(1);
        const missing =
          error &&
          (/column/i.test(error.message ?? "") || error.code === "42703");
        schemaChecks.push({
          id: `schema-col:${col.table}.${col.column}`,
          label: `${col.table}.${col.column}`,
          status: missing ? "error" : error ? "warning" : "healthy",
          code: error?.code ?? null,
          message: error
            ? sanitizeAdminLogText(error.message)
            : "selectable",
        });
      } catch (err) {
        schemaChecks.push({
          id: `schema-col:${col.table}.${col.column}`,
          label: `${col.table}.${col.column}`,
          status: "unknown",
          message: sanitizeAdminLogText(
            err instanceof Error ? err.message : "check failed",
          ),
        });
      }
    }
  }

  for (const rpc of ["is_platform_admin", "ensure_own_profile", "is_workspace_member"]) {
    const found = rpcChecks.find((c) => c.id === `rpc:${rpc}`);
    schemaChecks.push({
      id: `schema-rpc:${rpc}`,
      label: `rpc ${rpc}`,
      status: found?.status ?? "unknown",
      value: found?.value ?? null,
      message: found?.message,
      code: found?.code,
    });
  }

  schemaChecks.push({
    id: "schema-migrations-table",
    label: "migrations tracking table",
    status: "unknown",
    value: "unavailable",
    message:
      "supabase_migrations not queried (no app grant / not exposed via PostgREST)",
  });
  unimplemented.push({
    check: "supabase_migrations tracking",
    reason: "Not exposed to the service-role PostgREST schema in this project",
  });

  const schemaSectionStatus = sectionStatus(schemaChecks);
  const schemaStatus: DiagnosticReport["schemaStatus"] =
    schemaSectionStatus === "error"
      ? "ERROR"
      : schemaSectionStatus === "warning" ||
          schemaSectionStatus === "unknown"
        ? "WARNING"
        : "HEALTHY";

  const schemaSection: DiagnosticSection = {
    id: "schema",
    title: "Migrations / schema consistency",
    status: schemaSectionStatus,
    checks: schemaChecks,
    meta: { schemaStatus },
  };

  const sections = [
    runtimeSection,
    envSection,
    supabaseSection,
    dbSection,
    rpcSection,
    authSection,
    stripeSection,
    emailSection,
    cfSection,
    routesSection,
    externalSection,
    errorsSection,
    schemaSection,
  ];

  const criticalFailures: string[] = [];
  if (!flags.supabaseUrlPresent && !runtimeEnvPresent("NEXT_PUBLIC_SUPABASE_URL")) {
    criticalFailures.push("Supabase URL missing");
  }
  if (!flags.serviceRolePresent && !runtimeEnvPresent("SUPABASE_SERVICE_ROLE_KEY")) {
    criticalFailures.push("service role missing");
  }
  if (adminRpc?.error) {
    criticalFailures.push("platform admin RPC fails");
  }
  if (!serviceRoleQueryOk) {
    criticalFailures.push("DB / service role query unavailable");
  }
  if (supabaseReachable.status === "error") {
    criticalFailures.push("Supabase unavailable");
  }
  if (stripeKeyPresent && stripeReachable.status === "error") {
    criticalFailures.push("Stripe key expected but invalid/unreachable");
  }
  if (schemaStatus === "ERROR") {
    criticalFailures.push("critical schema missing");
  }

  const warningCount = sections.reduce(
    (n, s) => n + s.checks.filter((c) => c.status === "warning").length,
    0,
  );

  const overallStatus =
    criticalFailures.length > 0
      ? ("ERROR" as const)
      : warningCount > 0
        ? ("DEGRADED" as const)
        : ("HEALTHY" as const);

  const probe = buildAdminProductionProbe({
    userPresent: Boolean(user),
    platformAdmin: options.platformAdmin,
    platformAdminRpcOk: !adminRpc?.error,
    platformAdminRpcCode: adminRpc?.error?.code ?? null,
  });

  return {
    generatedAt,
    overall: {
      status: overallStatus,
      scoreLabel: overallStatus,
      criticalFailures,
      warningCount,
    },
    probe: {
      supabaseUrlPresent: probe.supabaseUrlPresent,
      anonKeyPresent: probe.anonKeyPresent,
      serviceRolePresent: probe.serviceRolePresent,
      userPresent: probe.userPresent,
      platformAdmin: probe.platformAdmin,
      runtime: probe.runtime,
      envSource: probe.envSource,
    },
    sections,
    recentErrors: recentTrimmed,
    schemaStatus,
    unimplemented,
  };
}
