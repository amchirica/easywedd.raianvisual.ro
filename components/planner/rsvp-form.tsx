"use client";

import { useActionState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  submitPublicRsvpAction,
  type RsvpActionState,
} from "@/lib/actions/rsvp";
import { getStatusLabel } from "@/lib/i18n/status-labels";

type RsvpFormProps = {
  token: string;
  defaults: {
    attendance_count: number;
    children_count: number;
    meal_preference: string;
    allergies: string;
  };
};

export function RsvpForm({ token, defaults }: RsvpFormProps) {
  const { dict, locale } = useI18n();
  const [state, formAction, pending] = useActionState(
    submitPublicRsvpAction,
    {} as RsvpActionState,
  );

  if (state.success) {
    return (
      <p className="rounded-md border border-champagne/40 bg-secondary px-3 py-3 text-sm">
        {state.success}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label>{dict.publicUi.rsvpResponse}</Label>
        <select
          name="rsvp_status"
          required
          className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
          defaultValue="confirmed"
        >
          <option value="confirmed">
            {getStatusLabel("rsvp", "confirmed", locale) ||
              dict.publicUi.rsvpConfirm}
          </option>
          <option value="declined">
            {getStatusLabel("rsvp", "declined", locale) ||
              dict.publicUi.rsvpDecline}
          </option>
          <option value="maybe">
            {getStatusLabel("rsvp", "maybe", locale) || dict.publicUi.rsvpMaybe}
          </option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{dict.publicUi.rsvpAdults}</Label>
          <Input
            name="attendance_count"
            type="number"
            min={0}
            defaultValue={defaults.attendance_count}
          />
        </div>
        <div className="space-y-2">
          <Label>{dict.publicUi.rsvpChildren}</Label>
          <Input
            name="children_count"
            type="number"
            min={0}
            defaultValue={defaults.children_count}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{dict.publicUi.rsvpMealPreference}</Label>
        <Input
          name="meal_preference"
          defaultValue={defaults.meal_preference}
        />
      </div>
      <div className="space-y-2">
        <Label>{dict.publicUi.rsvpAllergies}</Label>
        <Input name="allergies" defaultValue={defaults.allergies} />
      </div>
      <div className="space-y-2">
        <Label>{dict.publicUi.rsvpMessageOptional}</Label>
        <Input name="message" />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? dict.publicUi.rsvpSubmitting : dict.publicUi.rsvpSubmitShort}
      </Button>
    </form>
  );
}
