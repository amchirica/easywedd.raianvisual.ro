"use client";

import { useActionState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminUpdateWeddingAction,
  type AdminActionResult,
} from "@/lib/actions/admin-manage";
import { getStatusLabel } from "@/lib/i18n/status-labels";
import { WEDDING_STATUS_LABELS } from "@/lib/validations/wedding";
import type { Wedding } from "@/types/database";

export function AdminWeddingForm({
  workspaceId,
  wedding,
}: {
  workspaceId: string;
  wedding: Wedding;
}) {
  const { dict, locale } = useI18n();
  const bound = adminUpdateWeddingAction.bind(null, workspaceId);
  const [state, action, pending] = useActionState(bound, {} as AdminActionResult);

  return (
    <form action={action} className="max-w-xl space-y-4 border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>{dict.admin.partner1}</Label>
          <Input name="couple_name_1" defaultValue={wedding.couple_name_1 ?? ""} required />
        </div>
        <div className="space-y-1">
          <Label>{dict.admin.partner2}</Label>
          <Input name="couple_name_2" defaultValue={wedding.couple_name_2 ?? ""} required />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>{dict.admin.date}</Label>
          <Input
            type="date"
            name="wedding_date"
            defaultValue={wedding.wedding_date ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label>{dict.admin.city}</Label>
          <Input name="city" defaultValue={wedding.city ?? ""} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>{dict.admin.venue}</Label>
        <Input name="venue_name" defaultValue={wedding.venue_name ?? ""} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>{dict.admin.estimatedGuests}</Label>
          <Input
            type="number"
            name="estimated_guest_count"
            defaultValue={wedding.estimated_guest_count ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label>{dict.admin.currency}</Label>
          <select
            name="currency"
            defaultValue={wedding.currency ?? "RON"}
            className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
          >
            <option value="RON">RON</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label>{dict.admin.status}</Label>
          <select
            name="wedding_status"
            defaultValue={wedding.wedding_status ?? "planning"}
            className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
          >
            {Object.keys(WEDDING_STATUS_LABELS).map((value) => (
              <option key={value} value={value}>
                {getStatusLabel("wedding", value, locale)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-muted-foreground">{state.success}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? dict.dialog.saving : dict.admin.saveWedding}
      </Button>
    </form>
  );
}
