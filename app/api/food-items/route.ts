import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { parseJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { createFoodItemSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const limit = rateLimit(request, { key: "food-items:get", limit: 120, windowMs: 60_000 });

  if (!limit.allowed) {
    return createRateLimitResponse(limit);
  }

  const foods = await prisma.foodItem.findMany({
    orderBy: [{ category: "asc" }, { name_zh: "asc" }]
  });

  const response = withRateLimitHeaders(NextResponse.json(foods), limit);
  response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  return response;
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(request, { key: "food-items:post", limit: 20, windowMs: 60_000 });

  if (!limit.allowed) {
    return createRateLimitResponse(limit);
  }

  const parsed = await parseJsonBody(request, createFoodItemSchema);

  if (!parsed.success) {
    return withRateLimitHeaders(parsed.response, limit);
  }

  const body = parsed.data;

  try {
    const foodItem = await prisma.foodItem.create({
      data: {
        name: body.name,
        name_zh: body.name_zh,
        category: body.category,
        calories_per_100g: body.calories_per_100g,
        protein_per_100g: body.protein_per_100g,
        fat_per_100g: body.fat_per_100g,
        carbs_per_100g: body.carbs_per_100g,
        fiber_per_100g: body.fiber_per_100g,
        gi_index: body.gi_index,
        image_url: body.image_url,
        is_custom: body.is_custom ?? true
      }
    });

    return withRateLimitHeaders(NextResponse.json(foodItem, { status: 201 }), limit);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return withRateLimitHeaders(NextResponse.json({ error: "同名食物已经存在" }, { status: 409 }), limit);
    }

    return withRateLimitHeaders(NextResponse.json({ error: "保存失败，请稍后重试" }, { status: 500 }), limit);
  }
}
