"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error.message, error.digest ?? "");
  }, [error]);

  const redacted =
    /omitted in production builds|An error occurred in the Server Components/i.test(
      error.message,
    );

  return (
    <div className="space-y-4 border border-border bg-card p-6">
      <h1 className="font-heading text-2xl">Pagina admin nu s-a putut încărca</h1>
      <p className="text-sm text-muted-foreground">
        Digest:{" "}
        <span className="font-mono text-xs">{error.digest ?? "—"}</span>
        {redacted
          ? " — Next.js ascunde mesajul real în production; după redeploy vei vedea panoul de diagnostic pe pagină."
          : null}
      </p>
      <pre className="overflow-x-auto rounded border border-border bg-background p-3 font-mono text-xs whitespace-pre-wrap">
        {error.message || "Eroare necunoscută pe server."}
      </pre>
      <button
        type="button"
        onClick={reset}
        className="h-9 rounded-lg bg-foreground px-4 text-sm text-background"
      >
        Reîncearcă
      </button>
    </div>
  );
}
