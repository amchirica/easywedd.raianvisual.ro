"use client";

import { useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { adminUpdateSubscriptionDatesFormAction } from "@/lib/actions/admin-billing";

/** Controlled dates form — avoids Base UI defaultValue remount warnings. */
export function AdminSubscriptionDatesForm({
  workspaceId,
  accessEndsAt,
  adminNotes,
}: {
  workspaceId: string;
  accessEndsAt: string | null;
  adminNotes: string | null;
}) {
  const { dict } = useI18n();
  const [ends, setEnds] = useState(
    accessEndsAt ? accessEndsAt.slice(0, 10) : "",
  );
  const [notes, setNotes] = useState(adminNotes ?? "");

  return (
    <form
      action={adminUpdateSubscriptionDatesFormAction}
      className="flex flex-wrap items-end gap-2"
    >
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <div className="space-y-1">
        <Label htmlFor={`ends-${workspaceId}`}>{dict.admin.endDate}</Label>
        <input
          id={`ends-${workspaceId}`}
          type="date"
          name="access_ends_at"
          value={ends}
          onChange={(e) => setEnds(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`notes-${workspaceId}`}>{dict.admin.adminReason}</Label>
        <input
          id={`notes-${workspaceId}`}
          name="admin_notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-8 min-w-[180px] rounded-lg border border-input bg-transparent px-2.5 text-sm"
        />
      </div>
      <Button type="submit" size="sm" variant="outline">
        {dict.admin.update}
      </Button>
    </form>
  );
}
