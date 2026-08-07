"use client";

import { useTransition } from "react";

import { ConfirmDeleteButton } from "@/components/planner/confirm-delete-button";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  deleteTimelineItemAction,
  reorderTimelineAction,
} from "@/lib/actions/timeline";
import { formatDateTime } from "@/lib/i18n/format";
import type { TimelineItem } from "@/types/planner";

type TimelineListProps = {
  items: TimelineItem[];
};

export function TimelineList({ items }: TimelineListProps) {
  const { dict, locale } = useI18n();
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
                  ? formatDateTime(item.start_time, locale)
                  : dict.dayTimeline.timeUnset}
                {item.location ? ` · ${item.location}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {dict.dayTimeline.visibility}: {item.visibility}
                {item.responsible_person
                  ? ` · ${dict.dayTimeline.responsible}: ${item.responsible_person}`
                  : ""}
              </p>
              {item.notes ? <p className="mt-2 text-sm">{item.notes}</p> : null}
            </div>
            <div className="flex gap-2 print:hidden">
              <Button size="sm" variant="outline" onClick={() => move(index, -1)}>
                {dict.dayTimeline.moveUp}
              </Button>
              <Button size="sm" variant="outline" onClick={() => move(index, 1)}>
                {dict.dayTimeline.moveDown}
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
