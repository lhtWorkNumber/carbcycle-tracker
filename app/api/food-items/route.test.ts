import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/current-user", () => ({
  getCurrentDbUserContext: vi.fn()
}));

vi.mock("@/lib/monitoring/logger", () => ({
  logError: vi.fn(),
  logInfo: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    foodItem: {
      create: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

import { getCurrentDbUserContext } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/food-items/route";

const getCurrentDbUserContextMock = vi.mocked(getCurrentDbUserContext);
const createFoodItemMock = vi.mocked(prisma.foodItem.create);
const findFoodItemsMock = vi.mocked(prisma.foodItem.findMany);
type ReadyUserContext = Extract<Awaited<ReturnType<typeof getCurrentDbUserContext>>, { status: "ready" }>;

describe("/api/food-items", () => {
  it("returns only system food and the current user's custom food", async () => {
    getCurrentDbUserContextMock.mockResolvedValue({
      status: "ready",
      authUser: { id: "auth-1" } as ReadyUserContext["authUser"],
      user: { id: 7 } as ReadyUserContext["user"]
    });
    findFoodItemsMock.mockResolvedValue([]);

    const response = await GET(
      new NextRequest("http://localhost/api/food-items", {
        headers: {
          "x-forwarded-for": "food-items-get-test"
        }
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(findFoodItemsMock).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            is_custom: false,
            user_id: null
          },
          {
            is_custom: true,
            user_id: 7
          }
        ]
      },
      orderBy: [{ category: "asc" }, { name_zh: "asc" }]
    });
  });

  it("creates custom food owned by the current user", async () => {
    getCurrentDbUserContextMock.mockResolvedValue({
      status: "ready",
      authUser: { id: "auth-2" } as ReadyUserContext["authUser"],
      user: { id: 9 } as ReadyUserContext["user"]
    });
    createFoodItemMock.mockResolvedValue({
      id: 42,
      name: "User Oats",
      name_zh: "用户燕麦",
      category: "STAPLE",
      calories_per_100g: 389,
      protein_per_100g: 16.9,
      fat_per_100g: 6.9,
      carbs_per_100g: 66.3,
      fiber_per_100g: 10.6,
      gi_index: null,
      image_url: null,
      is_custom: true,
      user_id: 9
    });

    const response = await POST(
      new NextRequest("http://localhost/api/food-items", {
        method: "POST",
        body: JSON.stringify({
          name: "User Oats",
          name_zh: "用户燕麦",
          category: "STAPLE",
          calories_per_100g: 389,
          protein_per_100g: 16.9,
          fat_per_100g: 6.9,
          carbs_per_100g: 66.3,
          fiber_per_100g: 10.6,
          is_custom: false
        }),
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "food-items-post-test"
        }
      })
    );

    expect(response.status).toBe(201);
    expect(createFoodItemMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        is_custom: true,
        user_id: 9
      })
    });
    await expect(response.json()).resolves.toMatchObject({
      id: 42,
      is_custom: true,
      user_id: 9
    });
  });
});
