"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminUpdateBillingPlanStripeIdsAction,
  type AdminBillingResult,
} from "@/lib/actions/admin-billing";
import {
  isValidStripePriceId,
  isValidStripeProductId,
} from "@/lib/billing/stripe-ids";

export function AdminBillingPlanStripeForm({
  planKey,
  planName,
  stripeProductId,
  stripePriceId,
  stripePriceEnv,
}: {
  planKey: string;
  planName: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  stripePriceEnv: string | null;
}) {
  const [state, action, pending] = useActionState(
    adminUpdateBillingPlanStripeIdsAction,
    {} as AdminBillingResult,
  );

  const productOk =
    !stripeProductId || isValidStripeProductId(stripeProductId);
  const priceOk = !stripePriceId || isValidStripePriceId(stripePriceId);

  return (
    <form
      action={action}
      className="space-y-4 border border-border bg-card p-4"
    >
      <input type="hidden" name="key" value={planKey} />
      <div>
        <h3 className="font-heading text-xl">{planName}</h3>
        <p className="text-xs text-muted-foreground">key: {planKey}</p>
        {stripePriceEnv ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Env fallback: <code>{stripePriceEnv}</code>
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`${planKey}-product`}>Product ID</Label>
          <Input
            id={`${planKey}-product`}
            name="stripe_product_id"
            defaultValue={stripeProductId ?? ""}
            placeholder="prod_…"
            autoComplete="off"
            spellCheck={false}
          />
          <p className="text-xs text-muted-foreground">
            Doar referință catalog. Nu se trimite la Checkout.
          </p>
          {!productOk ? (
            <p className="text-xs text-destructive">
              Trebuie să înceapă cu prod_
            </p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${planKey}-price`}>Price ID</Label>
          <Input
            id={`${planKey}-price`}
            name="stripe_price_id"
            defaultValue={stripePriceId ?? ""}
            placeholder="price_…"
            autoComplete="off"
            spellCheck={false}
            required={Boolean(stripePriceEnv)}
          />
          <p className="text-xs text-muted-foreground">
            Obligatoriu pentru Checkout (price_…).
          </p>
          {!priceOk ? (
            <p className="text-xs text-destructive">
              Trebuie să înceapă cu price_ (nu prod_)
            </p>
          ) : null}
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-muted-foreground">{state.success}</p>
      ) : null}

      <Button type="submit" size="sm" disabled={pending}>
        Salvează ID-uri Stripe
      </Button>
    </form>
  );
}
