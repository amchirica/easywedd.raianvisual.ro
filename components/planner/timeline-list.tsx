"use client";

import { useTransition } from "react";

import { ConfirmDeleteButton } from "@/components/planner/confirm-delete-button";
import { Button } from "@/components/ui/button";
import {
  deleteTimelineItemAction,
  reorderTimelineAction,
} from "@/lib/actions/timeline";
import type { TimelineItem } from "@/types/planner";

type TimelineListProps = {
  items: TimelineItem[];
};

export function TimelineList({ items }: TimelineListProps) {
  const [, startTransition] = useTransition();
  const ordered = [...items].sort((a, b) => a.sort_order - b.sort_order);

  function move(index: number, direction: -1 | 1) {
    const next = [...ordered];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const tmp = next[index]!;
    next[index] = next[target]!;
    next[target] = tmp;
    startTransition(() => {
      void reorderTimelineAction(next.map((i) => i.id));
    });
  }

  return (
    <ol className="space-y-3">
      {ordered.map((item, index) => (
        <li
          key={item.id}
          className="border border-border bg-card p-4 print:break-inside-avoid"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-heading text-xl">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.start_time
                  ? new Date(item.start_time).toLocaleString("ro-RO")
                  : "Oră nesetată"}
                {item.location ? ` · ${item.location}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Vizibilitate: {item.visibility}
                {item.responsible_person
                  ? ` · Responsabil: ${item.responsible_person}`
                  : ""}
              </p>
              {item.notes ? <p className="mt-2 text-sm">{item.notes}</p> : null}
            </div>
            <div className="flex gap-2 print:hidden">
              <Button size="sm" variant="outline" onClick={() => move(index, -1)}>
                Sus
              </Button>
              <Button size="sm" variant="outline" onClick={() => move(index, 1)}>
                Jos
              </Button>
              <ConfirmDeleteButton
                id={item.id}
                action={deleteTimelineItemAction}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
