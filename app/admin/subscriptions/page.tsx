import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Abonamente · Admin" };

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, workspace_id, plan, status, trial_ends_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-4xl">Abonamente</h1>
      {!subscriptions?.length ? (
        <p className="text-sm text-muted-foreground">Niciun abonament încă.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Workspace</th>
                <th className="px-4 py-3 font-medium">Trial</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{sub.plan}</td>
                  <td className="px-4 py-3">{sub.status}</td>
                  <td className="px-4 py-3 font-mono text-xs">{sub.workspace_id}</td>
                  <td className="px-4 py-3">
                    {sub.trial_ends_at
                      ? new Date(sub.trial_ends_at).toLocaleDateString("ro-RO")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
