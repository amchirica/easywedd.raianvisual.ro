import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import {
  mapConfirmOtpErrorCode,
  safeAuthNext,
} from "@/lib/auth/confirm-helpers";
import { getSiteUrl } from "@/lib/url";
import type { Database } from "@/types/database";

/**
 * Email confirm + password recovery landing.
 *
 * Free plan (default templates use {{ .ConfirmationURL }}):
 *   → arrives with ?code=…  → exchangeCodeForSession
 *
 * Custom templates (TokenHash), if available:
 *   → arrives with ?token_hash=…&type=… → verifyOtp
 *
 * One link uses one method — never both at once.
 */

function errorRedirect(reason: string) {
  return NextResponse.redirect(
    new URL(`/auth/error?reason=${encodeURIComponent(reason)}`, getSiteUrl()),
  );
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");

  const fallback =
    type === "recovery" ||
    url.searchParams.get("next")?.includes("reset-password")
      ? "/auth/reset-password"
      : "/dashboard";
  const next = safeAuthNext(url.searchParams.get("next"), fallback);
  const origin = getSiteUrl();

  // Never log token_hash or code.
  console.info("[AUTH CONFIRM] start", {
    type: type ?? null,
    next,
    hasTokenHash: Boolean(tokenHash),
    hasCode: Boolean(code),
  });

  if ((!tokenHash || !type) && !code) {
    return errorRedirect("missing_auth_parameters");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.error("[AUTH CONFIRM] missing supabase env");
    return errorRedirect("auth_confirmation_failed");
  }

  let redirectResponse = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient<Database>(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        const location = redirectResponse.headers.get("location") ?? next;
        const rebuilt = NextResponse.redirect(new URL(location, origin));
        cookiesToSet.forEach(({ name, value, options }) => {
          rebuilt.cookies.set(name, value, options);
        });
        redirectResponse = rebuilt;
      },
    },
  });

  let verifyError: { code?: string; message?: string } | null = null;
  let hasSession = false;

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    verifyError = error;
    hasSession = Boolean(data.session);
  } else if (code) {
    // Default Supabase email templates (ConfirmationURL) on Free plan.
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    verifyError = error;
    hasSession = Boolean(data.session);
  }

  if (verifyError || !hasSession) {
    const reason = mapConfirmOtpErrorCode(verifyError?.code);

    console.error("[AUTH CONFIRM]", {
      type: type ?? null,
      errorCode: verifyError?.code ?? null,
      errorMessage: verifyError?.message ?? null,
      hasSession,
      method: tokenHash ? "verifyOtp" : "exchangeCode",
    });

    return errorRedirect(reason);
  }

  // Recovery links must land on reset-password even if next was wrong.
  if (type === "recovery" || next.includes("reset-password")) {
    const recoveryUrl = new URL("/auth/reset-password", origin);
    const recoveryResponse = NextResponse.redirect(recoveryUrl);
    redirectResponse.cookies.getAll().forEach((c) => {
      recoveryResponse.cookies.set(c.name, c.value);
    });
    console.info("[AUTH CONFIRM] ok recovery", { next: "/auth/reset-password" });
    return recoveryResponse;
  }

  console.info("[AUTH CONFIRM] ok", { type: type ?? "pkce", next });
  return redirectResponse;
}
