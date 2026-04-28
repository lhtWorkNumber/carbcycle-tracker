import { NextRequest, NextResponse } from "next/server";

import { FoodCategory } from "@/lib/domain";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { barcodeParamSchema } from "@/lib/validation";

function guessCategory(name: string) {
  if (/奶|酸奶|乳清|牛奶/i.test(name)) {
    return FoodCategory.DAIRY;
  }

  if (/鸡|牛|鱼|虾|肉|蛋/i.test(name)) {
    return FoodCategory.MEAT;
  }

  if (/米|麦|面|燕麦|薯/i.test(name)) {
    return FoodCategory.STAPLE;
  }

  if (/果|莓|香蕉|苹果/i.test(name)) {
    return FoodCategory.FRUIT;
  }

  if (/菜|蔬|西兰花|番茄|黄瓜/i.test(name)) {
    return FoodCategory.VEGETABLE;
  }

  return FoodCategory.OTHER;
}

export async function GET(
  request: NextRequest,
  {
    params
  }: {
    params: {
      barcode: string;
    };
  }
) {
  const limit = rateLimit(request, { key: "barcode:get", limit: 20, windowMs: 60_000 });

  if (!limit.allowed) {
    return createRateLimitResponse(limit);
  }

  const parsed = barcodeParamSchema.safeParse({
    barcode: params.barcode
  });

  if (!parsed.success) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "条形码格式不正确" }, { status: 400 }),
      limit
    );
  }

  const barcode = parsed.data.barcode;

  const endpoint = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode
  )}?fields=code,product_name,brands,image_front_url,nutriments`;

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "CarbCycleTracker/0.1 (local-dev@example.com)"
    },
    next: {
      revalidate: 3600
    }
  });

  if (!response.ok) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "条码查询失败，请稍后重试" }, { status: 502 }),
      limit
    );
  }

  const data = await response.json();

  if (!data?.product?.product_name) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "未找到该条码对应的食物信息" }, { status: 404 }),
      limit
    );
  }

  const productName = data.product.product_name as string;
  const nutriments = data.product.nutriments ?? {};

  return withRateLimitHeaders(
    NextResponse.json({
      id: Number(`9${barcode.slice(-8)}`),
      barcode,
      name: productName,
      nameZh: productName,
      brand: data.product.brands ?? "",
      imageUrl: data.product.image_front_url ?? null,
      category: guessCategory(productName),
      caloriesPer100g: nutriments["energy-kcal_100g"] ?? 0,
      proteinPer100g: nutriments.proteins_100g ?? 0,
      fatPer100g: nutriments.fat_100g ?? 0,
      carbsPer100g: nutriments.carbohydrates_100g ?? 0,
      fiberPer100g: nutriments.fiber_100g ?? 0,
      isCustom: true
    }),
    limit
  );
}
