import type { Metadata } from "next";

import { AdminGdprControls } from "@/components/admin/admin-deletion-controls";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "GDPR requests" };

export default async function AdminGdprPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("gdpr_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">Cereri GDPR</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Export / delete / anonymize / consent revoke · fulfill soft-delete
        </p>
      </header>
      <div className="overflow-x-auto border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Tip</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Creat</th>
              <th className="px-4 py-3">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {(requests ?? []).map((r) => (
              <tr key={r.id} className="border-b border-border">
                <td className="px-4 py-3">{r.request_type}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.user_id}</td>
                <td className="px-4 py-3">
                  {new Date(r.created_at).toLocaleString("ro-RO")}
                </td>
                <td className="px-4 py-3">
                  <AdminGdprControls
                    requestId={r.id}
                    status={r.status}
                    isDeleteRequest={r.request_type === "delete"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}