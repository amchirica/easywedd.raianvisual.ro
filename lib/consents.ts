import "server-only";

import { CONSENT_VERSION } from "@/lib/constants";
import type { ConsentType } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  terms: "Termeni și condiții",
  privacy: "Politica de confidențialitate",
  marketing: "Marketing",
  analytics: "Analytics",
  anonymized_industry_research: "Cercetare de piață anonimizată",
};

export function consentTypeLabel(type: string): string {
  return CONSENT_TYPE_LABELS[type as ConsentType] ?? type;
}

type ConsentRow = {
  type: ConsentType;
  granted: boolean;
};

/**
 * Upsert current effective consent (one row per user/workspace/type/version).
 */
export async function upsertConsents(
  supabase: SupabaseClient<Database>,
  userId: string,
  consents: ConsentRow[],
  source: string,
  workspaceId: string | null = null,
) {
  const now = new Date().toISOString();
  const rows = consents.map((consent) => ({
    user_id: userId,
    workspace_id: workspaceId,
    consent_type: consent.type,
    consent_version: CONSENT_VERSION,
    granted: consent.granted,
    granted_at: consent.granted ? now : null,
    revoked_at: consent.granted ? null : now,
    source,
  }));

  const { error } = await supabase.from("user_consents").upsert(rows, {
    onConflict: "user_id,workspace_id,consent_type,consent_version",
  });

  if (error) {
    console.error("[consents:upsert]", {
      code: error.code,
      message: error.message,
    });
  }

  return { error };
}
