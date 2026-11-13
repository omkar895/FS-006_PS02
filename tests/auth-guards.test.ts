import { describe, it, expect, vi } from "vitest";
import { requireRole } from "@/lib/auth/guards";
import * as serverAuth from "@/lib/auth/server";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/auth/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

describe("Authentication & Authorization Role Guards", () => {
  it("throws UNAUTHENTICATED when no user session is present", async () => {
    vi.mocked(serverAuth.createServerSupabaseClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("No session") }),
      },
    } as unknown as SupabaseClient);

    await expect(requireRole(["passenger"])).rejects.toThrow("UNAUTHENTICATED");
  });

  it("throws PROFILE_NOT_FOUND when user exists in auth but has no profile row", async () => {
    vi.mocked(serverAuth.createServerSupabaseClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "123e4567-e89b-12d3-a456-426614174000", email: "user@test.com" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error("Row not found") }),
          }),
        }),
      }),
    } as unknown as SupabaseClient);

    await expect(requireRole(["passenger"])).rejects.toThrow("PROFILE_NOT_FOUND");
  });

  it("throws FORBIDDEN when user role is not in the allowed list", async () => {
    vi.mocked(serverAuth.createServerSupabaseClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "123e4567-e89b-12d3-a456-426614174000", email: "passenger@test.com" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: "passenger", display_name: "Test Passenger" },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient);

    await expect(requireRole(["admin"])).rejects.toThrow("FORBIDDEN");
  });

  it("successfully returns session when role matches authorization requirement", async () => {
    vi.mocked(serverAuth.createServerSupabaseClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "123e4567-e89b-12d3-a456-426614174000", email: "admin@test.com" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: "admin", display_name: "Operations Admin" },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient);

    const session = await requireRole(["admin"]);
    expect(session.userId).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(session.role).toBe("admin");
    expect(session.displayName).toBe("Operations Admin");
  });
});
