import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  getSafeNextPath,
  PASSWORD_RESET_PATH,
} from "@/lib/auth/callback-destination";
import type { Database } from "@/types/database";

/** Routes where an already-signed-in user is sent to dashboard (not recovery). */
const AUTH_ENTRY_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/auth/forgot-password",
  "/auth/login",
  "/check-email",
];

/** Must stay public; never consume tokens or call verifyOtp here. */
const AUTH_PASS_THROUGH = [
  "/auth/confirm",
  "/auth/error",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/callback",
  "/login",
  "/register",
  "/forgot-password",
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
  "/login",
  "/register",
  "/forgot-password",
];

function isPassThroughAuthPath(pathname: string) {
  return AUTH_PASS_THROUGH.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isPublicPath(pathname: string) {
  if (AUTH_ENTRY_ROUTES.includes(pathname)) return true;
  if (isPassThroughAuthPath(pathname)) return true;
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
  if (AUTH_ENTRY_ROUTES.includes(pathname)) return true;
  // Refresh session on reset-password when cookies exist (recovery session).
  if (pathname === PASSWORD_RESET_PATH || pathname.startsWith(`${PASSWORD_RESET_PATH}/`)) {
    return hasSupabaseAuthCookie(request);
  }
  return hasSupabaseAuthCookie(request);
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Safety net on Site URL (/):
  // - token_hash → email confirm (verifyOtp)
  // - code alone → OAuth callback only (never email PKCE on /auth/confirm)
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
    if (params.has("code") && !params.has("token_hash")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/auth/callback";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Do not gate /auth/confirm before verifyOtp runs in the route handler.
  if (pathname === "/auth/confirm" || pathname.startsWith("/auth/confirm/")) {
    return NextResponse.next({ request });
  }

  // Recovery users must reach reset-password; never bounce them to dashboard.
  if (
    pathname === PASSWORD_RESET_PATH ||
    pathname.startsWith(`${PASSWORD_RESET_PATH}/`)
  ) {
    let supabaseResponse = NextResponse.next({ request });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey || !hasSupabaseAuthCookie(request)) {
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
    await supabase.auth.getUser();
    return supabaseResponse;
  }

  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

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

  // Signed-in users on login/register → safe next (admin/dashboard/invite).
  if (user && AUTH_ENTRY_ROUTES.includes(pathname)) {
    const nextParam = request.nextUrl.searchParams.get("next");
    const redirectUrl = request.nextUrl.clone();
    if (nextParam?.startsWith("/invite/")) {
      redirectUrl.pathname = nextParam;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
    // Preserve allowlisted next (e.g. /admin) — do not always force /dashboard.
    const safeNext = getSafeNextPath(nextParam, "/dashboard");
    if (safeNext.startsWith("/")) {
      const [path, query] = safeNext.split("?");
      redirectUrl.pathname = path || "/dashboard";
      redirectUrl.search = query ? `?${query}` : "";
      return NextResponse.redirect(redirectUrl);
    }
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    const isAdminPath = pathname.startsWith("/admin");
    // Profile + admin RPC in parallel on /admin (saves one RTT).
    const [{ data: profile }, adminCheck] = await Promise.all([
      supabase
        .from("profiles")
        .select("onboarding_completed, suspended_at, account_status")
        .eq("id", user.id)
        .maybeSingle(),
      isAdminPath
        ? supabase.rpc("is_platform_admin")
        : Promise.resolve({ data: null as boolean | null, error: null }),
    ]);

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
      !pathname.startsWith("/dashboard/onboarding/") &&
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
      !pathname.startsWith("/dashboard/onboarding/") &&
      profile &&
      !profile.onboarding_completed
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard/onboarding";
      return NextResponse.redirect(redirectUrl);
    }

    if (isAdminPath) {
      const { data: isAdmin, error } = adminCheck;
      if (error || !isAdmin) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/dashboard";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return supabaseResponse;
}
