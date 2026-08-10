import "server-only";

import { createClient } from "@supabase/supabase-js";

import { logAdminInfo } from "@/lib/admin/log";
import { requireServiceRoleKey, requireSupabasePublicEnv } from "@/lib/env";
import {
  getRuntimeEnvSourceFlags,
  hydrateRuntimeEnvAsync,
  hydrateSupabaseRuntimeEnv,
} from "@/lib/runtime-env";
import type { Database } from "@/types/database";

/**
 * Service-role client. Server-only. Never import from client components.
 * Call only AFTER requirePlatformAdmin() / equivalent user auth check.
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
  const flags = getRuntimeEnvSourceFlags();
  logAdminInfo(
    { route: "/admin", operation: "createAdminClientAsync.hydrate" },
    {
      als: flags.hasAlsContext,
      supabaseUrlPresent: flags.supabaseUrlPresent,
      supabaseAnonPresent: flags.supabaseAnonPresent,
      serviceRolePresent: flags.serviceRolePresent,
    },
  );
  return createAdminClient();
}
