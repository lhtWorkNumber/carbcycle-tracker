import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody } from "@/lib/api";
import { getCurrentDbUser } from "@/lib/current-user";
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
  const limit = rateLimit(request, { key: "achievements:get", limit: 60, windowMs: 60_000 });

  if (!limit.allowed) {
    return createRateLimitResponse(limit);
  }

  const user = await getCurrentDbUser();

  if (!user) {
    return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
  }

  const achievements = await prisma.achievementProgress.findMany({
    where: {
      user_id: user.id
    },
    orderBy: {
      key: "asc"
    }
  });

  return withRateLimitHeaders(NextResponse.json(achievements.map(normalizeAchievement)), limit);
}

export async function PUT(request: NextRequest) {
  const limit = rateLimit(request, { key: "achievements:put", limit: 20, windowMs: 60_000 });

  if (!limit.allowed) {
    return createRateLimitResponse(limit);
  }

  const user = await getCurrentDbUser();

  if (!user) {
    return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
  }

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
}
