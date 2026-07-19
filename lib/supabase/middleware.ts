import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/check-email"];
const PUBLIC_PREFIXES = [
  "/",
  "/features",
  "/pricing",
  "/privacy",
  "/terms",
  "/invite",
  "/rsvp",
  "/i",
  "/w",
  "/sitemap-weddings.xml",
  "/auth",
  "/check-email",
];

// /auth/* (callback, update-password) is covered by "/auth" prefix

function isPublicPath(pathname: string) {
  if (AUTH_ROUTES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => {
    if (prefix === "/") return pathname === "/";
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
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

  const { pathname } = request.nextUrl;

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
    // Allow check-email only when unauthenticated; logged-in users go to app
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname.startsWith("/dashboard") && pathname !== "/dashboard/onboarding") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && !profile.onboarding_completed) {
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
