"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  submitPublicRsvpAction,
  type RsvpActionState,
} from "@/lib/actions/rsvp";

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
        <Label>Răspuns</Label>
        <select
          name="rsvp_status"
          required
          className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
          defaultValue="confirmed"
        >
          <option value="confirmed">Confirm</option>
          <option value="declined">Refuz</option>
          <option value="maybe">Poate</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Adulți</Label>
          <Input
            name="attendance_count"
            type="number"
            min={0}
            defaultValue={defaults.attendance_count}
          />
        </div>
        <div className="space-y-2">
          <Label>Copii</Label>
          <Input
            name="children_count"
            type="number"
            min={0}
            defaultValue={defaults.children_count}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Preferință meniu</Label>
        <Input
          name="meal_preference"
          defaultValue={defaults.meal_preference}
        />
      </div>
      <div className="space-y-2">
        <Label>Alergii</Label>
        <Input name="allergies" defaultValue={defaults.allergies} />
      </div>
      <div className="space-y-2">
        <Label>Mesaj (opțional)</Label>
        <Input name="message" />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Se trimite..." : "Trimite RSVP"}
      </Button>
    </form>
  );
}
