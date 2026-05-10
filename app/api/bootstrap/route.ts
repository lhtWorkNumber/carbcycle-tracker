import { NextRequest, NextResponse } from "next/server";

import { parseJsonArray, parseJsonValue, withObservedApiRoute } from "@/lib/api";
import { DayType, type BootstrapPayload, type WeeklySummaryComparison } from "@/lib/domain";
import { formatDateKey } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { createRateLimitResponse, rateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { getCurrentDbUserContext } from "@/lib/current-user";
import { calculateFoodItemMacros } from "@/lib/calculator";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isDayType(value: unknown): value is DayType {
  return typeof value === "string" && Object.values(DayType).includes(value as DayType);
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

export async function GET(request: NextRequest) {
  return withObservedApiRoute(request, "/api/bootstrap", async () => {
    const limit = rateLimit(request, { key: "bootstrap:get", limit: 30, windowMs: 60_000 });

    if (!limit.allowed) {
      return createRateLimitResponse(limit);
    }

    const userContext = await getCurrentDbUserContext();

    if (userContext.status === "unauthenticated") {
      return withRateLimitHeaders(NextResponse.json({ error: "未登录" }, { status: 401 }), limit);
    }

    if (userContext.status === "missing_profile") {
      return withRateLimitHeaders(NextResponse.json({ error: "请先完成用户资料设置。" }, { status: 409 }), limit);
    }

    const { user } = userContext;

    const [mealLogs, bodyRecords, exerciseLogs, dailyPlans, mealTemplates, waterLogs, weeklySummaries, achievements] =
      await Promise.all([
        prisma.mealLog.findMany({
          where: { user_id: user.id },
          include: { food_item: true },
          orderBy: [{ date: "desc" }, { created_at: "desc" }]
        }),
        prisma.bodyRecord.findMany({
          where: { user_id: user.id },
          orderBy: { date: "desc" }
        }),
        prisma.exerciseLog.findMany({
          where: { user_id: user.id },
          orderBy: { date: "desc" }
        }),
        prisma.dailyPlan.findMany({
          where: { user_id: user.id },
          orderBy: { date: "desc" }
        }),
        prisma.mealTemplate.findMany({
          where: { user_id: user.id },
          include: { items: true },
          orderBy: { updated_at: "desc" }
        }),
        prisma.waterLog.findMany({
          where: { user_id: user.id },
          orderBy: { date: "desc" }
        }),
        prisma.weeklySummary.findMany({
          where: { user_id: user.id },
          orderBy: { week_key: "desc" }
        }),
        prisma.achievementProgress.findMany({
          where: { user_id: user.id },
          orderBy: { key: "asc" }
        })
      ]);

    const payload: BootstrapPayload = {
      profile: {
        name: user.name,
        gender: user.gender,
        age: user.age,
        heightCm: user.height,
        weightKg: user.weight,
        bodyFatPercentage: user.body_fat_percentage ?? undefined,
        trainingDays: parseJsonArray<number>(user.training_days_json, [], isNumber),
        activityLevel: user.activity_level,
        goal: user.goal
      },
      meals: mealLogs.map((mealLog) => ({
        id: `meal-log-${mealLog.id}`,
        foodItemId: mealLog.food_item.id,
        name: mealLog.food_item.name,
        nameZh: mealLog.food_item.name_zh,
        category: mealLog.food_item.category,
        mealType: mealLog.meal_type,
        quantityGrams: mealLog.quantity_grams,
        date: formatDateKey(mealLog.date),
        createdAt: mealLog.created_at.toISOString(),
        ...calculateFoodItemMacros(
          {
            id: mealLog.food_item.id,
            caloriesPer100g: mealLog.food_item.calories_per_100g,
            proteinPer100g: mealLog.food_item.protein_per_100g,
            fatPer100g: mealLog.food_item.fat_per_100g,
            carbsPer100g: mealLog.food_item.carbs_per_100g,
            fiberPer100g: mealLog.food_item.fiber_per_100g
          },
          mealLog.quantity_grams
        )
      })),
      bodyRecords: bodyRecords.map((record) => ({
        id: `body-record-${record.id}`,
        date: formatDateKey(record.date),
        weight: record.weight,
        bodyFatPercentage: record.body_fat_percentage ?? undefined,
        waistCm: record.waist_cm ?? undefined,
        beforePhotoUrl: record.before_photo_url ?? undefined,
        afterPhotoUrl: record.after_photo_url ?? undefined,
        note: record.note ?? undefined
      })),
      exercises: exerciseLogs.map((exercise) => ({
        id: `exercise-log-${exercise.id}`,
        date: formatDateKey(exercise.date),
        exerciseName: exercise.exercise_name,
        durationMinutes: exercise.duration_minutes,
        caloriesBurned: exercise.calories_burned,
        exerciseType: exercise.exercise_type
      })),
      dailyPlans: dailyPlans.map((plan) => ({
        id: `daily-plan-${plan.id}`,
        date: formatDateKey(plan.date),
        dayType: plan.day_type,
        targetCalories: plan.target_calories,
        targetProteinG: plan.target_protein_g,
        targetFatG: plan.target_fat_g,
        targetCarbsG: plan.target_carbs_g,
        actualCalories: plan.actual_calories,
        actualProteinG: plan.actual_protein_g,
        actualFatG: plan.actual_fat_g,
        actualCarbsG: plan.actual_carbs_g
      })),
      mealTemplates: mealTemplates.map((template) => {
        const dayTypes = parseJsonArray<DayType>(template.day_types_json, [], isDayType);

        return {
          id: `meal-template-${template.id}`,
          name: template.name,
          mealType: template.meal_type,
          dayTypes: dayTypes.length > 0 ? dayTypes : undefined,
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
      }),
      waterLogs: waterLogs.map((log) => ({
        date: formatDateKey(log.date),
        targetMl: log.target_ml,
        amountMl: log.amount_ml,
        entries: parseJsonArray<number>(log.entries_json, [], isNumber)
      })),
      weeklySummaries: weeklySummaries.map((summary) => ({
        weekKey: summary.week_key,
        weekLabel: summary.week_label,
        createdAt: summary.created_at.toISOString(),
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
        motivationalMessage: summary.motivational_message
      })),
      achievements: achievements.map((achievement) => ({
        id: achievement.key,
        title: achievement.title,
        description: achievement.description,
        unlocked: achievement.unlocked,
        unlockedAt: achievement.unlocked_at?.toISOString(),
        progress: achievement.progress
      }))
    };

    return withRateLimitHeaders(NextResponse.json(payload), limit);
  });
}
