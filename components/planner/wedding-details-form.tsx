"use client";

import { useActionState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateWeddingDetailsAction,
  type WeddingActionResult,
} from "@/lib/actions/wedding";
import { translateActionError } from "@/lib/i18n/errors";
import { getStatusLabel } from "@/lib/i18n/status-labels";
import { type weddingStatusSchema } from "@/lib/validations/wedding";
import type { Wedding } from "@/types/database";
import type { z } from "zod";

type WeddingDetailsFormProps = {
  wedding: Wedding;
};

const STATUS_VALUES = [
  "planning",
  "confirmed",
  "completed",
  "cancelled",
] as const satisfies ReadonlyArray<z.infer<typeof weddingStatusSchema>>;

export function WeddingDetailsForm({ wedding }: WeddingDetailsFormProps) {
  const { dict, locale } = useI18n();
  const [state, formAction, pending] = useActionState(
    updateWeddingDetailsAction,
    {} as WeddingActionResult,
  );

  return (
    <form action={formAction} className="space-y-4 border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="couple_name_1">{dict.wedding.fields.couple1}</Label>
          <Input
            id="couple_name_1"
            name="couple_name_1"
            required
            defaultValue={wedding.couple_name_1 ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="couple_name_2">{dict.wedding.fields.couple2}</Label>
          <Input
            id="couple_name_2"
            name="couple_name_2"
            required
            defaultValue={wedding.couple_name_2 ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wedding_date">{dict.wedding.fields.date}</Label>
          <Input
            id="wedding_date"
            name="wedding_date"
            type="date"
            defaultValue={wedding.wedding_date ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="city">{dict.wedding.fields.city}</Label>
          <Input id="city" name="city" defaultValue={wedding.city ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="venue_name">{dict.wedding.fields.venue}</Label>
          <Input
            id="venue_name"
            name="venue_name"
            defaultValue={wedding.venue_name ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="estimated_guest_count">
            {dict.wedding.fields.guestCount}
          </Label>
          <Input
            id="estimated_guest_count"
            name="estimated_guest_count"
            type="number"
            min={0}
            defaultValue={wedding.estimated_guest_count ?? 0}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="currency">{dict.wedding.currency}</Label>
          <select
            id="currency"
            name="currency"
            className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
            defaultValue={wedding.currency || "RON"}
          >
            <option value="RON">RON</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="wedding_status">{dict.wedding.fields.status}</Label>
          <select
            id="wedding_status"
            name="wedding_status"
            className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
            defaultValue={wedding.wedding_status}
          >
            {STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel("wedding", status, locale) || status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.error || state.errorCode ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {translateActionError(state.error, state.errorCode, locale)}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-md border border-champagne/40 bg-secondary px-3 py-2 text-sm">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? dict.wedding.saving : dict.wedding.save}
      </Button>
    </form>
  );
}
