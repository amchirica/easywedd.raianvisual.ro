import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { EmptyState } from "@/components/planner/empty-state";
import { PrintButton } from "@/components/planner/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTableAction } from "@/lib/actions/seating";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { canManageGuests } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";

const SeatingBoard = dynamic(
  () =>
    import("@/components/planner/seating-board").then((m) => ({
      default: m.SeatingBoard,
    })),
  {
    loading: () => (
      <p className="text-sm text-muted-foreground">Loading…</p>
    ),
  },
);

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.seating.title };
}

export default async function SeatingPage() {
  const dict = await getDictionary(await getRequestLocale());
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return (
      <EmptyState
        title={dict.shell.workspaceIncomplete}
        description={ctx.error ?? ""}
      />
    );
  }

  const canWrite = canManageGuests(ctx.context.role);
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
          <h1 className="font-heading text-4xl">{dict.seating.title}</h1>
          <p className="mt-2 text-muted-foreground">{dict.seating.subtitle}</p>
        </div>
        <PrintButton />
      </header>

      {canWrite ? (
        <form
          action={createTableAction}
          className="grid gap-3 border border-border bg-card p-4 print:hidden sm:grid-cols-4"
        >
          <div className="space-y-1">
            <Label>Nr / label</Label>
            <Input name="label" required placeholder="1" />
          </div>
          <div className="space-y-1">
            <Label>Shape</Label>
            <select
              name="shape"
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue="round"
            >
              <option value="round">round</option>
              <option value="rectangle">rectangle</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>{dict.seating.capacity}</Label>
            <Input name="capacity" type="number" defaultValue={8} min={1} />
          </div>
          <div className="flex items-end">
            <Button type="submit">{dict.seating.addTable}</Button>
          </div>
        </form>
      ) : null}

      {(tables ?? []).length === 0 && !canWrite ? (
        <EmptyState
          title={dict.seating.emptyTitle}
          description={dict.seating.emptyDescription}
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
