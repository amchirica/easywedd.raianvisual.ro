import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const rpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    rpc,
  })),
}));

import { requirePlatformAdmin } from "@/lib/admin/auth";

describe("requirePlatformAdmin", () => {
  beforeEach(() => {
    getUser.mockReset();
    rpc.mockReset();
  });

  it("denies unauthenticated users", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const result = await requirePlatformAdmin();
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Neautentificat");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("denies non-admin authenticated users", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "a@b.c" } },
    });
    rpc.mockResolvedValue({ data: false, error: null });
    const result = await requirePlatformAdmin();
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Acces admin necesar");
    expect(rpc).toHaveBeenCalledWith("is_platform_admin");
  });

  it("allows when is_platform_admin RPC returns true", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u-admin", email: "admin@example.com" } },
    });
    rpc.mockResolvedValue({ data: true, error: null });
    const result = await requirePlatformAdmin();
    expect(result.ok).toBe(true);
    expect(result.user?.id).toBe("u-admin");
  });

  it("surfaces RPC errors without granting access", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "a@b.c" } },
    });
    rpc.mockResolvedValue({
      data: null,
      error: { message: "permission denied" },
    });
    const result = await requirePlatformAdmin();
    expect(result.ok).toBe(false);
    expect(result.error).toContain("permission denied");
  });
});
