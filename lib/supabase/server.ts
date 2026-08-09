import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabasePublicEnv } from "@/lib/env";
import { hydrateSupabaseRuntimeEnv } from "@/lib/runtime-env";
import type { Database } from "@/types/database";

/**
 * Request-scoped Supabase client. React.cache dedupes within a single RSC/action render.
 * Resolves URL/anon via Cloudflare Worker bindings when process.env is empty.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();
  hydrateSupabaseRuntimeEnv();
  const { url, anonKey } = requireSupabasePublicEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — middleware will refresh session.
        }
      },
    },
  });
});
