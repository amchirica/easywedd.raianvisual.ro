import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logAdminAccessReasonAction } from "@/lib/actions/admin-insights";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Workspace detail" };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminWorkspaceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug, workspace_type, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!workspace) notFound();

  const { data: access } = await supabase
    .from("admin_access_reasons")
    .select("id")
    .eq("target_id", id)
    .eq("target_type", "workspace")
    .limit(1);

  const unlocked = (access ?? []).length > 0;

  const { data: subscription } = unlocked
    ? await supabase
        .from("subscriptions")
        .select("plan, status, access_ends_at, product_key")
        .eq("workspace_id", id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">{workspace.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {workspace.slug} · {workspace.workspace_type} · {workspace.status}
        </p>
      </header>

      {!unlocked ? (
        <form action={logAdminAccessReasonAction} className="max-w-lg space-y-3 border border-border p-4">
          <p className="text-sm">
            Pentru detalii sensibile, înregistrează un motiv de acces (audit).
          </p>
          <input type="hidden" name="target_type" value="workspace" />
          <input type="hidden" name="target_id" value={id} />
          <div className="space-y-1">
            <Label>Motiv</Label>
            <Input name="reason" required placeholder="Suport client / incident..." />
          </div>
          <Button type="submit">Deblochează vedere minimă</Button>
        </form>
      ) : (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Plan</dt>
            <dd>{subscription?.plan ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{subscription?.status ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Product</dt>
            <dd>{subscription?.product_key ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Acces până</dt>
            <dd>
              {subscription?.access_ends_at
                ? new Date(subscription.access_ends_at).toLocaleDateString("ro-RO")
                : "—"}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
