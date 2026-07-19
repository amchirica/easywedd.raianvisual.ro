import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { CONSENT_VERSION } from "@/lib/constants";
import { logAuthEvent } from "@/lib/logging/auth-events";
import { createClient } from "@/lib/supabase/server";
import { getSafeNextPath, getSiteUrl } from "@/lib/url";
import type { ConsentType } from "@/types/database";

async function recordPendingConsentsFromMetadata(
  userId: string,
  metadata: Record<string, unknown> | undefined,
) {
  if (!metadata) return;

  const supabase = await createClient();
  const now = new Date().toISOString();
  const marketing = Boolean(metadata.pending_marketing);
  const analytics = Boolean(metadata.pending_analytics);

  const consents: { type: ConsentType; granted: boolean }[] = [
    { type: "terms", granted: true },
    { type: "privacy", granted: true },
    { type: "marketing", granted: marketing },
    { type: "analytics", granted: analytics },
  ];

  const rows = consents.map((consent) => ({
    user_id: userId,
    workspace_id: null as string | null,
    consent_type: consent.type,
    consent_version: CONSENT_VERSION,
    granted: consent.granted,
    granted_at: consent.granted ? now : null,
    revoked_at: consent.granted ? null : now,
    source: "auth_callback",
  }));

  const { error } = await supabase.from("user_consents").insert(rows);
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    console.error("[auth/callback:consents]", {
      code: error.code,
      message: error.message,
    });
  }
}

function resolveDestination(
  next: string,
  onboardingCompleted: boolean | null | undefined,
  authType: string | null,
) {
  if (authType === "recovery") {
    return getSafeNextPath("/auth/update-password", "/auth/update-password");
  }
  if (next.startsWith("/invite/")) return next;
  if (onboardingCompleted) {
    const dest = getSafeNextPath(next, "/dashboard");
    return dest === "/dashboard/onboarding" ? "/dashboard" : dest;
  }
  return "/dashboard/onboarding";
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const siteUrl = getSiteUrl();
  const defaultNext =
    type === "recovery" ? "/auth/update-password" : "/dashboard/onboarding";
  const next = getSafeNextPath(searchParams.get("next"), defaultNext);

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
    return NextResponse.redirect(
      `${siteUrl}/login?error=auth_callback&reason=missing_code`,
    );
  }

  if (exchangeError) {
    logAuthEvent("AUTH_CALLBACK_EXCHANGE_ERROR", {
      requestId,
      code: exchangeError.code,
      message: exchangeError.message,
      ok: false,
    });
    return NextResponse.redirect(
      `${siteUrl}/login?error=auth_callback&reason=exchange_failed`,
    );
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
    return NextResponse.redirect(
      `${siteUrl}/login?error=auth_callback&reason=no_user`,
    );
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

  if (type !== "recovery") {
    await recordPendingConsentsFromMetadata(
      user.id,
      user.user_metadata as Record<string, unknown> | undefined,
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  const destination = resolveDestination(
    next,
    profile?.onboarding_completed,
    type,
  );

  return NextResponse.redirect(`${siteUrl}${destination}`);
}
