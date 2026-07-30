import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { PASSWORD_RESET_PATH } from "@/lib/auth/callback-destination";
import type { Database } from "@/types/database";

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/auth/forgot-password",
  "/auth/login",
  "/check-email",
];
const PUBLIC_PREFIXES = [
  "/",
  "/features",
  "/pricing",
  "/checkout",
  "/privacy",
  "/terms",
  "/invite",
  "/rsvp",
  "/i",
  "/w",
  "/sitemap-weddings.xml",
  "/auth",
  "/check-email",
  "/update-password",
];

function isPublicPath(pathname: string) {
  if (AUTH_ROUTES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => {
    if (prefix === "/") return pathname === "/";
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.includes("-auth-token") ||
        (c.name.startsWith("sb-") && c.name.includes("auth")),
    );
}

function needsSessionWork(pathname: string, request: NextRequest) {
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    return true;
  }
  if (AUTH_ROUTES.includes(pathname)) return true;
  // Refresh session only when an auth cookie exists on public pages.
  return hasSupabaseAuthCookie(request);
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Safety net: Supabase sometimes lands auth params on Site URL (/)
  // when the redirect allow-list is incomplete.
  if (pathname === "/") {
    const params = request.nextUrl.searchParams;
    if (params.has("token_hash") && params.has("type")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/auth/confirm";
      if (!redirectUrl.searchParams.get("next")) {
        redirectUrl.searchParams.set(
          "next",
          params.get("type") === "recovery"
            ? PASSWORD_RESET_PATH
            : "/dashboard",
        );
      }
      return NextResponse.redirect(redirectUrl);
    }
    if (params.has("code")) {
      const redirectUrl = request.nextUrl.clone();
      // Prefer confirm (handles code + token_hash); keep query intact.
      redirectUrl.pathname = "/auth/confirm";
      if (
        !redirectUrl.searchParams.get("next") &&
        redirectUrl.searchParams.get("type") === "recovery"
      ) {
        redirectUrl.searchParams.set("next", PASSWORD_RESET_PATH);
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Never run auth-gate logic on the confirm route before verifyOtp.
  // Keep it public and skip redirect loops for recovery sessions.
  if (pathname === "/auth/confirm" || pathname.startsWith("/auth/confirm/")) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  // Cloudflare-friendly: skip Supabase auth round-trip for anonymous public traffic.
  if (!needsSessionWork(pathname, request) && isPublicPath(pathname)) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && AUTH_ROUTES.includes(pathname)) {
    const nextParam = request.nextUrl.searchParams.get("next");
    const redirectUrl = request.nextUrl.clone();
    if (nextParam?.startsWith("/invite/")) {
      redirectUrl.pathname = nextParam;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, suspended_at, account_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.suspended_at || profile?.account_status === "suspended") {
      await supabase.auth.signOut();
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("error", "account_suspended");
      return NextResponse.redirect(redirectUrl);
    }

    if (
      pathname.startsWith("/dashboard") &&
      pathname !== "/dashboard/onboarding" &&
      pathname !== "/dashboard/pending" &&
      pathname !== "/dashboard/billing" &&
      profile &&
      (profile as { account_status?: string }).account_status === "pending"
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard/pending";
      return NextResponse.redirect(redirectUrl);
    }

    if (
      pathname.startsWith("/dashboard") &&
      pathname !== "/dashboard/onboarding" &&
      profile &&
      !profile.onboarding_completed
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard/onboarding";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (user && pathname.startsWith("/admin")) {
    const { data: isAdmin, error } = await supabase.rpc("is_platform_admin");
    if (error || !isAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (!user && !isPublicPath(pathname)) {
    return supabaseResponse;
  }

  return supabaseResponse;
}
