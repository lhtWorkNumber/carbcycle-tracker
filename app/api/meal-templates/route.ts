import { NextRequest, NextResponse } from "next/server";

import { parseJsonArray, parseJsonBody, withObservedApiRoute } from "@/lib/api";
import { getCurrentDbUserContext } from "@/lib/current-user";
import { DayType } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { createMealTemplateSchema } from "@/lib/validation";

function isDayType(value: unknown): value is DayType {
  return typeof value === "string" && Object.values(DayType).includes(value as DayType);
}

function normalizeTemplate(template: {
  id: number;
  name: string;
  meal_type: string;
  day_types_json: string | null;
  built_in: boolean;
  items: Array<{
    food_item_id: number | null;
    name: string;
    name_zh: string;
    category: string;
    quantity_grams: number;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  }>;
}) {
  const dayTypes = parseJsonArray<DayType>(template.day_types_json, [], isDayType);

  return {
    id: `meal-template-${template.id}`,
    name: template.name,
    mealType: template.meal_type,
    dayTypes: dayTypes.length > 0 ? dayTypes : undefined,
    builtIn: template.built_in,
    items: template.items.map((item) => ({
      foodItemId: item.food_item_id ?? undefined,
      name: item.name,
      nameZh: item.name_zh,
      category: item.category,
      quantityGrams: item.quantity_grams,
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      fiber: item.fiber
    }))
  };
}

export async function GET(request: NextRequest) {
  return withObservedApiRoute(request, "/api/meal-templates", async () => {
    const limit = rateLimit(request, { key: "meal-templates:get", limit: 60, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

    const userContext = await getCurrentDbUserContext();

    if (userContext.status === "unauthenticated") {
      return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
    }

    if (userContext.status === "missing_profile") {
      return withRateLimitHeaders(NextResponse.json([]), limit);
    }

    const { user } = userContext;

    const templates = await prisma.mealTemplate.findMany({
      where: {
        user_id: user.id
      },
      include: {
        items: true
      },
      orderBy: {
        updated_at: "desc"
      }
    });

    return withRateLimitHeaders(NextResponse.json(templates.map(normalizeTemplate)), limit);
  });
}

export async function POST(request: NextRequest) {
  return withObservedApiRoute(request, "/api/meal-templates", async () => {
    const limit = rateLimit(request, { key: "meal-templates:post", limit: 20, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

    const userContext = await getCurrentDbUserContext();

    if (userContext.status === "unauthenticated") {
      return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
    }

    if (userContext.status === "missing_profile") {
      return withRateLimitHeaders(
        NextResponse.json({ error: "请先完成用户资料设置后再保存模板。" }, { status: 409 }),
        limit
      );
    }

    const { user } = userContext;

    const parsed = await parseJsonBody(request, createMealTemplateSchema);

    if (!parsed.success) {
      return withRateLimitHeaders(parsed.response, limit);
    }

    const referencedFoodItemIds = [
      ...new Set(parsed.data.items.map((item) => item.foodItemId).filter((id): id is number => typeof id === "number"))
    ];

    if (referencedFoodItemIds.length > 0) {
      const existingFoodItemCount = await prisma.foodItem.count({
        where: {
          id: {
            in: referencedFoodItemIds
          },
          OR: [
            {
              is_custom: false,
              user_id: null
            },
            {
              is_custom: true,
              user_id: user.id
            }
          ]
        }
      });

      if (existingFoodItemCount !== referencedFoodItemIds.length) {
        return withRateLimitHeaders(NextResponse.json({ error: "模板中包含不存在的食物。" }, { status: 404 }), limit);
      }
    }

    const template = await prisma.mealTemplate.create({
      data: {
        user_id: user.id,
        name: parsed.data.name,
        meal_type: parsed.data.mealType,
        day_types_json: parsed.data.dayTypes ? JSON.stringify(parsed.data.dayTypes) : null,
        built_in: false,
        items: {
          create: parsed.data.items.map((item) => ({
            food_item_id: item.foodItemId ?? null,
            name: item.name,
            name_zh: item.nameZh,
            category: item.category,
            quantity_grams: item.quantityGrams,
            calories: item.calories,
            protein: item.protein,
            fat: item.fat,
            carbs: item.carbs,
            fiber: item.fiber
          }))
        }
      },
      include: {
        items: true
      }
    });

    return withRateLimitHeaders(NextResponse.json(normalizeTemplate(template), { status: 201 }), limit);
  });
}
