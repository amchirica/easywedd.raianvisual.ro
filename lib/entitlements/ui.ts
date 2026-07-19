import {
  isFeatureEnabled,
  getUsageLimit,
  type EntitlementRow,
} from "@/lib/entitlements/service";
import type { EntitlementKey } from "@/lib/entitlements/keys";

export function featureFlagsForUi(rows: EntitlementRow[]) {
  const flag = (key: EntitlementKey, fallback = false) =>
    isFeatureEnabled(rows, key, fallback);

  return {
    canPublishWebsite: flag("website_publish"),
    canUseWebsite: flag("website"),
    canExportPdf: flag("pdf_export"),
    canRemoveBranding: flag("remove_branding"),
    canUseCustomDomain: flag("custom_domain"),
    canUsePremiumTemplates: flag("premium_templates"),
    canViewAnalytics: flag("analytics"),
    canWhiteLabel: flag("white_label"),
    guestLimit: getUsageLimit(rows, "guest_limit"),
    invitationProjectLimit: getUsageLimit(rows, "invitation_projects"),
    collaboratorLimit: getUsageLimit(rows, "collaborator_limit"),
  };
}
