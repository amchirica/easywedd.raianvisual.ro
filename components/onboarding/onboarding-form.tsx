"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  completeOnboardingAction,
  type OnboardingActionResult,
} from "@/lib/actions/onboarding";

const WORKSPACE_TYPES = [
  { value: "couple", label: "Cuplu" },
  { value: "raian_client", label: "Client Raian Fine Arts" },
  { value: "professional", label: "Profesionist" },
  { value: "agency", label: "Agenție" },
] as const;

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(
    completeOnboardingAction,
    {} as OnboardingActionResult,
  );

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-2xl">Tipul spațiului de lucru</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Alege contextul în care vei folosi EasyWedd.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {WORKSPACE_TYPES.map((type) => (
            <label
              key={type.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition hover:border-champagne"
            >
              <input
                type="radio"
                name="workspace_type"
                value={type.value}
                defaultChecked={type.value === "couple"}
                className="accent-[var(--champagne)]"
                required
              />
              <span className="text-sm font-medium">{type.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-2xl">Detaliile nunții</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Poți completa mai târziu câmpurile opționale.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="workspace_name">Nume workspace</Label>
            <Input
              id="workspace_name"
              name="workspace_name"
              required
              placeholder="Nunta Ana & Mihai"
              defaultValue="Nunta noastră"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="couple_name_1">Partener 1</Label>
            <Input id="couple_name_1" name="couple_name_1" required placeholder="Ana" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="couple_name_2">Partener 2</Label>
            <Input id="couple_name_2" name="couple_name_2" required placeholder="Mihai" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wedding_date">Data nunții</Label>
            <Input id="wedding_date" name="wedding_date" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimated_guest_count">Invitați estimați</Label>
            <Input
              id="estimated_guest_count"
              name="estimated_guest_count"
              type="number"
              min={1}
              placeholder="120"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Oraș</Label>
            <Input id="city" name="city" placeholder="Iași" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue_name">Locație</Label>
            <Input id="venue_name" name="venue_name" placeholder="Sala de evenimente" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-2xl">Invită partenerul</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Opțional — poți invita mai târziu din Setări.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner_email">Email partener</Label>
          <Input
            id="partner_email"
            name="partner_email"
            type="email"
            placeholder="partener@email.com"
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="anonymized_industry_research"
            className="mt-1 size-4 accent-[var(--champagne)]"
          />
          <span>
            Accept ca datele anonimizate să fie folosite pentru cercetare de
            piață în industria nunților. Acest consimțământ este separat de
            Termeni și Confidențialitate.
          </span>
        </label>
      </section>

      {state.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Se creează workspace-ul..." : "Finalizează onboarding"}
      </Button>
    </form>
  );
}
