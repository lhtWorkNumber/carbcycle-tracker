import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody, withObservedApiRoute } from "@/lib/api";
import { calculateFoodItemMacros } from "@/lib/calculator";
import { formatDateKey } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { getCurrentAuthUser } from "@/lib/supabase/server";
import { createMealLogSchema } from "@/lib/validation";

function normalizeMealLog(mealLog: {
  id: number;
  meal_type: string;
  quantity_grams: number;
  date: Date;
  created_at: Date;
  food_item: {
    id: number;
    name: string;
    name_zh: string;
    category: string;
    calories_per_100g: number;
    protein_per_100g: number;
    fat_per_100g: number;
    carbs_per_100g: number;
    fiber_per_100g: number;
  };
}) {
  const macros = calculateFoodItemMacros(
    {
      id: mealLog.food_item.id,
      caloriesPer100g: mealLog.food_item.calories_per_100g,
      proteinPer100g: mealLog.food_item.protein_per_100g,
      fatPer100g: mealLog.food_item.fat_per_100g,
      carbsPer100g: mealLog.food_item.carbs_per_100g,
      fiberPer100g: mealLog.food_item.fiber_per_100g
    },
    mealLog.quantity_grams
  );

  return {
    id: `meal-log-${mealLog.id}`,
    foodItemId: mealLog.food_item.id,
    name: mealLog.food_item.name,
    nameZh: mealLog.food_item.name_zh,
    category: mealLog.food_item.category,
    mealType: mealLog.meal_type,
    quantityGrams: mealLog.quantity_grams,
    date: formatDateKey(mealLog.date),
    createdAt: mealLog.created_at.toISOString(),
    ...macros
  };
}

export async function GET(request: NextRequest) {
  return withObservedApiRoute(request, "/api/meal-logs", async () => {
    const limit = rateLimit(request, { key: "meal-logs:get", limit: 80, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

  const authUser = await getCurrentAuthUser();

  if (!authUser) {
    return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
  }

  const user = await prisma.user.findUnique({
    where: {
      auth_user_id: authUser.id
    },
    select: {
      id: true
    }
  });

  if (!user) {
    return withRateLimitHeaders(NextResponse.json([]), limit);
  }

  const mealLogs = await prisma.mealLog.findMany({
    where: {
      user_id: user.id
    },
    include: {
      food_item: true
    },
    orderBy: [{ date: "desc" }, { created_at: "desc" }]
  });

    return withRateLimitHeaders(NextResponse.json(mealLogs.map(normalizeMealLog)), limit);
  });
}

export async function POST(request: NextRequest) {
  return withObservedApiRoute(request, "/api/meal-logs", async () => {
    const limit = rateLimit(request, { key: "meal-logs:post", limit: 30, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

  const parsed = await parseJsonBody(request, createMealLogSchema);

  if (!parsed.success) {
    return withRateLimitHeaders(parsed.response, limit);
  }

  const authUser = await getCurrentAuthUser();

  if (!authUser) {
    return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
  }

  const user = await prisma.user.findUnique({
    where: {
      auth_user_id: authUser.id
    },
    select: {
      id: true
    }
  });

  if (!user) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "请先完成用户资料设置后再记录餐食。" }, { status: 409 }),
      limit
    );
  }

  const mealLog = await prisma.mealLog.create({
    data: {
      user_id: user.id,
      food_item_id: parsed.data.food_item_id,
      meal_type: parsed.data.meal_type,
      quantity_grams: parsed.data.quantity_grams,
      date: new Date(parsed.data.date)
    },
    include: {
      food_item: true
    }
  });

    return withRateLimitHeaders(NextResponse.json(normalizeMealLog(mealLog), { status: 201 }), limit);
  });
}
