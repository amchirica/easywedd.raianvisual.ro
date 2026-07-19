import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const form = await request.formData();
  const password = String(form.get("password") || "");
  const supabase = await createClient();
  const { data: ok } = await supabase.rpc("verify_wedding_site_password", {
    p_slug: slug,
    p_password: password,
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const redirectUrl = `${appUrl}/w/${slug}`;

  if (!ok) {
    return NextResponse.redirect(`${redirectUrl}?error=password`, { status: 303 });
  }

  const cookieStore = await cookies();
  cookieStore.set(`ew_site_${slug}`, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: `/w/${slug}`,
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
