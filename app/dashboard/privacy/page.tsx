"use client";

import { useState, useTransition } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  requestGdprExportAction,
  requestWorkspaceDeletionAction,
  updateConsentAction,
  updateEmailPreferencesAction,
} from "@/lib/actions/gdpr";

export default function PrivacyCenterPage() {
  const { dict } = useI18n();
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-heading text-4xl">{dict.privacy.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {dict.privacy.subtitle}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">{dict.privacy.consents}</h2>
        {(
          [
            ["marketing", "Marketing"],
            ["analytics", "Analytics"],
            ["anonymized_industry_research", "Research"],
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
              <input type="checkbox" name="granted" /> {dict.privacy.granted}
            </label>
            <Button type="submit" size="sm" variant="outline">
              {dict.dialog.save}
            </Button>
          </form>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">{dict.privacy.emailPrefs}</h2>
        <form action={updateEmailPreferencesAction} className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="transactional_enabled" defaultChecked />{" "}
            transactional
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="reminders_enabled" defaultChecked />{" "}
            reminders
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="marketing_enabled" /> Marketing
          </label>
          <Button type="submit" variant="outline">
            {dict.privacy.savePrefs}
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">{dict.privacy.exportData}</h2>
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
          {dict.privacy.generateExport}
        </Button>
        {exportJson ? (
          <pre className="max-h-80 overflow-auto border border-border bg-secondary/30 p-3 text-xs">
            {exportJson}
          </pre>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">{dict.privacy.deleteWorkspace}</h2>
        <p className="text-sm text-muted-foreground">{dict.privacy.deleteHint}</p>
        <form action={requestWorkspaceDeletionAction}>
          <Button type="submit" variant="outline">
            {dict.privacy.requestDelete}
          </Button>
        </form>
      </section>
    </div>
  );
}
