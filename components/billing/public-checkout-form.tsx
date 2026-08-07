"use client";

import { useActionState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
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
  const { dict } = useI18n();
  const [state, action, pending] = useActionState(
    startPublicCheckoutAction,
    {} as PublicCheckoutResult,
  );

  return (
    <form action={action} className="mx-auto max-w-md space-y-4 border border-border bg-card p-6">
      <input type="hidden" name="plan_key" value={planKey} />
      <h1 className="font-heading text-3xl">{dict.billing.checkoutTitle}</h1>
      <p className="text-sm text-muted-foreground">
        {dict.billing.checkoutBody.replace("{plan}", planName)}
      </p>
      <div className="space-y-1">
        <Label htmlFor="email">{dict.common.email}</Label>
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
        {pending
          ? dict.billing.redirecting
          : dict.billing.continueToPayment}
      </Button>
    </form>
  );
}
