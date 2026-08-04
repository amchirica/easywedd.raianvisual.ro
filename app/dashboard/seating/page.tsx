import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { EmptyState } from "@/components/planner/empty-state";
import { PrintButton } from "@/components/planner/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTableAction } from "@/lib/actions/seating";
import { canManageGuests } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";

const SeatingBoard = dynamic(
  () =>
    import("@/components/planner/seating-board").then((m) => ({
      default: m.SeatingBoard,
    })),
  {
    loading: () => (
      <p className="text-sm text-muted-foreground">Se încarcă planul de mese…</p>
    ),
  },
);

export const metadata: Metadata = { title: "Seating" };

export default async function SeatingPage() {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title="Workspace incomplet" description={ctx.error ?? ""} />;
  }

  const canWrite = canManageGuests(ctx.context.role);
  // Keep full rows for SeatingBoard props (VenueTable / Guest shapes).
  const [{ data: tables }, { data: guests }, { data: assignments }] =
    await Promise.all([
      ctx.context.supabase
        .from("tables")
        .select("*")
        .eq("wedding_id", ctx.context.weddingId)
        .order("sort_order"),
      ctx.context.supabase
        .from("guests")
        .select("*")
        .eq("wedding_id", ctx.context.weddingId)
        .eq("is_anonymized", false),
      ctx.context.supabase
        .from("table_assignments")
        .select("guest_id, table_id")
        .eq("workspace_id", ctx.context.workspaceId),
    ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl">Seating Plan</h1>
          <p className="mt-2 text-muted-foreground">
            Plan vizual 2D: mese rotunde/dreptunghiulare, poziții și alocări
            prin drag-and-drop.
          </p>
        </div>
        <PrintButton label="Listă restaurant / Print" />
      </header>

      {canWrite ? (
        <form
          action={createTableAction}
          className="grid gap-3 border border-border bg-card p-4 print:hidden sm:grid-cols-4"
        >
          <div className="space-y-1">
            <Label>Număr / etichetă</Label>
            <Input name="label" required placeholder="Masa 1" />
          </div>
          <div className="space-y-1">
            <Label>Formă</Label>
            <select
              name="shape"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="round"
            >
              <option value="round">Rotundă</option>
              <option value="rectangle">Dreptunghiulară</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Capacitate</Label>
            <Input name="capacity" type="number" defaultValue={8} min={1} />
          </div>
          <div className="flex items-end">
            <Button type="submit">Adaugă masă</Button>
          </div>
        </form>
      ) : null}

      {(tables ?? []).length === 0 && !canWrite ? (
        <EmptyState
          title="Nicio masă"
          description="Creează mesele, apoi alocă invitații."
        />
      ) : (
        <SeatingBoard
          tables={tables ?? []}
          guests={guests ?? []}
          assignments={assignments ?? []}
          canWrite={canWrite}
        />
      )}
    </div>
  );
}
