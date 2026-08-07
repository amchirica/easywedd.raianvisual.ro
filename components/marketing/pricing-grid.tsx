"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { useI18n } from "@/components/providers/i18n-provider";
import { buttonVariants } from "@/components/ui/button";
import type { BillingPlanRow } from "@/lib/billing/plan-catalog";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { cn } from "@/lib/utils";

function planFeatures(
  plan: BillingPlanRow,
  features: Dictionary["pricing"]["features"],
): string[] {
  const items = [
    features.guests.replace("{n}", String(plan.guest_limit)),
    plan.invitations ? features.invitations : null,
    plan.website_publishing ? features.websitePublic : features.websiteDraft,
    plan.seating ? features.seating : null,
    plan.vendors ? features.vendors : null,
    plan.pdf_export ? features.pdf : null,
    plan.analytics ? features.analytics : null,
  ];
  return items.filter(Boolean) as string[];
}

function planPriceLabel(
  plan: BillingPlanRow,
  common: Dictionary["common"],
): { main: string; suffix?: string } {
  if (plan.billing_type === "grant" || plan.key === "free") {
    return { main: common.free };
  }
  if (plan.billing_type === "one_time") {
    return {
      main: common.oneTime,
      suffix: plan.access_months
        ? common.accessMonths.replace("{n}", String(plan.access_months))
        : undefined,
    };
  }
  if (plan.billing_type === "subscription") {
    return { main: common.subscription, suffix: common.perMonth };
  }
  return { main: plan.name };
}

function ctaHref(plan: BillingPlanRow): string {
  if (plan.billing_type === "grant") return "/register";
  if (plan.billing_type === "subscription" || plan.billing_type === "one_time") {
    return `/checkout/${plan.key}`;
  }
  return "/register";
}

function ctaLabel(plan: BillingPlanRow, common: Dictionary["common"]): string {
  if (plan.key === "free" || plan.billing_type === "grant") return common.start;
  return common.choosePlan;
}

type PricingGridProps = {
  plans: BillingPlanRow[];
};

export function PricingGrid({ plans }: PricingGridProps) {
  const { dict } = useI18n();
  const { common } = dict;
  const featureLabels = dict.pricing.features;

  const display = plans.filter((p) => p.key !== "trial" && p.key !== "pro");
  const highlightedKey =
    display.find((p) => p.key === "premium_pass_12")?.key ??
    display.find((p) => p.key === "starter")?.key;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {display.map((plan) => {
        const highlighted = plan.key === highlightedKey;
        const price = planPriceLabel(plan, common);
        return (
          <div
            key={plan.key}
            className={cn(
              "surface-card relative flex flex-col p-6",
              highlighted && "border-champagne/40 ring-1 ring-champagne/20",
            )}
          >
            {highlighted ? (
              <span className="absolute -top-3 right-6 rounded-full bg-champagne px-3 py-1 text-[0.65rem] font-medium tracking-wide text-primary-foreground">
                {common.recommended}
              </span>
            ) : null}

            <p className="font-heading text-xl font-medium text-foreground">
              {plan.name}
            </p>
            <p className="mt-1.5 min-h-10 text-sm text-muted-foreground">
              {plan.description}
            </p>

            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="font-heading text-3xl font-medium text-champagne">
                {price.main}
              </span>
              {price.suffix ? (
                <span className="text-sm text-muted-soft">{price.suffix}</span>
              ) : null}
            </div>

            <ul className="mt-6 flex-1 space-y-2.5">
              {planFeatures(plan, featureLabels).map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-champagne"
                    aria-hidden
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={ctaHref(plan)}
              className={cn(
                buttonVariants({
                  variant: highlighted ? "default" : "outline",
                }),
                "mt-6 w-full",
                highlighted &&
                  "bg-champagne text-primary-foreground hover:bg-champagne/90",
              )}
            >
              {ctaLabel(plan, common)}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
