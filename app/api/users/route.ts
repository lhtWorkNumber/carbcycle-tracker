import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody, withObservedApiRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { getCurrentAuthUser } from "@/lib/supabase/server";
import { createUserSchema } from "@/lib/validation";

function parseTrainingDays(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  return withObservedApiRoute(request, "/api/users", async () => {
    const limit = rateLimit(request, { key: "users:get", limit: 60, windowMs: 60_000 });

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
      }
    });

    return withRateLimitHeaders(
      NextResponse.json(
        user
          ? {
              id: user.id,
              email: user.email,
              name: user.name,
              gender: user.gender,
              age: user.age,
              heightCm: user.height,
              weightKg: user.weight,
              bodyFatPercentage: user.body_fat_percentage,
              trainingDays: parseTrainingDays(user.training_days_json),
              activityLevel: user.activity_level,
              goal: user.goal
            }
          : null
      ),
      limit
    );
  });
}

export async function POST(request: NextRequest) {
  return withObservedApiRoute(request, "/api/users", async () => {
    const limit = rateLimit(request, { key: "users:post", limit: 20, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

    const parsed = await parseJsonBody(request, createUserSchema);

    if (!parsed.success) {
      return withRateLimitHeaders(parsed.response, limit);
    }

    const authUser = await getCurrentAuthUser();

    if (!authUser) {
      return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
    }

    const user = await prisma.user.upsert({
      where: {
        auth_user_id: authUser.id
      },
      update: {
        name: parsed.data.name,
        gender: parsed.data.gender,
        age: parsed.data.age,
        height: parsed.data.height,
        weight: parsed.data.weight,
        body_fat_percentage: parsed.data.body_fat_percentage ?? null,
        training_days_json: JSON.stringify(parsed.data.training_days),
        activity_level: parsed.data.activity_level,
        goal: parsed.data.goal,
        email: authUser.email ?? null
      },
      create: {
        name: parsed.data.name,
        gender: parsed.data.gender,
        age: parsed.data.age,
        height: parsed.data.height,
        weight: parsed.data.weight,
        body_fat_percentage: parsed.data.body_fat_percentage ?? null,
        training_days_json: JSON.stringify(parsed.data.training_days),
        activity_level: parsed.data.activity_level,
        goal: parsed.data.goal,
        auth_user_id: authUser.id,
        email: authUser.email ?? null
      }
    });

    return withRateLimitHeaders(
      NextResponse.json(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          gender: user.gender,
          age: user.age,
          heightCm: user.height,
          weightKg: user.weight,
          bodyFatPercentage: user.body_fat_percentage,
          trainingDays: parseTrainingDays(user.training_days_json),
          activityLevel: user.activity_level,
          goal: user.goal
        },
        { status: 201 }
      ),
      limit
    );
  });
}
