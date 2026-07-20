import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import {
  authCallbackErrorPath,
  getSafeNextPath,
  hasRecoveryAmr,
  isPasswordRecoveryNext,
  PASSWORD_RESET_PATH,
  resolveAuthCallbackDestination,
} from "@/lib/auth/callback-destination";
import { fulfillPendingCheckoutsForUser } from "@/lib/billing/claim-checkout";
import { upsertConsents } from "@/lib/consents";
import { logAuthEvent } from "@/lib/logging/auth-events";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/url";
import type { ConsentType } from "@/types/database";

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

/** Read AMR from JWT payload (post-exchange). Do not log the token. */
function readAmrFromAccessToken(accessToken: string | undefined): unknown {
  if (!accessToken) return undefined;
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2 || !parts[1]) return undefined;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = JSON.parse(
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8"),
    ) as { amr?: unknown };
    return json.amr;
  } catch {
    return undefined;
  }
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const siteUrl = getSiteUrl();

  const requestedNext = searchParams.get("next");
  const defaultNext =
    type === "recovery" ? PASSWORD_RESET_PATH : "/dashboard/onboarding";
  const next = getSafeNextPath(requestedNext, defaultNext);

  logAuthEvent("AUTH_CALLBACK_START", { requestId });

  const supabase = await createClient();
  let exchangeError: { code?: string; message: string } | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) exchangeError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (error) exchangeError = error;
  } else {
    logAuthEvent("AUTH_CALLBACK_EXCHANGE_ERROR", {
      requestId,
      message: "missing_code_or_token",
      ok: false,
    });
    return errorRedirect(siteUrl, "invalid_or_expired_link");
  }

  if (exchangeError) {
    logAuthEvent("AUTH_CALLBACK_EXCHANGE_ERROR", {
      requestId,
      code: exchangeError.code,
      message: exchangeError.message,
      ok: false,
    });
    return errorRedirect(siteUrl, "invalid_or_expired_link");
  }

  logAuthEvent("AUTH_CALLBACK_EXCHANGE_SUCCESS", { requestId, ok: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logAuthEvent("AUTH_CALLBACK_EXCHANGE_ERROR", {
      requestId,
      message: "no_user_after_exchange",
      ok: false,
    });
    return errorRedirect(siteUrl, "invalid_or_expired_link");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  const sessionAmr =
    (sessionData.session &&
    typeof sessionData.session === "object" &&
    "amr" in sessionData.session
      ? (sessionData.session as { amr?: unknown }).amr
      : undefined) ?? readAmrFromAccessToken(accessToken);

  const isRecoverySession =
    type === "recovery" ||
    isPasswordRecoveryNext(next) ||
    hasRecoveryAmr(sessionAmr);

  // Password recovery: skip profile ensure side-effects that aren't needed,
  // never run consents/claim/onboarding routing.
  if (isRecoverySession) {
    logAuthEvent("AUTH_CALLBACK_RECOVERY", { requestId, userId: user.id, ok: true });
    return NextResponse.redirect(new URL(PASSWORD_RESET_PATH, siteUrl));
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
      /* claim is best-effort; onboarding will retry */
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, suspended_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.suspended_at) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${siteUrl}/login?error=account_suspended`,
    );
  }

  const destination = resolveAuthCallbackDestination({
    next,
    onboardingCompleted: profile?.onboarding_completed,
    authType: type,
    isRecoverySession: false,
  });

  return NextResponse.redirect(new URL(destination, siteUrl));
}
