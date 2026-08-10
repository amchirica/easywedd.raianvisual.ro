"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { sendAdminDiagnosticsTestEmailAction } from "@/lib/actions/admin-diagnostics";
import type {
  DiagnosticCheck,
  DiagnosticReport,
  DiagnosticSection,
  DiagnosticStatus,
} from "@/lib/admin/diagnostics-types";
import { Button } from "@/components/ui/button";

const STATUS_STYLES: Record<string, string> = {
  healthy: "border-emerald-600/40 text-emerald-800 bg-emerald-50",
  warning: "border-amber-600/40 text-amber-900 bg-amber-50",
  error: "border-red-600/40 text-red-800 bg-red-50",
  unknown: "border-border text-muted-foreground bg-muted/40",
  HEALTHY: "border-emerald-600/40 text-emerald-800 bg-emerald-50",
  DEGRADED: "border-amber-600/40 text-amber-900 bg-amber-50",
  WARNING: "border-amber-600/40 text-amber-900 bg-amber-50",
  ERROR: "border-red-600/40 text-red-800 bg-red-50",
};

function StatusBadge({
  status,
}: {
  status: DiagnosticStatus | "HEALTHY" | "DEGRADED" | "WARNING" | "ERROR";
}) {
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function SummaryCard({
  title,
  status,
  href,
}: {
  title: string;
  status: DiagnosticStatus | "HEALTHY" | "DEGRADED" | "WARNING" | "ERROR";
  href: string;
}) {
  return (
    <a
      href={href}
      className="block border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/30"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        <StatusBadge status={status} />
      </div>
    </a>
  );
}

function CheckRow({ check }: { check: DiagnosticCheck }) {
  return (
    <div className="grid gap-1 border-b border-border/70 py-2 text-sm last:border-0 sm:grid-cols-[1fr_auto_minmax(0,1.4fr)] sm:gap-3">
      <div className="flex items-center gap-2">
        <StatusBadge status={check.status} />
        <span>{check.label}</span>
      </div>
      <span className="font-mono text-xs text-muted-foreground">
        {check.present !== undefined
          ? `present=${check.present}`
          : check.value !== undefined && check.value !== null
            ? String(check.value)
            : "—"}
        {check.latencyMs != null ? ` · ${check.latencyMs}ms` : ""}
        {check.code ? ` · ${check.code}` : ""}
      </span>
      <span className="text-xs text-muted-foreground break-words">
        {check.message ?? ""}
      </span>
    </div>
  );
}

function SectionBlock({ section }: { section: DiagnosticSection }) {
  return (
    <section
      id={`section-${section.id}`}
      className="scroll-mt-24 border border-border bg-card"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="font-heading text-xl">{section.title}</h2>
        <StatusBadge status={section.status} />
      </header>
      <div className="px-4 py-2">
        {section.checks.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">Nicio verificare.</p>
        ) : (
          section.checks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))
        )}
      </div>
    </section>
  );
}

function TestEmailButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          const ok = window.confirm(
            "Trimite email de test către adresa ta de platform admin? Nu se trimite către alți utilizatori.",
          );
          if (!ok) return;
          startTransition(async () => {
            const res = await sendAdminDiagnosticsTestEmailAction();
            setResult(
              res.ok
                ? `Trimis către ${res.maskedRecipient ?? "admin"}.`
                : res.error ?? "Eșec",
            );
          });
        }}
      >
        {pending ? "Se trimite…" : "Trimite email de test"}
      </Button>
      {result ? (
        <p className="text-xs text-muted-foreground">{result}</p>
      ) : null}
    </div>
  );
}

export function DiagnosticsDashboard({ report }: { report: DiagnosticReport }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showJson, setShowJson] = useState(false);

  const byId = (id: string) =>
    report.sections.find((s) => s.id === id)?.status ?? "unknown";

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl">Production Diagnostics</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Platform admin only · fără secrete · Last checked:{" "}
              <time dateTime={report.generatedAt}>{report.generatedAt}</time>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={report.overall.status} />
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => {
                startTransition(() => {
                  router.refresh();
                });
              }}
            >
              {pending ? "Running…" : "Run diagnostics"}
            </Button>
            <Link
              href="/admin/diagnostics?format=json"
              prefetch={false}
              className="inline-flex h-8 items-center justify-center border border-border bg-background px-3 text-sm hover:bg-muted/40"
            >
              JSON view
            </Link>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowJson((v) => !v)}
            >
              {showJson ? "Hide inline JSON" : "Inline JSON"}
            </Button>
          </div>
        </div>

        {report.overall.criticalFailures.length > 0 ? (
          <div className="border border-red-600/40 bg-red-50 px-4 py-3 text-sm text-red-900">
            Critical: {report.overall.criticalFailures.join(" · ")}
          </div>
        ) : null}

        <div className="border border-border bg-muted/20 px-4 py-3 font-mono text-xs">
          {JSON.stringify(report.probe, null, 2)}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Overall Health"
          status={report.overall.status}
          href="#section-runtime"
        />
        <SummaryCard title="Runtime" status={byId("runtime")} href="#section-runtime" />
        <SummaryCard title="Auth" status={byId("auth")} href="#section-auth" />
        <SummaryCard
          title="Database"
          status={byId("database")}
          href="#section-database"
        />
        <SummaryCard
          title="Supabase"
          status={byId("supabase")}
          href="#section-supabase"
        />
        <SummaryCard title="Stripe" status={byId("stripe")} href="#section-stripe" />
        <SummaryCard title="Email" status={byId("email")} href="#section-email" />
        <SummaryCard
          title="Cloudflare"
          status={byId("cloudflare")}
          href="#section-cloudflare"
        />
        <SummaryCard title="Routes" status={byId("routes")} href="#section-routes" />
        <SummaryCard title="Schema" status={report.schemaStatus} href="#section-schema" />
        <SummaryCard
          title="Recent Errors"
          status={byId("errors")}
          href="#section-errors"
        />
      </div>

      <div className="border border-border bg-card px-4 py-4">
        <h2 className="font-heading text-xl">Email test</h2>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          Trimite doar către emailul tău de platform admin, după confirmare.
        </p>
        <TestEmailButton />
      </div>

      {report.sections.map((section) => (
        <SectionBlock key={section.id} section={section} />
      ))}

      {report.unimplemented.length > 0 ? (
        <section className="border border-border bg-card px-4 py-4">
          <h2 className="font-heading text-xl">Checks not fully implemented</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {report.unimplemented.map((item) => (
              <li key={item.check}>
                <span className="font-medium text-foreground">{item.check}</span>
                {" — "}
                {item.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showJson ? (
        <pre className="overflow-x-auto border border-border bg-background p-4 font-mono text-xs whitespace-pre-wrap">
          {JSON.stringify(report, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
