import "server-only";

export type DiagnosticStatus = "healthy" | "warning" | "error" | "unknown";

export type DiagnosticCheck = {
  id: string;
  label: string;
  status: DiagnosticStatus;
  present?: boolean;
  value?: string | number | boolean | null;
  latencyMs?: number | null;
  code?: string | null;
  message?: string | null;
};

export type DiagnosticSection = {
  id: string;
  title: string;
  status: DiagnosticStatus;
  checks: DiagnosticCheck[];
  meta?: Record<string, string | number | boolean | null>;
};

export type DiagnosticOverall = {
  status: "HEALTHY" | "DEGRADED" | "ERROR";
  scoreLabel: string;
  criticalFailures: string[];
  warningCount: number;
};

export type DiagnosticReport = {
  generatedAt: string;
  overall: DiagnosticOverall;
  probe: {
    supabaseUrlPresent: boolean;
    anonKeyPresent: boolean;
    serviceRolePresent: boolean;
    userPresent: boolean;
    platformAdmin: boolean;
    runtime: string;
    envSource: string;
  };
  sections: DiagnosticSection[];
  recentErrors: Array<{
    timestamp: string | null;
    source: string;
    severity: string;
    code: string | null;
    message: string;
  }>;
  schemaStatus: "HEALTHY" | "WARNING" | "ERROR";
  unimplemented: Array<{ check: string; reason: string }>;
};

export function worstStatus(
  statuses: DiagnosticStatus[],
): DiagnosticStatus {
  if (statuses.includes("error")) return "error";
  if (statuses.includes("warning")) return "warning";
  if (statuses.includes("unknown")) return "unknown";
  if (statuses.every((s) => s === "healthy")) return "healthy";
  return "unknown";
}

export function sectionStatus(checks: DiagnosticCheck[]): DiagnosticStatus {
  return worstStatus(checks.map((c) => c.status));
}
