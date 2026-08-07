"use client";

import { useActionState, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  completeOnboardingAction,
  type OnboardingActionResult,
} from "@/lib/actions/onboarding";
import { translateValidationMessage } from "@/lib/i18n/errors";

const WORKSPACE_TYPE_VALUES = [
  "couple",
  "raian_client",
  "professional",
  "agency",
] as const;

export function OnboardingForm() {
  const { dict, locale } = useI18n();
  const f = dict.onboardingForm;
  const [state, formAction, pending] = useActionState(
    completeOnboardingAction,
    {} as OnboardingActionResult,
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const serverError = state.error
    ? translateValidationMessage(state.error, locale)
    : null;

  return (
    <form
      action={formAction}
      className="space-y-8 pb-24"
      onSubmit={(event) => {
        setClientError(null);
        const form = event.currentTarget;
        if (!form.checkValidity()) {
          event.preventDefault();
          setClientError(f.requiredHint);
          form.reportValidity();
        }
      }}
    >
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-2xl">{f.workspaceTypeTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {f.workspaceTypeHint}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {WORKSPACE_TYPE_VALUES.map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition hover:border-champagne"
            >
              <input
                type="radio"
                name="workspace_type"
                value={value}
                defaultChecked={value === "couple"}
                className="accent-[var(--champagne)]"
                required
              />
              <span className="text-sm font-medium">{f.types[value]}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-2xl">{f.detailsTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{f.detailsHint}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="workspace_name">{f.workspaceName}</Label>
            <Input
              id="workspace_name"
              name="workspace_name"
              required
              defaultValue="Nunta noastră"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="couple_name_1">{f.partner1} *</Label>
            <Input id="couple_name_1" name="couple_name_1" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="couple_name_2">{f.partner2} *</Label>
            <Input id="couple_name_2" name="couple_name_2" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wedding_date">{f.weddingDate}</Label>
            <Input id="wedding_date" name="wedding_date" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimated_guest_count">{f.estimatedGuests}</Label>
            <Input
              id="estimated_guest_count"
              name="estimated_guest_count"
              type="number"
              min={1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">{f.city}</Label>
            <Input id="city" name="city" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue_name">{f.venue}</Label>
            <Input id="venue_name" name="venue_name" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-2xl">{f.invitePartnerTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {f.invitePartnerHint}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner_email">{f.partnerEmail}</Label>
          <Input id="partner_email" name="partner_email" type="email" />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="anonymized_industry_research"
            className="mt-1 size-4 accent-[var(--champagne)]"
          />
          <span>{f.researchConsent}</span>
        </label>
      </section>

      {clientError || serverError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {clientError ?? serverError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="relative z-10 w-full sm:w-auto"
      >
        {pending ? f.submitting : f.submit}
      </Button>
    </form>
  );
}
