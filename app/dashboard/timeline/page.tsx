import type { Metadata } from "next";

import { EmptyState } from "@/components/planner/empty-state";
import { PrintButton } from "@/components/planner/print-button";
import { TimelineList } from "@/components/planner/timeline-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTimelineItemAction } from "@/lib/actions/timeline";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { canManagePlanner } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.dayTimeline.title };
}

export default async function TimelinePage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return (
      <EmptyState
        title={dict.shell.workspaceIncomplete}
        description={ctx.error ?? ""}
      />
    );
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
          <h1 className="font-heading text-4xl">{dict.dayTimeline.title}</h1>
          <p className="mt-2 text-muted-foreground">{dict.dayTimeline.subtitle}</p>
        </div>
        <PrintButton />
      </header>

      {canWrite ? (
        <form
          action={createTimelineItemAction}
          className="grid gap-3 border border-border bg-card p-4 print:hidden sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="space-y-1 sm:col-span-2">
            <Label>{dict.dayTimeline.columns.title}</Label>
            <Input name="title" required />
          </div>
          <div className="space-y-1">
            <Label>Location</Label>
            <Input name="location" />
          </div>
          <div className="space-y-1">
            <Label>{dict.dayTimeline.columns.time}</Label>
            <Input name="start_time" type="datetime-local" />
          </div>
          <div className="space-y-1">
            <Label>{dict.dayTimeline.columns.time}</Label>
            <Input name="end_time" type="datetime-local" />
          </div>
          <div className="space-y-1">
            <Label>Owner</Label>
            <Input name="responsible_person" />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input name="contact_phone" />
          </div>
          <div className="space-y-1">
            <Label>Visibility</Label>
            <select
              name="visibility"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="couple"
            >
              <option value="couple">couple</option>
              <option value="photo_team">photo_team</option>
              <option value="guests">guests</option>
              <option value="private">private</option>
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>{dict.dayTimeline.columns.notes}</Label>
            <Input name="notes" />
          </div>
          <Button type="submit">{dict.dayTimeline.add}</Button>
        </form>
      ) : null}

      {(items ?? []).length === 0 ? (
        <EmptyState
          title={dict.dayTimeline.emptyTitle}
          description={dict.dayTimeline.emptyDescription}
        />
      ) : (
        <TimelineList items={items ?? []} />
      )}
    </div>
  );
}
