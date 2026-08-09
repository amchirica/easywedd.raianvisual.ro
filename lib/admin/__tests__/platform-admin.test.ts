import { describe, expect, it } from "vitest";

/**
 * Documents the single platform-admin rule used by SQL + app gates.
 * Mirrors public.is_platform_admin() (migration 20260719000022).
 */
function isPlatformAdminFromRows(input: {
  userId: string;
  workspaces: Array<{
    id: string;
    owner_id: string;
    workspace_type: string;
    status: string;
    soft_deleted_at: string | null;
  }>;
  members: Array<{
    user_id: string;
    workspace_id: string;
    role: string;
    invitation_status: string;
  }>;
}): boolean {
  const viaMembership = input.members.some((m) => {
    if (m.user_id !== input.userId) return false;
    if (m.invitation_status !== "accepted") return false;
    if (m.role !== "admin" && m.role !== "owner") return false;
    const w = input.workspaces.find((ws) => ws.id === m.workspace_id);
    if (!w) return false;
    return (
      w.workspace_type === "admin" &&
      w.status === "active" &&
      w.soft_deleted_at == null
    );
  });

  const viaOwnership = input.workspaces.some(
    (w) =>
      w.owner_id === input.userId &&
      w.workspace_type === "admin" &&
      w.status === "active" &&
      w.soft_deleted_at == null,
  );

  return viaMembership || viaOwnership;
}

describe("platform admin rule", () => {
  const adminWs = {
    id: "ws-admin",
    owner_id: "user-owner",
    workspace_type: "admin",
    status: "active",
    soft_deleted_at: null as string | null,
  };
  const coupleWs = {
    id: "ws-couple",
    owner_id: "user-couple",
    workspace_type: "couple",
    status: "active",
    soft_deleted_at: null as string | null,
  };

  it("accepts accepted admin member of admin workspace", () => {
    expect(
      isPlatformAdminFromRows({
        userId: "user-admin",
        workspaces: [adminWs],
        members: [
          {
            user_id: "user-admin",
            workspace_id: "ws-admin",
            role: "admin",
            invitation_status: "accepted",
          },
        ],
      }),
    ).toBe(true);
  });

  it("accepts owner of admin workspace without member row", () => {
    expect(
      isPlatformAdminFromRows({
        userId: "user-owner",
        workspaces: [adminWs],
        members: [],
      }),
    ).toBe(true);
  });

  it("rejects couple workspace owners", () => {
    expect(
      isPlatformAdminFromRows({
        userId: "user-couple",
        workspaces: [coupleWs],
        members: [
          {
            user_id: "user-couple",
            workspace_id: "ws-couple",
            role: "owner",
            invitation_status: "accepted",
          },
        ],
      }),
    ).toBe(false);
  });

  it("rejects soft-deleted admin workspace", () => {
    expect(
      isPlatformAdminFromRows({
        userId: "user-owner",
        workspaces: [{ ...adminWs, soft_deleted_at: "2026-01-01T00:00:00Z" }],
        members: [],
      }),
    ).toBe(false);
  });

  it("rejects pending invitations", () => {
    expect(
      isPlatformAdminFromRows({
        userId: "user-admin",
        workspaces: [adminWs],
        members: [
          {
            user_id: "user-admin",
            workspace_id: "ws-admin",
            role: "admin",
            invitation_status: "pending",
          },
        ],
      }),
    ).toBe(false);
  });
});

describe("admin incomplete data resilience", () => {
  it("maps contract rows with null workspace/user without throw", () => {
    const contracts = [
      {
        id: "c1",
        title: null as string | null,
        workspace_id: null as string | null,
        user_id: null as string | null,
        subscription_id: null as string | null,
        status: "draft" as const,
        plan_key: null as string | null,
      },
    ];

    const mapped = contracts.map((c) => ({
      id: c.id,
      title: c.title ?? "Contract",
      workspaceId: c.workspace_id,
      workspaceName: c.workspace_id ? "Workspace" : "—",
      clientEmail: "—",
      status: c.status,
      planKey: c.plan_key,
      userId: c.user_id,
      subscriptionId: c.subscription_id,
    }));

    expect(mapped[0].workspaceId).toBeNull();
    expect(mapped[0].title).toBe("Contract");
  });

  it("handles zero subscriptions list", () => {
    const subscriptions: unknown[] = [];
    const workspaceIds = [
      ...new Set(
        subscriptions
          .map((s) => (s as { workspace_id?: string | null }).workspace_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    expect(workspaceIds).toEqual([]);
  });
});
