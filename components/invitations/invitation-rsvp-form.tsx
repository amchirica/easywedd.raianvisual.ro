"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  submitInvitationRsvpAction,
  type InvitationRsvpState,
} from "@/lib/actions/invitation-rsvp";

type InvitationRsvpFormProps = {
  token: string;
  defaults: {
    attendance_count: number;
    children_count: number;
    meal_preference: string;
    allergies: string;
    transport_needed: boolean;
    accommodation_needed: boolean;
  };
  deadline?: string | null;
};

export function InvitationRsvpForm({
  token,
  defaults,
  deadline,
}: InvitationRsvpFormProps) {
  const [state, formAction, pending] = useActionState(
    submitInvitationRsvpAction,
    {} as InvitationRsvpState,
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
      {deadline ? (
        <p className="text-xs text-muted-foreground">
          Termen răspuns: {deadline}
        </p>
      ) : null}
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
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
        <Input name="meal_preference" defaultValue={defaults.meal_preference} />
      </div>
      <div className="space-y-2">
        <Label>Alergii</Label>
        <Input name="allergies" defaultValue={defaults.allergies} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="transport_needed"
          defaultChecked={defaults.transport_needed}
        />
        Am nevoie de transport
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="accommodation_needed"
          defaultChecked={defaults.accommodation_needed}
        />
        Am nevoie de cazare
      </label>
      <div className="space-y-2">
        <Label>Mesaj (opțional)</Label>
        <Input name="message" />
      </div>
      <div className="space-y-2">
        <Label>Email confirmare (opțional)</Label>
        <Input name="confirm_email" type="email" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Se trimite…" : "Trimite RSVP"}
      </Button>
    </form>
  );
}
