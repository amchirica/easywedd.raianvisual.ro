import type { Metadata } from "next";

import { EmptyState } from "@/components/planner/empty-state";
import { PrintButton } from "@/components/planner/print-button";
import { TimelineList } from "@/components/planner/timeline-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTimelineItemAction } from "@/lib/actions/timeline";
import { canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";

export const metadata: Metadata = { title: "Timeline" };

export default async function TimelinePage() {
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title="Workspace incomplet" description={ctx.error ?? ""} />;
  }

  const canWrite = canManagePlanner(ctx.context.role);
  const { data: items } = await ctx.context.supabase
    .from("wedding_timeline_items")
    .select("*")
    .eq("wedding_id", ctx.context.weddingId)
    .order("sort_order");

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl">Programul zilei</h1>
          <p className="mt-2 text-muted-foreground">
            Ordonare, vizibilitate pe roluri și versiune printabilă pentru colaboratori.
          </p>
        </div>
        <PrintButton />
      </header>

      {canWrite ? (
        <form
          action={createTimelineItemAction}
          className="grid gap-3 border border-border bg-card p-4 print:hidden sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="space-y-1 sm:col-span-2">
            <Label>Titlu</Label>
            <Input name="title" required placeholder="Sosirea mirilor" />
          </div>
          <div className="space-y-1">
            <Label>Locație</Label>
            <Input name="location" />
          </div>
          <div className="space-y-1">
            <Label>Început</Label>
            <Input name="start_time" type="datetime-local" />
          </div>
          <div className="space-y-1">
            <Label>Sfârșit</Label>
            <Input name="end_time" type="datetime-local" />
          </div>
          <div className="space-y-1">
            <Label>Responsabil</Label>
            <Input name="responsible_person" />
          </div>
          <div className="space-y-1">
            <Label>Telefon</Label>
            <Input name="contact_phone" />
          </div>
          <div className="space-y-1">
            <Label>Vizibilitate</Label>
            <select
              name="visibility"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="couple"
            >
              <option value="couple">Cuplu</option>
              <option value="photo_team">Echipa foto-video</option>
              <option value="guests">Invitați</option>
              <option value="private">Privat</option>
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Notițe</Label>
            <Input name="notes" />
          </div>
          <Button type="submit">Adaugă în program</Button>
        </form>
      ) : null}

      {(items ?? []).length === 0 ? (
        <EmptyState
          title="Program gol"
          description="Adaugă primul moment din ziua nunții."
        />
      ) : (
        <TimelineList items={items ?? []} />
      )}
    </div>
  );
}
