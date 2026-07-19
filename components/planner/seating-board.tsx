"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState, useTransition } from "react";

import { ConfirmDeleteButton } from "@/components/planner/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  assignGuestToTableAction,
  deleteTableAction,
  updateTableAction,
  updateTablePositionAction,
} from "@/lib/actions/seating";
import type { Guest, VenueTable } from "@/types/planner";

type SeatingBoardProps = {
  tables: VenueTable[];
  guests: Guest[];
  assignments: { guest_id: string; table_id: string }[];
  canWrite: boolean;
};

type DragData =
  | { kind: "guest"; guestId: string }
  | { kind: "table"; tableId: string };

function guestChipLabel(guest: Guest) {
  return `${guest.first_name} ${guest.last_name}`.trim();
}

function GuestChip({
  guest,
  disabled,
}: {
  guest: Guest;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `guest:${guest.id}`,
      data: { kind: "guest", guestId: guest.id } satisfies DragData,
      disabled,
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      className={`rounded border border-border bg-background px-2 py-1 text-left text-xs ${
        isDragging ? "opacity-40" : ""
      } ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
      {...listeners}
      {...attributes}
    >
      {guestChipLabel(guest)}
    </button>
  );
}

function TableNode({
  table,
  seated,
  canWrite,
  onSaveMeta,
}: {
  table: VenueTable;
  seated: Guest[];
  canWrite: boolean;
  onSaveMeta: (input: {
    label: string;
    shape: "round" | "rectangle";
    capacity: number;
  }) => void;
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `table-drop:${table.id}`,
    data: { tableId: table.id },
  });
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `table:${table.id}`,
    data: { kind: "table", tableId: table.id } satisfies DragData,
    disabled: !canWrite,
  });

  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(table.label);
  const [shape, setShape] = useState<"round" | "rectangle">(table.shape);
  const [capacity, setCapacity] = useState(table.capacity);

  const width = table.shape === "round" ? 168 : 200;
  const height = table.shape === "round" ? 168 : 140;
  const over = seated.length > table.capacity;

  const x = (table.pos_x ?? 80) + (transform?.x ?? 0);
  const y = (table.pos_y ?? 80) + (transform?.y ?? 0);

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      className={`absolute border bg-card p-3 shadow-sm print:static print:shadow-none ${
        table.shape === "round" ? "rounded-full" : "rounded-xl"
      } ${isOver ? "ring-2 ring-[var(--champagne)]" : "border-border"} ${
        isDragging ? "opacity-70 z-20" : "z-10"
      }`}
      style={{
        left: x,
        top: y,
        width,
        height,
        minHeight: height,
      }}
    >
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
        <button
          type="button"
          className={`font-heading text-base ${canWrite ? "cursor-grab" : ""}`}
          {...(canWrite ? { ...listeners, ...attributes } : {})}
        >
          {table.label}
        </button>
        <p className="text-[10px] text-muted-foreground">
          {table.shape === "round" ? "Rotundă" : "Dreptunghiulară"} ·{" "}
          {seated.length}/{table.capacity}
          {over ? " · plină" : ""}
        </p>
        <div className="mt-1 flex max-h-16 flex-wrap justify-center gap-1 overflow-hidden">
          {seated.slice(0, 8).map((guest) => (
            <GuestChip key={guest.id} guest={guest} disabled={!canWrite} />
          ))}
          {seated.length > 8 ? (
            <span className="text-[10px] text-muted-foreground">
              +{seated.length - 8}
            </span>
          ) : null}
        </div>
        {canWrite ? (
          <div className="mt-1 flex items-center gap-1 print:hidden">
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => setEditing((v) => !v)}
            >
              Editează
            </Button>
            <ConfirmDeleteButton id={table.id} action={deleteTableAction} />
          </div>
        ) : null}
      </div>

      {editing && canWrite ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-56 space-y-2 border border-border bg-card p-3 text-left shadow-md">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          <select
            className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
            value={shape}
            onChange={(e) =>
              setShape(e.target.value as "round" | "rectangle")
            }
          >
            <option value="round">Rotundă</option>
            <option value="rectangle">Dreptunghiulară</option>
          </select>
          <Input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value) || 1)}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onSaveMeta({ label, shape, capacity });
              setEditing(false);
            }}
          >
            Salvează
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function SeatingBoard({
  tables,
  guests,
  assignments,
  canWrite,
}: SeatingBoardProps) {
  const [, startTransition] = useTransition();
  const [activeGuestId, setActiveGuestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const assignedIds = useMemo(
    () => new Set(assignments.map((a) => a.guest_id)),
    [assignments],
  );
  const unassigned = guests.filter((g) => !assignedIds.has(g.id));

  const { setNodeRef: setUnassignedRef, isOver: overUnassigned } = useDroppable({
    id: "unassigned",
  });

  function guestsAtTable(tableId: string) {
    const ids = new Set(
      assignments.filter((a) => a.table_id === tableId).map((a) => a.guest_id),
    );
    return guests.filter((g) => ids.has(g.id));
  }

  function onDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData | undefined;
    if (data?.kind === "guest") setActiveGuestId(data.guestId);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveGuestId(null);
    if (!canWrite) return;

    const activeData = event.active.data.current as DragData | undefined;
    if (!activeData) return;

    if (activeData.kind === "table") {
      const delta = event.delta;
      const table = tables.find((t) => t.id === activeData.tableId);
      if (!table) return;
      const nextX = Math.max(0, (table.pos_x ?? 80) + delta.x);
      const nextY = Math.max(0, (table.pos_y ?? 80) + delta.y);
      startTransition(() => {
        void updateTablePositionAction(table.id, nextX, nextY).then((res) => {
          if (res.error) setError(res.error);
        });
      });
      return;
    }

    if (activeData.kind === "guest") {
      const overId = String(event.over?.id ?? "");
      let targetTableId: string | null | undefined;
      if (overId === "unassigned") targetTableId = null;
      else if (overId.startsWith("table-drop:")) {
        targetTableId = overId.replace("table-drop:", "");
      } else {
        return;
      }

      startTransition(() => {
        void assignGuestToTableAction(activeData.guestId, targetTableId).then(
          (res) => {
            if (res.error) setError(res.error);
            else setError(null);
          },
        );
      });
    }
  }

  const activeGuest = guests.find((g) => g.id === activeGuestId);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="space-y-4">
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive print:hidden">
            {error}
          </p>
        ) : null}

        <section
          ref={setUnassignedRef}
          className={`border bg-card p-4 print:break-inside-avoid ${
            overUnassigned ? "border-[var(--champagne)]" : "border-border"
          }`}
        >
          <h2 className="font-heading text-2xl">
            Invitați nealocați ({unassigned.length})
          </h2>
          <p className="mt-1 text-xs text-muted-foreground print:hidden">
            Trage invitații pe mese. Trage mesele pe canvas pentru poziționare.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {unassigned.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Toți invitații sunt alocați.
              </p>
            ) : (
              unassigned.map((guest) => (
                <GuestChip key={guest.id} guest={guest} disabled={!canWrite} />
              ))
            )}
          </div>
        </section>

        <div className="relative h-[560px] overflow-auto border border-border bg-[radial-gradient(circle_at_1px_1px,#e8e0d4_1px,transparent_0)] [background-size:24px_24px] print:h-auto print:overflow-visible print:bg-none">
          {tables.map((table) => (
            <TableNode
              key={table.id}
              table={table}
              seated={guestsAtTable(table.id)}
              canWrite={canWrite}
              onSaveMeta={(meta) => {
                startTransition(() => {
                  void updateTableAction({
                    table_id: table.id,
                    ...meta,
                  }).then((res) => {
                    if (res.error) setError(res.error);
                  });
                });
              }}
            />
          ))}
          {tables.length === 0 ? (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Adaugă mese pentru a începe planul vizual.
            </p>
          ) : null}
        </div>
      </div>

      <DragOverlay>
        {activeGuest ? (
          <div className="rounded border border-border bg-background px-2 py-1 text-xs shadow">
            {guestChipLabel(activeGuest)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
