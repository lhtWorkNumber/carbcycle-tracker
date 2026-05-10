import { NextRequest, NextResponse } from "next/server";

import { parseJsonBody, parseJsonValue, withObservedApiRoute } from "@/lib/api";
import { getCurrentDbUserContext } from "@/lib/current-user";
import { type WeeklySummaryComparison } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { upsertWeeklySummariesSchema } from "@/lib/validation";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isWeeklySummaryComparison(value: unknown): value is WeeklySummaryComparison {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const comparison = value as Record<keyof WeeklySummaryComparison, unknown>;
  return (
    isNumber(comparison.adherenceRateDelta) &&
    isNumber(comparison.weightChangeDelta) &&
    isNumber(comparison.caloriesDelta) &&
    isNumber(comparison.proteinDelta) &&
    isNumber(comparison.carbsDelta)
  );
}

function normalizeSummary(summary: {
  id: number;
  week_key: string;
  week_label: string;
  adherence_rate: number;
  weight_change: number;
  calorie_average: number;
  protein_average: number;
  fat_average: number;
  carbs_average: number;
  comparison_json: string | null;
  motivational_message: string;
  created_at: Date;
}) {
  return {
    id: `weekly-summary-${summary.id}`,
    weekKey: summary.week_key,
    weekLabel: summary.week_label,
    adherenceRate: summary.adherence_rate,
    weightChange: summary.weight_change,
    calorieAverage: summary.calorie_average,
    proteinAverage: summary.protein_average,
    fatAverage: summary.fat_average,
    carbsAverage: summary.carbs_average,
    lastWeekComparison: parseJsonValue<WeeklySummaryComparison | undefined>(
      summary.comparison_json,
      undefined,
      isWeeklySummaryComparison
    ),
    motivationalMessage: summary.motivational_message,
    createdAt: summary.created_at.toISOString()
  };
}

export async function GET(request: NextRequest) {
  return withObservedApiRoute(request, "/api/weekly-summaries", async () => {
    const limit = rateLimit(request, { key: "weekly-summaries:get", limit: 60, windowMs: 60_000 });

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

    const summaries = await prisma.weeklySummary.findMany({
      where: {
        user_id: user.id
      },
      orderBy: {
        week_key: "desc"
      }
    });

    return withRateLimitHeaders(NextResponse.json(summaries.map(normalizeSummary)), limit);
  });
}

export async function PUT(request: NextRequest) {
  return withObservedApiRoute(request, "/api/weekly-summaries", async () => {
    const limit = rateLimit(request, { key: "weekly-summaries:put", limit: 20, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

    const userContext = await getCurrentDbUserContext();

    if (userContext.status === "unauthenticated") {
      return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
    }

    if (userContext.status === "missing_profile") {
      return withRateLimitHeaders(
        NextResponse.json({ error: "请先完成用户资料设置后再保存周报。" }, { status: 409 }),
        limit
      );
    }

    const { user } = userContext;

    const parsed = await parseJsonBody(request, upsertWeeklySummariesSchema);

    if (!parsed.success) {
      return withRateLimitHeaders(parsed.response, limit);
    }

    const summaries = await Promise.all(
      parsed.data.summaries.map((summary) =>
        prisma.weeklySummary.upsert({
          where: {
            user_id_week_key: {
              user_id: user.id,
              week_key: summary.weekKey
            }
          },
          update: {
            week_label: summary.weekLabel,
            adherence_rate: summary.adherenceRate,
            weight_change: summary.weightChange,
            calorie_average: summary.calorieAverage,
            protein_average: summary.proteinAverage,
            fat_average: summary.fatAverage,
            carbs_average: summary.carbsAverage,
            comparison_json: summary.comparisonJson ?? null,
            motivational_message: summary.motivationalMessage
          },
          create: {
            user_id: user.id,
            week_key: summary.weekKey,
            week_label: summary.weekLabel,
            adherence_rate: summary.adherenceRate,
            weight_change: summary.weightChange,
            calorie_average: summary.calorieAverage,
            protein_average: summary.proteinAverage,
            fat_average: summary.fatAverage,
            carbs_average: summary.carbsAverage,
            comparison_json: summary.comparisonJson ?? null,
            motivational_message: summary.motivationalMessage
          }
        })
      )
    );

    return withRateLimitHeaders(NextResponse.json(summaries.map(normalizeSummary)), limit);
  });
}
