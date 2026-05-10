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
      findFirst: vi.fn()
    },
    mealLog: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

import { getCurrentDbUserContext } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/meal-logs/route";

const getCurrentDbUserContextMock = vi.mocked(getCurrentDbUserContext);
const findFoodItemMock = vi.mocked(prisma.foodItem.findFirst);
const createMealLogMock = vi.mocked(prisma.mealLog.create);
type ReadyUserContext = Extract<Awaited<ReturnType<typeof getCurrentDbUserContext>>, { status: "ready" }>;

describe("POST /api/meal-logs", () => {
  it("returns 404 instead of creating a meal log when the food item does not exist", async () => {
    getCurrentDbUserContextMock.mockResolvedValue({
      status: "ready",
      authUser: { id: "auth-1" } as ReadyUserContext["authUser"],
      user: { id: 7 } as ReadyUserContext["user"]
    });
    findFoodItemMock.mockResolvedValue(null);

    const response = await POST(
      new NextRequest("http://localhost/api/meal-logs", {
        method: "POST",
        body: JSON.stringify({
          food_item_id: 999,
          meal_type: "BREAKFAST",
          quantity_grams: 100,
          date: "2026-05-06T00:00:00.000Z"
        }),
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "meal-log-test"
        }
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "没有找到这个食物。" });
    expect(findFoodItemMock).toHaveBeenCalledWith({
      where: {
        id: 999,
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
      select: {
        id: true
      }
    });
    expect(createMealLogMock).not.toHaveBeenCalled();
  });
});
