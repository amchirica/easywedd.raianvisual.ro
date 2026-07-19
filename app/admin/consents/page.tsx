import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Consimțăminte · Admin" };

export default async function AdminConsentsPage() {
  const supabase = await createClient();
  const { data: consents } = await supabase
    .from("user_consents")
    .select(
      "id, user_id, consent_type, consent_version, granted, granted_at, source, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">Consimțăminte</h1>
        <p className="mt-2 text-muted-foreground">
          Cercetarea de piață necesită consimțământ separat{" "}
          <code>anonymized_industry_research</code>.
        </p>
      </header>
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
                <th className="px-4 py-3 font-medium">Sursă</th>
              </tr>
            </thead>
            <tbody>
              {consents.map((consent) => (
                <tr
                  key={consent.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">{consent.consent_type}</td>
                  <td className="px-4 py-3">{consent.granted ? "Da" : "Nu"}</td>
                  <td className="px-4 py-3">{consent.consent_version}</td>
                  <td className="px-4 py-3">{consent.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
