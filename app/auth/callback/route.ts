import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { upsertConsents } from "@/lib/consents";
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

function resolveDestination(
  next: string,
  onboardingCompleted: boolean | null | undefined,
  authType: string | null,
) {
  if (authType === "recovery") {
    return "/update-password";
  }
  if (next === "/update-password" || next.startsWith("/update-password?")) {
    return "/update-password";
  }
  if (next.startsWith("/invite/")) return next;
  if (onboardingCompleted) {
    const dest = getSafeNextPath(next, "/dashboard");
    return dest === "/dashboard/onboarding" ? "/dashboard" : dest;
  }
  return "/dashboard/onboarding";
}

function loginErrorRedirect(siteUrl: string, reason: string) {
  return NextResponse.redirect(
    `${siteUrl}/login?error=auth_callback&reason=${encodeURIComponent(reason)}`,
  );
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const siteUrl = getSiteUrl();
  const defaultNext =
    type === "recovery" ? "/update-password" : "/dashboard/onboarding";
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
    return loginErrorRedirect(siteUrl, "missing_code");
  }

  if (exchangeError) {
    logAuthEvent("AUTH_CALLBACK_EXCHANGE_ERROR", {
      requestId,
      code: exchangeError.code,
      message: exchangeError.message,
      ok: false,
    });
    const reason =
      exchangeError.message.toLowerCase().includes("expired") ||
      exchangeError.code === "otp_expired"
        ? "link_expired"
        : "exchange_failed";
    return loginErrorRedirect(siteUrl, reason);
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
    return loginErrorRedirect(siteUrl, "no_user");
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
