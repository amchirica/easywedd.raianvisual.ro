"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  startPublicCheckoutAction,
  type PublicCheckoutResult,
} from "@/lib/actions/public-checkout";

export function PublicCheckoutForm({
  planKey,
  planName,
}: {
  planKey: string;
  planName: string;
}) {
  const [state, action, pending] = useActionState(
    startPublicCheckoutAction,
    {} as PublicCheckoutResult,
  );

  return (
    <form action={action} className="mx-auto max-w-md space-y-4 border border-border bg-card p-6">
      <input type="hidden" name="plan_key" value={planKey} />
      <h1 className="font-heading text-3xl">Checkout</h1>
      <p className="text-sm text-muted-foreground">
        Plan selectat: <strong>{planName}</strong>. După plată îți creezi sau
        conectezi contul — accesul se activează automat din confirmarea Stripe.
      </p>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@email.com"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Se redirecționează…" : "Continuă spre plată"}
      </Button>
    </form>
  );
}
