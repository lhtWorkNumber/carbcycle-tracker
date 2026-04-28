import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody, withObservedApiRoute } from "@/lib/api";
import { formatDateKey } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { getCurrentAuthUser } from "@/lib/supabase/server";
import { createExerciseLogSchema } from "@/lib/validation";

function normalizeExercise(exercise: {
  id: number;
  date: Date;
  exercise_name: string;
  duration_minutes: number;
  calories_burned: number;
  exercise_type: string;
}) {
  return {
    id: `exercise-log-${exercise.id}`,
    date: formatDateKey(exercise.date),
    exerciseName: exercise.exercise_name,
    durationMinutes: exercise.duration_minutes,
    caloriesBurned: exercise.calories_burned,
    exerciseType: exercise.exercise_type
  };
}

export async function GET(request: NextRequest) {
  return withObservedApiRoute(request, "/api/exercise-logs", async () => {
    const limit = rateLimit(request, { key: "exercise-logs:get", limit: 60, windowMs: 60_000 });

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

  const exercises = await prisma.exerciseLog.findMany({
    where: {
      user_id: user.id
    },
    orderBy: { date: "desc" }
  });

    return withRateLimitHeaders(NextResponse.json(exercises.map(normalizeExercise)), limit);
  });
}

export async function POST(request: NextRequest) {
  return withObservedApiRoute(request, "/api/exercise-logs", async () => {
    const limit = rateLimit(request, { key: "exercise-logs:post", limit: 20, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

  const parsed = await parseJsonBody(request, createExerciseLogSchema);

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
      NextResponse.json({ error: "请先完成用户资料设置后再记录训练。" }, { status: 409 }),
      limit
    );
  }

  const exercise = await prisma.exerciseLog.create({
    data: {
      user_id: user.id,
      exercise_name: parsed.data.exercise_name,
      duration_minutes: parsed.data.duration_minutes,
      calories_burned: parsed.data.calories_burned,
      exercise_type: parsed.data.exercise_type,
      date: new Date(parsed.data.date)
    }
  });

    return withRateLimitHeaders(NextResponse.json(normalizeExercise(exercise), { status: 201 }), limit);
  });
}
