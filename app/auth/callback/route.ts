import { NextResponse } from "next/server";

import {
  authCallbackErrorPath,
  getSafeNextPath,
} from "@/lib/auth/callback-destination";
import { fulfillPendingCheckoutsForUser } from "@/lib/billing/claim-checkout";
import { upsertConsents } from "@/lib/consents";
import { logAuthEvent } from "@/lib/logging/auth-events";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/url";
import type { ConsentType } from "@/types/database";

/**
 * OAuth / PKCE only (`?code=`).
 * Email confirm + password recovery use `/auth/confirm` (token_hash + verifyOtp).
 * This route must NOT call verifyOtp or accept token_hash.
 */

async function recordPendingConsentsFromMetadata(
  userId: string,
  metadata: Record<string, unknown> | undefined,
) {
  if (!metadata) return;

  const supabase = await createClient();
  const marketing = Boolean(metadata.pending_marketing);
  const analytics = Boolean(metadata.pending_analytics);

  const consents: { type: ConsentType; granted: boolean }[] = [
    { type: "terms", granted: true },
    { type: "privacy", granted: true },
    { type: "marketing", granted: marketing },
    { type: "analytics", granted: analytics },
  ];

  await upsertConsents(supabase, userId, consents, "auth_callback", null);
}

function errorRedirect(siteUrl: string, reason: string) {
  return NextResponse.redirect(`${siteUrl}${authCallbackErrorPath(reason)}`);
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const siteUrl = getSiteUrl();
  const next = getSafeNextPath(searchParams.get("next"), "/dashboard");

  // Reject email OTP params — wrong endpoint.
  if (searchParams.get("token_hash")) {
    logAuthEvent("AUTH_CALLBACK_EXCHANGE_ERROR", {
      requestId,
      message: "token_hash_must_use_auth_confirm",
      ok: false,
    });
    return errorRedirect(siteUrl, "missing_auth_parameters");
  }

  logAuthEvent("AUTH_CALLBACK_START", { requestId, message: "oauth_pkce" });

  if (!code) {
    logAuthEvent("AUTH_CALLBACK_EXCHANGE_ERROR", {
      requestId,
      message: "missing_code",
      ok: false,
    });
    return errorRedirect(siteUrl, "missing_auth_parameters");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logAuthEvent("AUTH_CALLBACK_EXCHANGE_ERROR", {
      requestId,
      code: error.code,
      message: error.message,
      ok: false,
    });
    console.error("[auth:callback:exchange]", {
      requestId,
      code: error.code ?? null,
      message: error.message,
    });
    const reason = error.code || "auth_confirmation_failed";
    return errorRedirect(siteUrl, reason);
  }

  logAuthEvent("AUTH_CALLBACK_EXCHANGE_SUCCESS", { requestId, ok: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorRedirect(siteUrl, "auth_confirmation_failed");
  }

  const { error: profileError } = await supabase.rpc("ensure_own_profile");
  if (profileError) {
    logAuthEvent("PROFILE_ENSURE_ERROR", {
      requestId,
      userId: user.id,
      code: profileError.code,
      message: profileError.message,
      ok: false,
    });
  } else {
    logAuthEvent("PROFILE_ENSURE_SUCCESS", {
      requestId,
      userId: user.id,
      ok: true,
    });
  }

  await recordPendingConsentsFromMetadata(
    user.id,
    user.user_metadata as Record<string, unknown> | undefined,
  );

  if (user.email) {
    try {
      await fulfillPendingCheckoutsForUser({
        userId: user.id,
        email: user.email,
        claimToken:
          searchParams.get("claim") ||
          (typeof user.user_metadata?.pending_claim_token === "string"
            ? user.user_metadata.pending_claim_token
            : null),
      });
    } catch {
      /* best-effort */
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, suspended_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.suspended_at) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${siteUrl}/login?error=account_suspended`);
  }

  const destination =
    next.startsWith("/invite/")
      ? next
      : profile?.onboarding_completed
        ? next === "/dashboard/onboarding"
          ? "/dashboard"
          : next
        : "/dashboard/onboarding";

  return NextResponse.redirect(new URL(destination, siteUrl));
}
