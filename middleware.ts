import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Skip static assets and public metadata files — no auth work needed.
     * Keep all app routes (including /auth/*) so session refresh still runs
     * where cookies exist.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon\\.png|apple-icon\\.png|site\\.webmanifest|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
