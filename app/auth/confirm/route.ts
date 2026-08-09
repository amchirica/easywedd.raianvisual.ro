import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import {
  mapConfirmOtpErrorCode,
  safeAuthNext,
} from "@/lib/auth/confirm-helpers";
import { getRuntimeEnv, hydrateRuntimeEnvAsync } from "@/lib/runtime-env";
import { getSiteUrl } from "@/lib/url";
import type { Database } from "@/types/database";

/**
 * Email confirm / recovery / invite / magiclink.
 * EXCLUSIVELY token_hash + verifyOtp — works across Gmail/Safari/in-app browsers.
 * Never call exchangeCodeForSession here (PKCE verifier is browser-bound).
 * OAuth PKCE uses /auth/callback only.
 */

function errorRedirect(reason: string) {
  return NextResponse.redirect(
    new URL(`/auth/error?reason=${encodeURIComponent(reason)}`, getSiteUrl()),
  );
}

function tokenFingerprint(tokenHash: string): string {
  if (tokenHash.length <= 8) return "[short]";
  return `${tokenHash.slice(0, 4)}…${tokenHash.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const origin = getSiteUrl();

  const fallback =
    type === "recovery" ||
    (searchParams.get("next") ?? "").includes("reset-password")
      ? "/auth/reset-password"
      : "/dashboard";
  const next = safeAuthNext(searchParams.get("next"), fallback);

  if (process.env.NODE_ENV !== "production") {
    console.info("[AUTH CONFIRM] start", {
      type: type ?? null,
      next,
      hasTokenHash: Boolean(tokenHash),
      tokenFingerprint: tokenHash ? tokenFingerprint(tokenHash) : null,
      hasCode: Boolean(code),
    });
  }

  // Legacy ConfirmationURL (?code=) cannot work cross-browser — do not exchange.
  if (code && !tokenHash) {
    console.error("[AUTH CONFIRM] rejected PKCE code — update email templates to TokenHash", {
      type: type ?? null,
    });
    return errorRedirect("pkce_code_verifier_not_found");
  }

  if (!tokenHash || !type) {
    console.error("[AUTH CONFIRM] missing token_hash or type", {
      hasTokenHash: Boolean(tokenHash),
      type: type ?? null,
    });
    return errorRedirect("missing_token");
  }

  await hydrateRuntimeEnvAsync([
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SITE_URL",
  ]);
  const supabaseUrl = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    console.error("[AUTH CONFIRM] missing supabase env");
    return errorRedirect("auth_confirmation_failed");
  }

  // Recovery keeps going straight to the password form.
  // Email confirm shows a success page first (UI only), then continues to `next`.
  const destination =
    type === "recovery"
      ? "/auth/reset-password"
      : `/auth/confirmed?next=${encodeURIComponent(
          next.startsWith("/") ? next : "/dashboard/onboarding",
        )}`;

  let redirectResponse = NextResponse.redirect(new URL(destination, origin));

  // Bind cookies to the redirect response (required on OpenNext / Cloudflare).
  const supabase = createServerClient<Database>(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        const location =
          redirectResponse.headers.get("location") ?? destination;
        const rebuilt = NextResponse.redirect(new URL(location, origin));
        cookiesToSet.forEach(({ name, value, options }) => {
          rebuilt.cookies.set(name, value, options);
        });
        redirectResponse = rebuilt;
      },
    },
  });

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error || !data.session) {
    const reason = mapConfirmOtpErrorCode(error?.code);
    console.error("[AUTH CONFIRM] verifyOtp error", {
      type,
      errorCode: error?.code ?? null,
      errorMessage: error?.message ?? null,
      hasSession: Boolean(data.session),
    });
    return errorRedirect(reason);
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[AUTH CONFIRM] verifyOtp success", {
      type,
      destination,
      userId: data.user?.id ?? data.session.user.id,
    });
  }

  return redirectResponse;
}
