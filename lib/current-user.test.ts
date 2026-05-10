import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock("@/lib/supabase/server", () => ({
  getCurrentAuthUser: vi.fn()
}));

import { prisma } from "@/lib/prisma";
import { getCurrentAuthUser } from "@/lib/supabase/server";
import { getCurrentDbUser, getCurrentDbUserContext } from "@/lib/current-user";

const getCurrentAuthUserMock = vi.mocked(getCurrentAuthUser);
const findUniqueMock = vi.mocked(prisma.user.findUnique);

describe("getCurrentDbUserContext", () => {
  it("returns unauthenticated without querying the database when auth is missing", async () => {
    getCurrentAuthUserMock.mockResolvedValue(null);

    await expect(getCurrentDbUserContext()).resolves.toEqual({
      status: "unauthenticated",
      authUser: null,
      user: null
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("distinguishes authenticated users without a profile", async () => {
    getCurrentAuthUserMock.mockResolvedValue({ id: "auth-1" } as Awaited<ReturnType<typeof getCurrentAuthUser>>);
    findUniqueMock.mockResolvedValue(null);

    await expect(getCurrentDbUserContext()).resolves.toMatchObject({
      status: "missing_profile",
      authUser: { id: "auth-1" },
      user: null
    });
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: {
        auth_user_id: "auth-1"
      }
    });
  });

  it("keeps the legacy getCurrentDbUser return shape", async () => {
    const user = {
      id: 7,
      auth_user_id: "auth-1",
      email: "user@example.com",
      name: "User",
      gender: "MALE" as const,
      age: 30,
      height: 180,
      weight: 75,
      body_fat_percentage: null,
      training_days_json: "[1,3,5]",
      activity_level: "ACTIVE" as const,
      goal: "MAINTAIN" as const,
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z")
    };

    getCurrentAuthUserMock.mockResolvedValue({ id: "auth-1" } as Awaited<ReturnType<typeof getCurrentAuthUser>>);
    findUniqueMock.mockResolvedValue(user);

    await expect(getCurrentDbUser()).resolves.toEqual(user);
  });
});
