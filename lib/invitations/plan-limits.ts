import type { SubscriptionPlan } from "@/types/database";

export type InvitationTier = "starter" | "premium" | "pro";

export type InvitationPlanLimits = {
  tier: InvitationTier;
  maxProjects: number;
  maxRecipients: number;
  watermark: boolean;
  allowPdf: boolean;
  allowPremiumTemplates: boolean;
  allowAdvancedAnalytics: boolean;
  allowMultiExport: boolean;
  customDomainReady: boolean;
};

export function tierFromPlan(plan: SubscriptionPlan | null | undefined): InvitationTier {
  if (plan === "agency") return "pro";
  if (plan === "essentials" || plan === "premium") return "premium";
  return "starter";
}

export function getInvitationLimits(
  plan: SubscriptionPlan | null | undefined,
): InvitationPlanLimits {
  const tier = tierFromPlan(plan);

  if (tier === "pro") {
    return {
      tier,
      maxProjects: 50,
      maxRecipients: 5000,
      watermark: false,
      allowPdf: true,
      allowPremiumTemplates: true,
      allowAdvancedAnalytics: true,
      allowMultiExport: true,
      customDomainReady: true,
    };
  }

  if (tier === "premium") {
    return {
      tier,
      maxProjects: 3,
      maxRecipients: 500,
      watermark: false,
      allowPdf: true,
      allowPremiumTemplates: true,
      allowAdvancedAnalytics: true,
      allowMultiExport: true,
      customDomainReady: false,
    };
  }

  return {
    tier: "starter",
    maxProjects: 1,
    maxRecipients: 50,
    watermark: true,
    allowPdf: false,
    allowPremiumTemplates: false,
    allowAdvancedAnalytics: false,
    allowMultiExport: false,
    customDomainReady: false,
  };
}

export function canCreateProject(
  currentCount: number,
  plan: SubscriptionPlan | null | undefined,
) {
  const limits = getInvitationLimits(plan);
  return currentCount < limits.maxProjects;
}
