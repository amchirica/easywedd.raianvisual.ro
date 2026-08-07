import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";

import { consentTypeLabel } from "@/lib/consents";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.admin.consentsMetaTitle };
}

export default async function AdminConsentsPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const supabase = await createClient();

  // Effective consents only (unique constraint keeps one current row)
  const { data: consents } = await supabase
    .from("user_consents")
    .select(
      "id, user_id, workspace_id, consent_type, consent_version, granted, granted_at, source, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: history } = await supabase
    .from("user_consent_history")
    .select(
      "id, user_id, consent_type, consent_version, granted, source, created_at, archived_at",
    )
    .order("archived_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-4xl">{dict.admin.consents}</h1>
        <p className="mt-2 text-muted-foreground">
          Vizualizare consimțăminte efective (un rând per tip/versiune). Istoricul
          GDPR este separat mai jos.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">{dict.admin.consentsCurrent}</h2>
        {!consents?.length ? (
          <p className="text-sm text-muted-foreground">
            Niciun consimțământ înregistrat.
          </p>
        ) : (
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Tip</th>
                  <th className="px-4 py-3 font-medium">Acordat</th>
                  <th className="px-4 py-3 font-medium">Versiune</th>
                  <th className="px-4 py-3 font-medium">{dict.admin.source}</th>
                  <th className="px-4 py-3 font-medium">Utilizator</th>
                </tr>
              </thead>
              <tbody>
                {consents.map((consent) => (
                  <tr
                    key={consent.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      {consentTypeLabel(consent.consent_type)}
                    </td>
                    <td className="px-4 py-3">
                      {consent.granted ? "Da" : "Nu"}
                    </td>
                    <td className="px-4 py-3">{consent.consent_version}</td>
                    <td className="px-4 py-3">{consent.source}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {consent.user_id.slice(0, 8)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">{dict.admin.consentsHistory}</h2>
        <p className="text-sm text-muted-foreground">
          Rânduri arhivate la deduplicare — păstrate pentru audit GDPR.
        </p>
        {!history?.length ? (
          <p className="text-sm text-muted-foreground">{dict.admin.consentsHistoryEmpty}</p>
        ) : (
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Tip</th>
                  <th className="px-4 py-3 font-medium">Acordat</th>
                  <th className="px-4 py-3 font-medium">Arhivat</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      {consentTypeLabel(row.consent_type)}
                    </td>
                    <td className="px-4 py-3">{row.granted ? "Da" : "Nu"}</td>
                    <td className="px-4 py-3">
                      {new Date(row.archived_at).toLocaleString("ro-RO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
