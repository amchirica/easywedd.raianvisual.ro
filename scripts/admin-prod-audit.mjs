/**
 * One-shot schema + platform-admin membership check against production Supabase.
 * Prints ONLY booleans / counts — never secrets or emails.
 *
 * Usage: node scripts/admin-prod-audit.mjs
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

console.log(
  JSON.stringify(
    {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(url),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(anon),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(service),
    },
    null,
    2,
  ),
);

if (!url || !service) {
  console.error("Missing local env for audit");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: adminWorkspaces, error: wsErr } = await admin
  .from("workspaces")
  .select("id, owner_id, workspace_type, status, soft_deleted_at")
  .eq("workspace_type", "admin");

if (wsErr) {
  console.log(JSON.stringify({ workspaces_error: wsErr.code ?? "error", message: wsErr.message }));
  process.exit(1);
}

const activeAdmin = (adminWorkspaces ?? []).filter(
  (w) => w.status === "active" && w.soft_deleted_at == null,
);

const ids = activeAdmin.map((w) => w.id);
const { data: members, error: memErr } = ids.length
  ? await admin
      .from("workspace_members")
      .select("user_id, workspace_id, role, invitation_status")
      .in("workspace_id", ids)
  : { data: [], error: null };

if (memErr) {
  console.log(JSON.stringify({ members_error: memErr.code ?? "error", message: memErr.message }));
  process.exit(1);
}

// Probe function definition via pg? Not available. Call RPC with service role (auth.uid null → false).
const { data: rpcAsService, error: rpcErr } = await admin.rpc("is_platform_admin");

const acceptedAdmins = (members ?? []).filter(
  (m) =>
    m.invitation_status === "accepted" &&
    (m.role === "admin" || m.role === "owner"),
);

const ownerIds = new Set(activeAdmin.map((w) => w.owner_id).filter(Boolean));
const memberUserIds = new Set(acceptedAdmins.map((m) => m.user_id));
const platformAdminCandidates = new Set([...ownerIds, ...memberUserIds]);

// Column probes used by admin pages
const probes = {};
for (const [table, cols] of [
  ["profiles", "id,email,full_name,suspended_at,soft_deleted_at,created_at"],
  [
    "subscriptions",
    "id,workspace_id,plan,plan_key,status,stripe_customer_id,stripe_subscription_id,access_ends_at,soft_deleted_at",
  ],
  ["contracts", "id,title,workspace_id,user_id,status,plan_key,soft_deleted_at"],
  ["access_grants", "id,workspace_id,feature_key,enabled,ends_at,revoked_at"],
  ["feature_entitlements", "workspace_id,feature_key,enabled"],
  ["client_contract_links", "id,package_name,access_plan,access_ends_at"],
]) {
  const { error } = await admin.from(table).select(cols).limit(1);
  probes[table] = error
    ? { ok: false, code: error.code ?? null, message: error.message }
    : { ok: true };
}

console.log(
  JSON.stringify(
    {
      admin_workspaces_total: adminWorkspaces?.length ?? 0,
      admin_workspaces_active: activeAdmin.length,
      accepted_admin_or_owner_members: acceptedAdmins.length,
      platform_admin_candidate_users: platformAdminCandidates.size,
      is_platform_admin_rpc_as_service_role: {
        data: rpcAsService,
        error: rpcErr ? { code: rpcErr.code, message: rpcErr.message } : null,
      },
      note: "RPC as service_role has auth.uid()=null → expect false unless error",
      schema_probes: probes,
    },
    null,
    2,
  ),
);
