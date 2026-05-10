import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody, withObservedApiRoute } from "@/lib/api";
import { getCurrentDbUserContext } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { upsertAchievementsSchema } from "@/lib/validation";

function normalizeAchievement(achievement: {
  id: number;
  key: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlocked_at: Date | null;
  progress: number;
}) {
  return {
    id: achievement.key,
    title: achievement.title,
    description: achievement.description,
    unlocked: achievement.unlocked,
    unlockedAt: achievement.unlocked_at?.toISOString(),
    progress: achievement.progress
  };
}

export async function GET(request: NextRequest) {
  return withObservedApiRoute(request, "/api/achievements", async () => {
    const limit = rateLimit(request, { key: "achievements:get", limit: 60, windowMs: 60_000 });

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

    const achievements = await prisma.achievementProgress.findMany({
      where: {
        user_id: user.id
      },
      orderBy: {
        key: "asc"
      }
    });

    return withRateLimitHeaders(NextResponse.json(achievements.map(normalizeAchievement)), limit);
  });
}

export async function PUT(request: NextRequest) {
  return withObservedApiRoute(request, "/api/achievements", async () => {
    const limit = rateLimit(request, { key: "achievements:put", limit: 20, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

    const userContext = await getCurrentDbUserContext();

    if (userContext.status === "unauthenticated") {
      return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
    }

    if (userContext.status === "missing_profile") {
      return withRateLimitHeaders(
        NextResponse.json({ error: "请先完成用户资料设置后再保存成就。" }, { status: 409 }),
        limit
      );
    }

    const { user } = userContext;

    const parsed = await parseJsonBody(request, upsertAchievementsSchema);

    if (!parsed.success) {
      return withRateLimitHeaders(parsed.response, limit);
    }

    const achievements = await Promise.all(
      parsed.data.achievements.map((achievement) =>
        prisma.achievementProgress.upsert({
          where: {
            user_id_key: {
              user_id: user.id,
              key: achievement.key
            }
          },
          update: {
            title: achievement.title,
            description: achievement.description,
            unlocked: achievement.unlocked,
            unlocked_at: achievement.unlockedAt ? new Date(achievement.unlockedAt) : null,
            progress: achievement.progress
          },
          create: {
            user_id: user.id,
            key: achievement.key,
            title: achievement.title,
            description: achievement.description,
            unlocked: achievement.unlocked,
            unlocked_at: achievement.unlockedAt ? new Date(achievement.unlockedAt) : null,
            progress: achievement.progress
          }
        })
      )
    );

    return withRateLimitHeaders(NextResponse.json(achievements.map(normalizeAchievement)), limit);
  });
}
