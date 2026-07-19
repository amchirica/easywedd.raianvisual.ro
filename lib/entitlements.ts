import { DEFAULT_FEATURE_KEYS } from "@/lib/constants";
import type { Database } from "@/types/database";

type FeatureEntitlementInsert =
  Database["public"]["Tables"]["feature_entitlements"]["Insert"];

const ENABLED_ON_CREATE = new Set([
  "planner",
  "guests",
  "budget",
  "vendors",
  "invitations",
  "website",
  "guest_limit",
  "invitation_projects",
  "collaborator_limit",
  "storage_limit",
  "wedding_limit",
]);

export function buildDefaultEntitlements(
  workspaceId: string,
): FeatureEntitlementInsert[] {
  return DEFAULT_FEATURE_KEYS.map((feature_key) => ({
    workspace_id: workspaceId,
    feature_key,
    enabled: ENABLED_ON_CREATE.has(feature_key),
    usage_limit:
      feature_key === "invitations" || feature_key === "invitation_projects"
        ? 1
        : feature_key === "guest_limit"
          ? 50
          : feature_key === "collaborator_limit"
            ? 2
            : feature_key === "storage_limit"
              ? 500
              : feature_key === "wedding_limit"
                ? 1
                : 0,
    usage_value: 0,
  }));
}
