import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody } from "@/lib/api";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { createMealTemplateSchema } from "@/lib/validation";

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
  return {
    id: `meal-template-${template.id}`,
    name: template.name,
    mealType: template.meal_type,
    dayTypes: template.day_types_json ? JSON.parse(template.day_types_json) : undefined,
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
  const limit = rateLimit(request, { key: "meal-templates:get", limit: 60, windowMs: 60_000 });

  if (!limit.allowed) {
    return createRateLimitResponse(limit);
  }

  const user = await getCurrentDbUser();

  if (!user) {
    return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
  }

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
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(request, { key: "meal-templates:post", limit: 20, windowMs: 60_000 });

  if (!limit.allowed) {
    return createRateLimitResponse(limit);
  }

  const user = await getCurrentDbUser();

  if (!user) {
    return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
  }

  const parsed = await parseJsonBody(request, createMealTemplateSchema);

  if (!parsed.success) {
    return withRateLimitHeaders(parsed.response, limit);
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
}
