"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  requestGdprExportAction,
  requestWorkspaceDeletionAction,
  updateConsentAction,
  updateEmailPreferencesAction,
} from "@/lib/actions/gdpr";

export default function PrivacyCenterPage() {
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-heading text-4xl">Privacy Center</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Consimțăminte, preferințe email, export și ștergere
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Consimțăminte</h2>
        {(
          [
            ["marketing", "Marketing"],
            ["analytics", "Analytics produs"],
            ["anonymized_industry_research", "Cercetare industrie anonimizată"],
          ] as const
        ).map(([type, label]) => (
          <form
            key={type}
            action={updateConsentAction}
            className="flex flex-wrap items-center gap-3 text-sm"
          >
            <input type="hidden" name="consent_type" value={type} />
            <span className="min-w-56">{label}</span>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="granted" /> Acord
            </label>
            <Button type="submit" size="sm" variant="outline">
              Salvează
            </Button>
          </form>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Preferințe email</h2>
        <form action={updateEmailPreferencesAction} className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="transactional_enabled" defaultChecked />{" "}
            Tranzacționale
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="reminders_enabled" defaultChecked />{" "}
            Reminder-e
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="marketing_enabled" /> Marketing
          </label>
          <Button type="submit" variant="outline">
            Salvează preferințe
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Export date</h2>
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              void requestGdprExportAction().then((res) => {
                if (res.payload) setExportJson(JSON.stringify(res.payload, null, 2));
              });
            })
          }
        >
          Generează export
        </Button>
        {exportJson ? (
          <pre className="max-h-80 overflow-auto border border-border bg-secondary/30 p-3 text-xs">
            {exportJson}
          </pre>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Ștergere workspace</h2>
        <p className="text-sm text-muted-foreground">
          Creează o cerere pending pentru procesare (inclusiv storage).
        </p>
        <form action={requestWorkspaceDeletionAction}>
          <Button type="submit" variant="outline">
            Solicită ștergerea
          </Button>
        </form>
      </section>
    </div>
  );
}
