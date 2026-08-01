"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { trackProductEvent } from "@/lib/analytics/product";
import { fulfillPendingCheckoutsForUser } from "@/lib/billing/claim-checkout";
import { CONSENT_VERSION, TRIAL_DAYS } from "@/lib/constants";
import { processWorkspaceEmailOutbox } from "@/lib/emails/outbox";
import { sendTemplatedEmail } from "@/lib/emails/send";
import { logAuthEvent } from "@/lib/logging/auth-events";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/url";
import { onboardingSchema } from "@/lib/validations/onboarding";
import {
  setActiveWorkspaceId,
  uniqueWorkspaceSlug,
} from "@/lib/workspace";
import type { Json } from "@/types/database";

export type OnboardingActionResult = {
  error?: string;
  warning?: string;
};

type OnboardingRpcResult = {
  workspace_id: string;
  wedding_id: string;
  reused?: boolean;
  partner_invite?: {
    invitation_id?: string;
    reused?: boolean;
    error?: string;
  } | null;
};

function userFacingError(message?: string): string {
  const msg = message ?? "";
  if (msg.includes("not_authenticated")) {
    return "Sesiunea a expirat. Autentifică-te din nou.";
  }
  if (msg.includes("profile_missing") || msg.includes("workspaces_owner_id_fkey")) {
    return "Nu am putut crea spațiul de lucru. Contul tău există, dar profilul nu a fost inițializat corect. Încearcă din nou.";
  }
  if (msg.includes("workspace_slug_taken")) {
    return "Numele spațiului de lucru este deja folosit. Încearcă din nou.";
  }
  if (msg.includes("ambiguous")) {
    return "Nu am putut crea spațiul de lucru din cauza unei erori interne. Reîncearcă după ce migrările sunt aplicate.";
  }
  return "Nu am putut finaliza onboarding-ul. Încearcă din nou.";
}

export async function completeOnboardingAction(
  _prev: OnboardingActionResult,
  formData: FormData,
): Promise<OnboardingActionResult> {
  const requestId = crypto.randomUUID();
  const guestCountRaw = String(formData.get("estimated_guest_count") ?? "").trim();
  const partnerEmailRaw = String(formData.get("partner_email") ?? "").trim();
  const parsed = onboardingSchema.safeParse({
    workspace_type: formData.get("workspace_type"),
    workspace_name: formData.get("workspace_name"),
    couple_name_1: formData.get("couple_name_1"),
    couple_name_2: formData.get("couple_name_2"),
    wedding_date: String(formData.get("wedding_date") || "") || undefined,
    city: String(formData.get("city") || "") || undefined,
    venue_name: String(formData.get("venue_name") || "") || undefined,
    estimated_guest_count: guestCountRaw ? Number(guestCountRaw) : undefined,
    partner_email: partnerEmailRaw || undefined,
    anonymized_industry_research:
      formData.get("anonymized_industry_research") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logAuthEvent("ONBOARDING_START", {
      requestId,
      code: authError?.code,
      message: authError?.message ?? "no user",
      ok: false,
    });
    return { error: userFacingError("not_authenticated") };
  }

  logAuthEvent("ONBOARDING_START", {
    requestId,
    userId: user.id,
    ok: true,
  });

  const { error: ensureError } = await supabase.rpc("ensure_own_profile");
  if (ensureError) {
    logAuthEvent("PROFILE_ENSURE_ERROR", {
      requestId,
      userId: user.id,
      code: ensureError.code,
      message: ensureError.message,
      ok: false,
    });
    return { error: userFacingError("profile_missing") };
  }
  logAuthEvent("PROFILE_ENSURE_SUCCESS", {
    requestId,
    userId: user.id,
    ok: true,
  });

  const data = parsed.data;
  let slug = await uniqueWorkspaceSlug(
    `${data.couple_name_1}-${data.couple_name_2}`,
  );

  const guestCount =
    typeof data.estimated_guest_count === "number"
      ? data.estimated_guest_count
      : null;

  const siteUrl = getSiteUrl();

  async function runCreate(nextSlug: string) {
    return supabase.rpc("create_onboarding_workspace", {
      p_workspace_name: data.workspace_name,
      p_slug: nextSlug,
      p_workspace_type: data.workspace_type,
      p_couple_name_1: data.couple_name_1,
      p_couple_name_2: data.couple_name_2,
      p_wedding_date: data.wedding_date || null,
      p_city: data.city || null,
      p_venue_name: data.venue_name || null,
      p_estimated_guest_count: guestCount,
      p_anonymized_industry_research: data.anonymized_industry_research,
      p_consent_version: CONSENT_VERSION,
      p_trial_days: TRIAL_DAYS,
      p_partner_email: data.partner_email
        ? data.partner_email.trim().toLowerCase()
        : null,
      p_site_url: siteUrl,
    });
  }

  let { data: rpcData, error: rpcError } = await runCreate(slug);

  if (rpcError?.message?.includes("workspace_slug_taken")) {
    slug = await uniqueWorkspaceSlug(
      `${data.couple_name_1}-${data.couple_name_2}-${Date.now().toString(36)}`,
    );
    ({ data: rpcData, error: rpcError } = await runCreate(slug));
  }

  if (rpcError || !rpcData) {
    logAuthEvent("ONBOARDING_RPC_ERROR", {
      requestId,
      userId: user.id,
      code: rpcError?.code,
      message: rpcError?.message ?? "empty",
      ok: false,
    });
    return { error: userFacingError(rpcError?.message) };
  }

  const result = rpcData as OnboardingRpcResult;
  logAuthEvent("ONBOARDING_RPC_SUCCESS", {
    requestId,
    userId: user.id,
    workspaceId: result.workspace_id,
    ok: true,
  });

  const workspaceId = result.workspace_id;
  const weddingId = result.wedding_id;

  const { error: seedBudgetError } = await supabase.rpc(
    "seed_default_budget_categories",
    {
      p_workspace_id: workspaceId,
      p_wedding_id: weddingId,
    },
  );
  if (seedBudgetError) {
    console.error("[onboarding:seed_budget]", {
      code: seedBudgetError.code,
      message: seedBudgetError.message,
      userId: user.id,
    });
  }

  const { error: seedTasksError } = await supabase.rpc(
    "seed_wedding_task_template",
    {
      p_workspace_id: workspaceId,
      p_wedding_id: weddingId,
      p_wedding_date: data.wedding_date || null,
    },
  );
  if (seedTasksError) {
    console.error("[onboarding:seed_tasks]", {
      code: seedTasksError.code,
      message: seedTasksError.message,
      userId: user.id,
    });
  }

  let partnerWarning: string | undefined;

  if (data.partner_email) {
    const inviteMeta = result.partner_invite;
    if (inviteMeta && !inviteMeta.error) {
      logAuthEvent("PARTNER_INVITE_CREATED", {
        requestId,
        userId: user.id,
        workspaceId,
        ok: true,
        message: inviteMeta.reused ? "reused" : "created",
      });

      const outboxResult = await processWorkspaceEmailOutbox(workspaceId);
      if (outboxResult.failed > 0 && outboxResult.sent === 0) {
        partnerWarning =
          "Spațiul de lucru a fost creat, dar invitația către partener nu a putut fi trimisă. O poți retrimite din Setări.";
      }
    } else if (inviteMeta?.error) {
      partnerWarning =
        "Spațiul de lucru a fost creat, dar invitația către partener nu a putut fi creată. Poți invita din Setări.";
      logAuthEvent("PARTNER_INVITE_CREATED", {
        requestId,
        userId: user.id,
        workspaceId,
        ok: false,
        message: inviteMeta.error,
      });
    }
  }

  if (!result.reused) {
    await trackProductEvent("workspace_created", {
      workspaceId,
      userId: user.id,
      properties: { workspace_type: data.workspace_type },
    });
    await trackProductEvent("wedding_created", {
      workspaceId,
      userId: user.id,
      properties: {},
    });
  }

  await trackProductEvent("onboarding_completed", {
    workspaceId,
    userId: user.id,
    properties: { reused: Boolean(result.reused) },
  });

  if (user.email) {
    await sendTemplatedEmail("welcome", {
      to: user.email,
      userId: user.id,
      vars: { name: data.couple_name_1 },
    });
  }

  await supabase.from("audit_logs").insert({
    workspace_id: workspaceId,
    user_id: user.id,
    action: "onboarding.completed",
    entity_type: "workspace",
    entity_id: workspaceId,
    metadata: {
      reused: Boolean(result.reused),
      partner_warning: partnerWarning ?? null,
    } as Json,
  });

  await setActiveWorkspaceId(workspaceId);

  if (user.email) {
    try {
      await fulfillPendingCheckoutsForUser({
        userId: user.id,
        email: user.email,
        workspaceId,
      });
    } catch {
      /* paid claim retry is non-blocking */
    }
  }

  if (partnerWarning) {
    const cookieStore = await cookies();
    cookieStore.set("ew_onboarding_warning", partnerWarning, {
      httpOnly: true,
      sameSite: "lax",
      secure: getSiteUrl().startsWith("https"),
      path: "/",
      maxAge: 120,
    });
    console.warn("[onboarding:partner_warning]", {
      userId: user.id,
      workspaceId,
    });
  }

  redirect("/dashboard/onboarding/success");
}
