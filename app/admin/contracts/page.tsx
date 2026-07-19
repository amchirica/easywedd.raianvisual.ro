import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createClientContractAction,
  disableContractAccessAction,
  extendContractAccessAction,
} from "@/lib/actions/admin-contracts";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Contracte Raian" };

export default async function AdminContractsPage() {
  const supabase = await createClient();
  const { data: contracts } = await supabase
    .from("client_contract_links")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-heading text-4xl">Contracte clienți</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Workspace Raian Visual · plan grant · invitație client
        </p>
      </header>

      <form action={createClientContractAction} className="grid max-w-2xl gap-3">
        <h2 className="font-heading text-2xl">Client nou</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Nume workspace</Label>
            <Input name="workspace_name" required />
          </div>
          <div className="space-y-1">
            <Label>Email client</Label>
            <Input name="client_email" type="email" required />
          </div>
          <div className="space-y-1">
            <Label>Pachet</Label>
            <Input name="package_name" placeholder="Premium Wedding" />
          </div>
          <div className="space-y-1">
            <Label>Referință contract</Label>
            <Input name="external_contract_reference" />
          </div>
          <div className="space-y-1">
            <Label>Plan</Label>
            <select
              name="access_plan"
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="premium"
            >
              <option value="starter">starter</option>
              <option value="essentials">essentials</option>
              <option value="premium">premium</option>
              <option value="agency">agency</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Luni acces</Label>
            <Input name="access_months" type="number" defaultValue={12} />
          </div>
        </div>
        <Button type="submit">Creează + trimite invitație</Button>
      </form>

      <div className="divide-y divide-border border-y border-border">
        {(contracts ?? []).map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="text-sm">
              <p className="font-heading text-xl">
                {c.package_name || "Contract"} · {c.access_plan}
              </p>
              <p className="text-muted-foreground">
                {c.external_contract_reference || "—"} · până la{" "}
                {c.access_ends_at
                  ? new Date(c.access_ends_at).toLocaleDateString("ro-RO")
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                cod: {c.activation_code}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={extendContractAccessAction} className="flex gap-2">
                <input type="hidden" name="contract_id" value={c.id} />
                <input type="hidden" name="months" value="3" />
                <Button type="submit" size="sm" variant="outline">
                  +3 luni
                </Button>
              </form>
              <form action={disableContractAccessAction.bind(null, c.id)}>
                <Button type="submit" size="sm" variant="outline">
                  Dezactivează
                </Button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
