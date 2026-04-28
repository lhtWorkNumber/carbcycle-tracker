import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody, withObservedApiRoute } from "@/lib/api";
import { type DailyPlan, type DayType } from "@/lib/domain";
import { formatDateKey } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { getCurrentAuthUser } from "@/lib/supabase/server";
import { createDailyPlanSchema, upsertWeeklyPlansSchema } from "@/lib/validation";

function normalizeDailyPlan(plan: {
  id: number;
  date: Date;
  day_type: string;
  target_calories: number;
  target_protein_g: number;
  target_fat_g: number;
  target_carbs_g: number;
  actual_calories: number;
  actual_protein_g: number;
  actual_fat_g: number;
  actual_carbs_g: number;
}): DailyPlan {
  return {
    id: `daily-plan-${plan.id}`,
    date: formatDateKey(plan.date),
    dayType: plan.day_type as DailyPlan["dayType"],
    targetCalories: plan.target_calories,
    targetProteinG: plan.target_protein_g,
    targetFatG: plan.target_fat_g,
    targetCarbsG: plan.target_carbs_g,
    actualCalories: plan.actual_calories,
    actualProteinG: plan.actual_protein_g,
    actualFatG: plan.actual_fat_g,
    actualCarbsG: plan.actual_carbs_g
  };
}

function buildDailyPlanCreateData(userId: number, plan: {
  date: string;
  day_type: DayType;
  target_calories: number;
  target_protein_g: number;
  target_fat_g: number;
  target_carbs_g: number;
  actual_calories?: number;
  actual_protein_g?: number;
  actual_fat_g?: number;
  actual_carbs_g?: number;
}) {
  return {
    user_id: userId,
    date: new Date(plan.date),
    day_type: plan.day_type,
    target_calories: plan.target_calories,
    target_protein_g: plan.target_protein_g,
    target_fat_g: plan.target_fat_g,
    target_carbs_g: plan.target_carbs_g,
    actual_calories: plan.actual_calories ?? 0,
    actual_protein_g: plan.actual_protein_g ?? 0,
    actual_fat_g: plan.actual_fat_g ?? 0,
    actual_carbs_g: plan.actual_carbs_g ?? 0
  };
}

function buildDailyPlanUpdateData(plan: {
  day_type: DayType;
  target_calories: number;
  target_protein_g: number;
  target_fat_g: number;
  target_carbs_g: number;
  actual_calories?: number;
  actual_protein_g?: number;
  actual_fat_g?: number;
  actual_carbs_g?: number;
}) {
  return {
    day_type: plan.day_type,
    target_calories: plan.target_calories,
    target_protein_g: plan.target_protein_g,
    target_fat_g: plan.target_fat_g,
    target_carbs_g: plan.target_carbs_g,
    ...(plan.actual_calories !== undefined ? { actual_calories: plan.actual_calories } : {}),
    ...(plan.actual_protein_g !== undefined ? { actual_protein_g: plan.actual_protein_g } : {}),
    ...(plan.actual_fat_g !== undefined ? { actual_fat_g: plan.actual_fat_g } : {}),
    ...(plan.actual_carbs_g !== undefined ? { actual_carbs_g: plan.actual_carbs_g } : {})
  };
}

export async function GET(request: NextRequest) {
  return withObservedApiRoute(request, "/api/daily-plans", async () => {
    const limit = rateLimit(request, { key: "daily-plans:get", limit: 60, windowMs: 60_000 });

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

  const plans = await prisma.dailyPlan.findMany({
    where: {
      user_id: user.id
    },
    orderBy: { date: "desc" }
  });

    return withRateLimitHeaders(NextResponse.json(plans.map(normalizeDailyPlan)), limit);
  });
}

export async function POST(request: NextRequest) {
  return withObservedApiRoute(request, "/api/daily-plans", async () => {
    const limit = rateLimit(request, { key: "daily-plans:post", limit: 20, windowMs: 60_000 });

  if (!limit.allowed) {
    return createRateLimitResponse(limit);
  }

  const parsed = await parseJsonBody(request, createDailyPlanSchema);

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
      NextResponse.json({ error: "请先完成用户资料设置后再生成计划。" }, { status: 409 }),
      limit
    );
  }

  const plan = await prisma.dailyPlan.upsert({
    where: {
      user_id_date: {
        user_id: user.id,
        date: new Date(parsed.data.date)
      }
    },
    update: {
      ...buildDailyPlanUpdateData(parsed.data)
    },
    create: buildDailyPlanCreateData(user.id, parsed.data)
  });

    return withRateLimitHeaders(NextResponse.json(normalizeDailyPlan(plan), { status: 201 }), limit);
  });
}

export async function PUT(request: NextRequest) {
  return withObservedApiRoute(request, "/api/daily-plans", async () => {
    const limit = rateLimit(request, { key: "daily-plans:put", limit: 20, windowMs: 60_000 });

  if (!limit.allowed) {
    return createRateLimitResponse(limit);
  }

  const parsed = await parseJsonBody(request, upsertWeeklyPlansSchema);

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
      NextResponse.json({ error: "请先完成用户资料设置后再生成计划。" }, { status: 409 }),
      limit
    );
  }

  const plans = await Promise.all(
    parsed.data.plans.map((plan) =>
      prisma.dailyPlan.upsert({
        where: {
          user_id_date: {
            user_id: user.id,
            date: new Date(plan.date)
          }
        },
        update: {
          ...buildDailyPlanUpdateData(plan)
        },
        create: buildDailyPlanCreateData(user.id, plan)
      })
    )
  );

    return withRateLimitHeaders(NextResponse.json(plans.map(normalizeDailyPlan)), limit);
  });
}
