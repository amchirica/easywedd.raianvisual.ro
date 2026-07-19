"use client";

import { useTransition } from "react";

import { ConfirmDeleteButton } from "@/components/planner/confirm-delete-button";
import { Button } from "@/components/ui/button";
import {
  assignGuestToTableAction,
  deleteTableAction,
} from "@/lib/actions/seating";
import type { Guest, VenueTable } from "@/types/planner";

type SeatingBoardProps = {
  tables: VenueTable[];
  guests: Guest[];
  assignments: { guest_id: string; table_id: string }[];
};

export function SeatingBoard({ tables, guests, assignments }: SeatingBoardProps) {
  const [, startTransition] = useTransition();
  const assignedIds = new Set(assignments.map((a) => a.guest_id));
  const unassigned = guests.filter((g) => !assignedIds.has(g.id));

  function guestsAtTable(tableId: string) {
    const ids = new Set(
      assignments.filter((a) => a.table_id === tableId).map((a) => a.guest_id),
    );
    return guests.filter((g) => ids.has(g.id));
  }

  function assign(guestId: string, tableId: string | null) {
    startTransition(() => {
      void assignGuestToTableAction(guestId, tableId);
    });
  }

  return (
    <div className="space-y-6">
      <section className="border border-border bg-card p-4 print:break-inside-avoid">
        <h2 className="font-heading text-2xl">
          Invitați nealocați ({unassigned.length})
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {unassigned.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Toți invitații sunt alocați.
            </p>
          ) : (
            unassigned.map((guest) => (
              <div
                key={guest.id}
                className="flex items-center gap-2 border border-border bg-background px-3 py-2 text-sm"
              >
                <span>
                  {guest.first_name} {guest.last_name}
                </span>
                <select
                  className="rounded border border-input bg-background px-2 py-1 text-xs print:hidden"
                  defaultValue=""
                  onChange={(e) => assign(guest.id, e.target.value || null)}
                >
                  <option value="">Alege masa</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.label}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tables.map((table) => {
          const seated = guestsAtTable(table.id);
          const over = seated.length > table.capacity;
          return (
            <section
              key={table.id}
              className="border border-border bg-card p-4 print:break-inside-avoid"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-heading text-xl">{table.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {table.shape === "round" ? "Rotundă" : "Dreptunghiulară"} ·{" "}
                    {seated.length}/{table.capacity}
                    {over ? " · capacitate depășită" : ""}
                  </p>
                </div>
                <div className="print:hidden">
                  <ConfirmDeleteButton
                    id={table.id}
                    action={deleteTableAction}
                  />
                </div>
              </div>
              {over ? (
                <p className="mt-2 text-xs text-destructive">
                  Atenție: ai depășit capacitatea mesei.
                </p>
              ) : null}
              <ul className="mt-3 space-y-2 text-sm">
                {seated.map((guest) => (
                  <li
                    key={guest.id}
                    className="flex items-center justify-between gap-2 border border-border px-2 py-1"
                  >
                    <span>
                      {guest.first_name} {guest.last_name}
                    </span>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="print:hidden"
                      onClick={() => assign(guest.id, null)}
                    >
                      Scoate
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
