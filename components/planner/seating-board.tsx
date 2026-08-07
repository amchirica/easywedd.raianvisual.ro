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
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { ConfirmDeleteButton } from "@/components/planner/confirm-delete-button";
import { useI18n } from "@/components/providers/i18n-provider";
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

type DragData = { kind: "guest"; guestId: string };

const CANVAS_MIN_H = 560;
const TABLE_W = { round: 168, rectangle: 200 } as const;
const TABLE_H = { round: 168, rectangle: 140 } as const;
const DRAG_THRESHOLD = 6;

function guestChipLabel(guest: Guest) {
  return `${guest.first_name} ${guest.last_name}`.trim();
}

/** Spread overlapping defaults into a readable grid. */
function resolveInitialPositions(tables: VenueTable[]): Record<string, { x: number; y: number }> {
  const used = new Map<string, string>();
  const result: Record<string, { x: number; y: number }> = {};
  let autoIndex = 0;

  const sorted = [...tables].sort((a, b) => a.sort_order - b.sort_order);
  for (const table of sorted) {
    let x = Math.max(0, Math.round(table.pos_x ?? 80));
    let y = Math.max(0, Math.round(table.pos_y ?? 80));
    const key = `${x},${y}`;
    if (used.has(key) || (x === 80 && y === 80 && used.size > 0 && autoIndex === 0 && used.has("80,80"))) {
      const col = autoIndex % 3;
      const row = Math.floor(autoIndex / 3);
      x = 24 + col * 220;
      y = 24 + row * 180;
      autoIndex += 1;
    } else if (x === 80 && y === 80) {
      used.set("80,80", table.id);
      autoIndex = Math.max(autoIndex, 1);
    } else {
      used.set(key, table.id);
    }
    // Re-check collision after auto layout
    let guard = 0;
    while ([...Object.values(result)].some((p) => p.x === x && p.y === y) && guard < 40) {
      const col = autoIndex % 3;
      const row = Math.floor(autoIndex / 3);
      x = 24 + col * 220;
      y = 24 + row * 180;
      autoIndex += 1;
      guard += 1;
    }
    result[table.id] = { x, y };
  }
  return result;
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
  position,
  zIndex,
  canvasSize,
  onPositionChange,
  onDragEndPersist,
  onBringFront,
  onSaveMeta,
}: {
  table: VenueTable;
  seated: Guest[];
  canWrite: boolean;
  position: { x: number; y: number };
  zIndex: number;
  canvasSize: { width: number; height: number };
  onPositionChange: (id: string, x: number, y: number) => void;
  onDragEndPersist: (id: string, x: number, y: number) => void;
  onBringFront: (id: string) => void;
  onSaveMeta: (input: {
    label: string;
    shape: "round" | "rectangle";
    capacity: number;
  }) => void;
}) {
  const { dict } = useI18n();
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `table-drop:${table.id}`,
    data: { tableId: table.id },
  });

  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(table.label);
  const [shape, setShape] = useState<"round" | "rectangle">(table.shape);
  const [capacity, setCapacity] = useState(table.capacity);
  const [dragging, setDragging] = useState(false);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const width = TABLE_W[table.shape];
  const height = TABLE_H[table.shape];
  const over = seated.length > table.capacity;

  const clamp = useCallback(
    (x: number, y: number) => {
      const maxX = Math.max(0, canvasSize.width - width);
      const maxY = Math.max(0, canvasSize.height - height);
      return {
        x: Math.min(maxX, Math.max(0, x)),
        y: Math.min(maxY, Math.max(0, y)),
      };
    },
    [canvasSize.width, canvasSize.height, width, height],
  );

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!canWrite) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea, [data-no-drag]")) {
      return;
    }
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    onBringFront(table.id);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
      moved: false,
    };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    const next = clamp(drag.origX + dx, drag.origY + dy);
    onPositionChange(table.id, next.x, next.y);
  }

  function endPointer(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (drag.moved) {
      suppressClickRef.current = true;
      onDragEndPersist(table.id, position.x, position.y);
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    dragRef.current = null;
    setDragging(false);
  }

  useEffect(() => {
    if (!dragging) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [dragging]);

  return (
    <div
      ref={setDropRef}
      role="group"
      aria-label={table.label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      className={`absolute touch-none border bg-card p-3 shadow-sm print:static print:shadow-none print:touch-auto ${
        table.shape === "round" ? "rounded-full" : "rounded-xl"
      } ${isOver ? "ring-2 ring-[var(--champagne)]" : "border-border"} ${
        dragging ? "opacity-90 shadow-md" : ""
      } ${canWrite ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{
        left: position.x,
        top: position.y,
        width,
        height,
        minHeight: height,
        zIndex,
        touchAction: dragging ? "none" : "auto",
      }}
    >
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
        <p className="font-heading text-base pointer-events-none">{table.label}</p>
        <p className="pointer-events-none text-[10px] text-muted-foreground">
          {table.shape === "round"
            ? dict.seating.shapeRound
            : dict.seating.shapeRectangle}{" "}
          · {seated.length}/{table.capacity}
          {over ? ` · ${dict.seating.full}` : ""}
        </p>
        <div
          className="mt-1 flex max-h-16 flex-wrap justify-center gap-1 overflow-hidden"
          data-no-drag
        >
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
          <div
            className="mt-1 flex items-center gap-1 print:hidden"
            data-no-drag
            onClick={(e) => {
              if (suppressClickRef.current) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => {
                if (suppressClickRef.current) return;
                setEditing((v) => !v);
              }}
            >
              {dict.seating.edit}
            </Button>
            <ConfirmDeleteButton id={table.id} action={deleteTableAction} />
          </div>
        ) : null}
      </div>

      {editing && canWrite ? (
        <div
          className="absolute left-0 top-full z-30 mt-2 w-56 space-y-2 border border-border bg-card p-3 text-left shadow-md"
          data-no-drag
        >
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          <select
            className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
            value={shape}
            onChange={(e) =>
              setShape(e.target.value as "round" | "rectangle")
            }
          >
            <option value="round">{dict.seating.shapeRound}</option>
            <option value="rectangle">{dict.seating.shapeRectangle}</option>
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
            {dict.dialog.save}
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
  const { dict } = useI18n();
  const [, startTransition] = useTransition();
  const [activeGuestId, setActiveGuestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Local overrides while dragging / after drag before server refresh */
  const [localPositions, setLocalPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [zStack, setZStack] = useState<string[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: CANVAS_MIN_H });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const basePositions = useMemo(
    () => resolveInitialPositions(tables),
    [tables],
  );

  const positions = useMemo(() => {
    const merged = { ...basePositions };
    for (const [id, pos] of Object.entries(localPositions)) {
      if (merged[id]) merged[id] = pos;
    }
    return merged;
  }, [basePositions, localPositions]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setCanvasSize({
        width: el.clientWidth,
        height: Math.max(CANVAS_MIN_H, el.clientHeight),
      });
    });
    ro.observe(el);
    // Initial measure after layout
    const id = requestAnimationFrame(() => {
      setCanvasSize({
        width: el.clientWidth,
        height: Math.max(CANVAS_MIN_H, el.clientHeight),
      });
    });
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, []);

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

  function zFor(tableId: string) {
    const idx = zStack.indexOf(tableId);
    return idx === -1 ? 10 : 20 + idx;
  }

  function onDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData | undefined;
    if (data?.kind === "guest") setActiveGuestId(data.guestId);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveGuestId(null);
    if (!canWrite) return;

    const activeData = event.active.data.current as DragData | undefined;
    if (!activeData || activeData.kind !== "guest") return;

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
            {dict.seating.unassignedTitle.replace(
              "{count}",
              String(unassigned.length),
            )}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground print:hidden">
            {dict.seating.dragHint}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {unassigned.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {dict.seating.allAssigned}
              </p>
            ) : (
              unassigned.map((guest) => (
                <GuestChip key={guest.id} guest={guest} disabled={!canWrite} />
              ))
            )}
          </div>
        </section>

        <div
          ref={canvasRef}
          className="relative h-[min(70vh,560px)] min-h-[360px] overflow-hidden border border-border bg-[radial-gradient(circle_at_1px_1px,#e8e0d4_1px,transparent_0)] [background-size:24px_24px] sm:h-[560px] print:h-auto print:overflow-visible print:bg-none"
        >
          {tables.map((table) => (
            <TableNode
              key={table.id}
              table={table}
              seated={guestsAtTable(table.id)}
              canWrite={canWrite}
              position={positions[table.id] ?? { x: 24, y: 24 }}
              zIndex={zFor(table.id)}
              canvasSize={canvasSize}
              onBringFront={(id) =>
                setZStack((stack) => [...stack.filter((x) => x !== id), id])
              }
              onPositionChange={(id, x, y) =>
                setLocalPositions((p) => ({ ...p, [id]: { x, y } }))
              }
              onDragEndPersist={(id, x, y) => {
                setLocalPositions((p) => ({ ...p, [id]: { x, y } }));
                startTransition(() => {
                  void updateTablePositionAction(id, x, y).then((res) => {
                    if (res.error) setError(res.error);
                    else {
                      // Server coords take over after revalidation
                      setLocalPositions((p) => {
                        const next = { ...p };
                        delete next[id];
                        return next;
                      });
                    }
                  });
                });
              }}
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
              {dict.seating.addTablesHint}
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
