import { NextResponse } from "next/server";

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

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const siteUrl = getSiteUrl();
  const next = getSafeNextPath(
    searchParams.get("next"),
    "/dashboard/onboarding",
  );

  logAuthEvent("AUTH_CALLBACK_START", { requestId });

  if (!code) {
    logAuthEvent("AUTH_CALLBACK_EXCHANGE_ERROR", {
      requestId,
      message: "missing_code",
      ok: false,
    });
    return NextResponse.redirect(
      `${siteUrl}/login?error=auth_callback&reason=missing_code`,
    );
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

  await recordPendingConsentsFromMetadata(
    user.id,
    user.user_metadata as Record<string, unknown> | undefined,
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  let destination = next;
  if (next.startsWith("/invite/")) {
    destination = next;
  } else if (profile?.onboarding_completed) {
    destination = getSafeNextPath(next, "/dashboard");
    if (destination === "/dashboard/onboarding") {
      destination = "/dashboard";
    }
  } else {
    destination = "/dashboard/onboarding";
  }

  return NextResponse.redirect(`${siteUrl}${destination}`);
}
