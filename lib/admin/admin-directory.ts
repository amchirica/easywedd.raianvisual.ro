import "server-only";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { logAdminError } from "@/lib/admin/log";
import { createAdminClientAsync } from "@/lib/supabase/admin";
import type {
  AdminContractOption,
  AdminSubscriptionOption,
  AdminUserOption,
  AdminWorkspaceOption,
} from "@/lib/admin/admin-directory-types";
import type { ContractStatus } from "@/types/database";

export type {
  AdminContractOption,
  AdminSubscriptionOption,
  AdminUserOption,
  AdminWorkspaceOption,
} from "@/lib/admin/admin-directory-types";

async function assertAdminOrThrow() {
  const auth = await requirePlatformAdmin();
  if (!auth.ok || !auth.user) {
    throw new Error(auth.error ?? "Acces admin necesar");
  }
  return auth;
}

export async function listAdminUsersDirectory(options?: {
  q?: string;
  status?: "all" | "active" | "suspended";
  plan?: string;
  workspaceType?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  users: AdminUserOption[];
  total: number;
  page: number;
  pageSize: number;
}> {
  await assertAdminOrThrow();
  const admin = await createAdminClientAsync();
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, options?.pageSize ?? 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = admin
    .from("profiles")
    .select(
      "id, email, full_name, created_at, suspended_at, soft_deleted_at",
      { count: "exact" },
    )
    .is("soft_deleted_at", null)
    .order("created_at", { ascending: false });

  if (options?.q?.trim()) {
    const q = options.q.trim();
    query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
  }
  if (options?.status === "suspended") {
    query = query.not("suspended_at", "is", null);
  } else if (options?.status === "active") {
    query = query.is("suspended_at", null);
  }

  const { data: profiles, count, error } = await query.range(from, to);
  if (error) {
    logAdminError(
      {
        route: "/admin/users",
        operation: "listAdminUsersDirectory.profiles",
      },
      error,
    );
    throw new Error(
      `Nu am putut încărca utilizatorii (${error.code ?? "unknown"}): ${error.message}`,
    );
  }

  const userIds = (profiles ?? []).map((p) => p.id);
  if (!userIds.length) {
    return { users: [], total: count ?? 0, page, pageSize };
  }

  const [{ data: memberships }, lastSignIns] = await Promise.all([
    admin
      .from("workspace_members")
      .select("user_id, workspace_id")
      .in("user_id", userIds)
      .eq("invitation_status", "accepted"),
    fetchLastSignIns(userIds),
  ]);

  const workspaceIds = [
    ...new Set((memberships ?? []).map((m) => m.workspace_id)),
  ];

  const { data: workspaces } =
    workspaceIds.length > 0
      ? await admin
          .from("workspaces")
          .select("id, name, workspace_type, soft_deleted_at")
          .in("id", workspaceIds)
          .is("soft_deleted_at", null)
      : { data: [] };

  const { data: subscriptions } =
    workspaceIds.length > 0
      ? await admin
          .from("subscriptions")
          .select("workspace_id, plan_key, plan, status")
          .in("workspace_id", workspaceIds)
          .is("soft_deleted_at", null)
      : { data: [] };

  const wsById = new Map((workspaces ?? []).map((w) => [w.id, w]));
  const subByWs = new Map((subscriptions ?? []).map((s) => [s.workspace_id, s]));

  let users: AdminUserOption[] = (profiles ?? []).map((p) => {
    const userWs = (memberships ?? [])
      .filter((m) => m.user_id === p.id)
      .map((m) => wsById.get(m.workspace_id))
      .filter(Boolean);

    const activeSub = userWs
      .map((w) => (w ? subByWs.get(w.id) : null))
      .find((s) => s && (s.status === "active" || s.status === "trialing"));

    return {
      id: p.id,
      fullName: p.full_name?.trim() || "Fără nume",
      email: p.email,
      suspended: Boolean(p.suspended_at),
      workspaceCount: userWs.length,
      createdAt: p.created_at,
      lastSignInAt: lastSignIns.get(p.id) ?? null,
      activePlan: activeSub?.plan_key ?? activeSub?.plan ?? null,
    };
  });

  if (options?.plan && options.plan !== "all") {
    users = users.filter((u) => u.activePlan === options.plan);
  }
  if (options?.workspaceType && options.workspaceType !== "all") {
    users = users.filter((u) => {
      const userWs = (memberships ?? [])
        .filter((m) => m.user_id === u.id)
        .map((m) => wsById.get(m.workspace_id))
        .filter(Boolean);
      return userWs.some((w) => w?.workspace_type === options.workspaceType);
    });
  }

  return {
    users,
    total: count ?? users.length,
    page,
    pageSize,
  };
}

export async function listAdminUserOptions(q?: string): Promise<AdminUserOption[]> {
  const result = await listAdminUsersDirectory({
    q,
    status: "all",
    page: 1,
    pageSize: 100,
  });
  return result.users;
}

export async function listWorkspacesForUser(
  userId: string,
): Promise<AdminWorkspaceOption[]> {
  await assertAdminOrThrow();
  const admin = await createAdminClientAsync();

  const { data: memberships } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .eq("invitation_status", "accepted");

  const { data: owned } = await admin
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .is("soft_deleted_at", null);

  const workspaceIds = [
    ...new Set([
      ...(memberships ?? []).map((m) => m.workspace_id),
      ...(owned ?? []).map((w) => w.id),
    ]),
  ];

  if (!workspaceIds.length) return [];

  const { data: workspaces } = await admin
    .from("workspaces")
    .select("id, name, workspace_type, owner_id")
    .in("id", workspaceIds)
    .is("soft_deleted_at", null)
    .order("name");

  const { data: subscriptions } = await admin
    .from("subscriptions")
    .select(
      "id, workspace_id, plan_key, plan, status, access_ends_at, access_source",
    )
    .in("workspace_id", workspaceIds)
    .is("soft_deleted_at", null);

  const { data: plans } = await admin.from("billing_plans").select("key, name");
  const planName = new Map((plans ?? []).map((p) => [p.key, p.name]));
  const subByWs = new Map((subscriptions ?? []).map((s) => [s.workspace_id, s]));

  return (workspaces ?? []).map((w) => {
    const sub = subByWs.get(w.id);
    const planKey = sub?.plan_key ?? sub?.plan ?? null;
    const planLabel = planKey
      ? (planName.get(planKey) ?? planKey)
      : "Fără plan";
    return {
      id: w.id,
      name: w.name,
      workspaceType: w.workspace_type,
      ownerId: w.owner_id,
      planKey,
      planLabel,
      status: sub?.status ?? null,
      accessEndsAt: sub?.access_ends_at ?? null,
      accessSource: sub?.access_source ?? null,
      subscriptionId: sub?.id ?? null,
    };
  });
}

export async function listContractsDirectory(options?: {
  q?: string;
  status?: string;
}): Promise<AdminContractOption[]> {
  await assertAdminOrThrow();
  const admin = await createAdminClientAsync();

  let query = admin
    .from("contracts")
    .select(
      "id, title, workspace_id, user_id, subscription_id, status, plan_key",
    )
    .is("soft_deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status as ContractStatus);
  }
  if (options?.q?.trim()) {
    query = query.ilike("title", `%${options.q.trim()}%`);
  }

  const { data: contracts, error } = await query;
  if (error) {
    logAdminError(
      { route: "/admin/contracts", operation: "listContractsDirectory" },
      error,
    );
    throw new Error(
      `Nu am putut încărca contractele (${error.code ?? "unknown"}): ${error.message}`,
    );
  }
  if (!contracts?.length) return [];

  const workspaceIds = [
    ...new Set(
      contracts
        .map((c) => c.workspace_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const userIds = [
    ...new Set(contracts.map((c) => c.user_id).filter(Boolean) as string[]),
  ];

  const [{ data: workspaces }, { data: profiles }] = await Promise.all([
    workspaceIds.length
      ? admin
          .from("workspaces")
          .select("id, name, owner_id")
          .in("id", workspaceIds)
      : Promise.resolve({
          data: [] as { id: string; name: string; owner_id: string }[],
        }),
    userIds.length
      ? admin.from("profiles").select("id, email").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; email: string }[] }),
  ]);

  const ownerIds = [
    ...new Set(
      (workspaces ?? [])
        .map((w) => w.owner_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const missingOwnerIds = ownerIds.filter((id) => !userIds.includes(id));
  const { data: owners } =
    missingOwnerIds.length > 0
      ? await admin.from("profiles").select("id, email").in("id", missingOwnerIds)
      : { data: [] };

  const wsById = new Map((workspaces ?? []).map((w) => [w.id, w]));
  const emailById = new Map([
    ...(profiles ?? []).map((p) => [p.id, p.email] as const),
    ...(owners ?? []).map((p) => [p.id, p.email] as const),
  ]);

  return contracts.map((c) => {
    const ws = c.workspace_id ? wsById.get(c.workspace_id) : undefined;
    const email =
      (c.user_id ? emailById.get(c.user_id) : null) ??
      (ws?.owner_id ? emailById.get(ws.owner_id) : null) ??
      "—";
    return {
      id: c.id,
      title: c.title ?? "Contract",
      workspaceId: c.workspace_id,
      workspaceName: ws?.name ?? (c.workspace_id ? "Workspace" : "—"),
      clientEmail: email,
      status: c.status,
      planKey: c.plan_key,
      userId: c.user_id,
      subscriptionId: c.subscription_id,
    };
  });
}

export async function listSubscriptionsForWorkspace(
  workspaceId: string,
): Promise<AdminSubscriptionOption[]> {
  await assertAdminOrThrow();
  const admin = await createAdminClientAsync();
  const { data: rows, error } = await admin
    .from("subscriptions")
    .select("id, workspace_id, plan_key, plan, status, access_ends_at")
    .eq("workspace_id", workspaceId)
    .is("soft_deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    logAdminError(
      {
        route: "/admin/subscriptions",
        operation: "listSubscriptionsForWorkspace",
      },
      error,
    );
    throw new Error(
      `Nu am putut încărca abonamentele (${error.code ?? "unknown"}): ${error.message}`,
    );
  }

  const { data: plans } = await admin.from("billing_plans").select("key, name");
  const planName = new Map((plans ?? []).map((p) => [p.key, p.name]));

  return (rows ?? []).map((s) => {
    const planKey = s.plan_key ?? s.plan;
    return {
      id: s.id,
      workspaceId: s.workspace_id,
      planKey,
      planLabel: planName.get(planKey) ?? planKey,
      status: s.status,
      accessEndsAt: s.access_ends_at,
    };
  });
}

async function fetchLastSignIns(
  userIds: string[],
): Promise<Map<string, string | null>> {
  // Avoid N× Auth Admin HTTP calls on list pages (Cloudflare-sensitive).
  const map = new Map<string, string | null>();
  for (const id of userIds) map.set(id, null);
  return map;
}
