import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getAuthConfirmUrl, getSiteUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Auth diagnostics (dev)",
};

export const dynamic = "force-dynamic";

/**
 * Development-only auth diagnostics. Never exposes secret keys.
 */
export default async function AuthDiagnosticsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const callbackUrl = getAuthConfirmUrl("/dashboard");
  const resetCallback = getAuthConfirmUrl("/auth/reset-password");

  const supabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  let sessionState = "none";
  let userState = "none";
  let lastError: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      lastError = `${error.name ?? "AuthError"}: ${error.message} (${error.code ?? "n/a"})`;
      sessionState = "error";
      userState = "error";
    } else if (user) {
      sessionState = "authenticated";
      userState = user.email ?? user.id;
    } else {
      sessionState = "anonymous";
      userState = "no user";
    }
  } catch (e) {
    lastError = e instanceof Error ? e.message : "unknown";
    sessionState = "exception";
  }

  const rows: { label: string; value: string }[] = [
    {
      label: "Supabase URL configured",
      value: supabaseUrl ? "yes" : "no",
    },
    {
      label: "Publishable/anon key configured",
      value: anonKey ? "yes" : "no",
    },
    { label: "Resolved Site URL", value: siteUrl },
    { label: "Auth confirm URL (signup)", value: callbackUrl },
    { label: "Auth confirm URL (reset)", value: resetCallback },
    { label: "Session state", value: sessionState },
    { label: "Current user", value: userState },
    {
      label: "Last safe auth error",
      value: lastError ?? "—",
    },
    {
      label: "NODE_ENV",
      value: process.env.NODE_ENV ?? "—",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <header>
        <h1 className="font-heading text-3xl">Auth diagnostics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Doar în development. Nu afișează chei secrete.
        </p>
      </header>

      <dl className="divide-y divide-border border border-border text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr]"
          >
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="break-all font-mono text-xs">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-xs text-muted-foreground">
        Verifică în Supabase Dashboard → Authentication → URL Configuration că
        Site URL și Redirect URLs includ{" "}
        <code className="text-foreground">{siteUrl}/auth/confirm</code>.
      </p>

      <Link href="/register" className={cn(buttonVariants({ variant: "outline" }))}>
        Înapoi la înregistrare
      </Link>
    </div>
  );
}
