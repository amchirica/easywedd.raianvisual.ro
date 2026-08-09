import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requireServiceRoleKey, requireSupabasePublicEnv } from "@/lib/env";
import {
  hydrateRuntimeEnvAsync,
  hydrateSupabaseRuntimeEnv,
} from "@/lib/runtime-env";
import type { Database } from "@/types/database";

/**
 * Service-role client. Server-only. Never import from client components.
 */
export function createAdminClient() {
  hydrateSupabaseRuntimeEnv();
  const { url } = requireSupabasePublicEnv();
  const serviceRoleKey = requireServiceRoleKey();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Prefer this in RSC/actions so Cloudflare async context can populate secrets.
 */
export async function createAdminClientAsync() {
  await hydrateRuntimeEnvAsync();
  return createAdminClient();
}
