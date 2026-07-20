import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicCheckoutForm } from "@/components/billing/public-checkout-form";
import { getBillingPlan } from "@/lib/billing/plan-catalog";

export const metadata: Metadata = { title: "Checkout" };

type PageProps = { params: Promise<{ planKey: string }> };

export default async function PublicCheckoutPage({ params }: PageProps) {
  const { planKey } = await params;
  const plan = await getBillingPlan(planKey);
  if (!plan || !plan.is_public || plan.billing_type === "grant") notFound();

  return (
    <div className="min-h-[100svh] bg-[linear-gradient(160deg,#f7f4ef_0%,#fffdf9_50%,#efe8dc_100%)] px-6 py-16">
      <PublicCheckoutForm planKey={plan.key} planName={plan.name} />
    </div>
  );
}
