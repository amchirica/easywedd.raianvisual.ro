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

  const message = error.message || "Eroare necunoscută pe server.";

  return (
    <div className="space-y-4 border border-border bg-card p-6">
      <h1 className="font-heading text-2xl">Pagina admin nu s-a putut încărca</h1>
      <p className="text-sm text-muted-foreground">
        Eroarea de mai jos e pentru diagnostic (fără secrete). Digest:{" "}
        <span className="font-mono text-xs">{error.digest ?? "—"}</span>
      </p>
      <pre className="overflow-x-auto rounded border border-border bg-background p-3 font-mono text-xs whitespace-pre-wrap">
        {message}
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
