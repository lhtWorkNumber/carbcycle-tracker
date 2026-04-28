"use client";

import Link from "next/link";
import { Dumbbell, Flame, Ruler, Sparkles } from "lucide-react";

import { calculateDailyProgress, calculateRemainingMacros, type WeeklyPlanDay } from "@/lib/calculator";
import { type DailyPlan, MealType } from "@/lib/domain";
import { formatChineseDate, getMondayFirstDayIndex } from "@/lib/format";
import { mealTypeLabels } from "@/lib/ui-config";
import { useTrackerStore } from "@/store/tracker-store";
import { AiMealPlanner } from "@/components/tracker/ai-meal-planner";
import { DayTypeBadge } from "@/components/tracker/day-type-badge";
import { MealSection } from "@/components/tracker/meal-section";
import { MetricRing } from "@/components/tracker/metric-ring";
import { SectionTitle } from "@/components/tracker/section-title";
import { SmartSuggestion } from "@/components/tracker/smart-suggestion";
import { WaterTracker } from "@/components/tracker/water-tracker";
import { WeeklyStrip } from "@/components/tracker/weekly-strip";
import { WeeklySummaryCard } from "@/components/tracker/weekly-summary-card";

const mealOrder = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.SNACK] as const;

function toDailyPlan(todayPlan: WeeklyPlanDay): DailyPlan {
  return {
    dayType: todayPlan.dayType,
    targetCalories: todayPlan.targetCalories,
    targetProteinG: todayPlan.targetProteinG,
    targetFatG: todayPlan.targetFatG,
    targetCarbsG: todayPlan.targetCarbsG
  };
}

export function DashboardScreen() {
  const selectedDate = useTrackerStore((state) => state.selectedDate);
  const weeklyPlan = useTrackerStore((state) => state.weeklyPlan);
  const meals = useTrackerStore((state) => state.meals);
  const profile = useTrackerStore((state) => state.profile);
  const hasCompletedOnboarding = useTrackerStore((state) => state.hasCompletedOnboarding);
  const dailyCheckInStreak = useTrackerStore((state) => state.dailyCheckInStreak);
  const weeklySummaries = useTrackerStore((state) => state.weeklySummaries);

  const activeDayIndex = getMondayFirstDayIndex(selectedDate);
  const todayPlan = weeklyPlan.days[activeDayIndex] ?? weeklyPlan.days[0];
  const todayMeals = meals
    .filter((meal) => meal.date === selectedDate)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const dailyProgress = calculateDailyProgress(todayMeals, toDailyPlan(todayPlan));
  const remainingMacros = calculateRemainingMacros(dailyProgress);
  const remainingCalories = Math.round(dailyProgress.calories.target - dailyProgress.calories.actual);
  const latestWeeklySummary = weeklySummaries.at(-1);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 safe-px pb-28 pt-6">
      <section className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,252,246,0.94))] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] ring-1 ring-white/70 duration-500 dark:bg-[linear-gradient(180deg,rgba(20,26,24,0.95),rgba(18,27,22,0.88))] dark:ring-white/5 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{formatChineseDate(selectedDate)}</p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">今日记录</h1>
              <DayTypeBadge dayType={todayPlan.dayType} />
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              {profile.name}，今天继续按计划完成饮食和训练，剩余热量会实时随着记录更新。
            </p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <Flame className="h-4 w-4" />
              连续 {dailyCheckInStreak} 天打卡
            </div>
            <Link
              href="/record"
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground"
            >
              <Ruler className="h-4 w-4" />
              身体记录
            </Link>
            <Link
              href="/exercise"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Dumbbell className="h-4 w-4" />
              运动记录
            </Link>
          </div>
        </div>

        {!hasCompletedOnboarding ? (
          <Link
            href="/onboarding"
            className="mt-5 flex items-center justify-between rounded-[1.5rem] bg-primary/10 px-4 py-4 text-sm text-primary"
          >
            <span>还没有完成设置引导，先生成你的专属碳循环计划。</span>
            <Sparkles className="h-4 w-4" />
          </Link>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricRing
          label="卡路里"
          actual={dailyProgress.calories.actual}
          target={dailyProgress.calories.target}
          unit="kcal"
          colorClass="text-emerald-500"
        />
        <MetricRing
          label="蛋白质"
          actual={dailyProgress.protein.actual}
          target={dailyProgress.protein.target}
          unit="g"
          colorClass="text-green-600"
        />
        <MetricRing
          label="脂肪"
          actual={dailyProgress.fat.actual}
          target={dailyProgress.fat.target}
          unit="g"
          colorClass="text-lime-500"
        />
        <MetricRing
          label="碳水"
          actual={dailyProgress.carbs.actual}
          target={dailyProgress.carbs.target}
          unit="g"
          colorClass="text-teal-500"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <WaterTracker />
        <WeeklySummaryCard report={latestWeeklySummary} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SmartSuggestion remainingMacros={remainingMacros} />
        <AiMealPlanner remainingMacros={remainingMacros} />
      </section>

      <section className="space-y-3">
        <SectionTitle eyebrow="MEALS" title="今日餐次" />
        <div className="grid gap-3 lg:grid-cols-2">
          {mealOrder.map((mealType) => (
            <MealSection
              key={mealType}
              mealType={mealType}
              meals={todayMeals.filter((meal) => meal.mealType === mealType)}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] bg-primary px-5 py-5 text-primary-foreground shadow-[0_16px_40px_rgba(22,163,74,0.28)]">
          <p className="text-sm font-medium text-primary-foreground/80">剩余可摄入</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold">{remainingCalories} kcal</h2>
              <p className="mt-1 text-sm text-primary-foreground/80">
                蛋白 {Math.round(dailyProgress.protein.remaining)}g · 脂肪 {Math.round(dailyProgress.fat.remaining)}g · 碳水{" "}
                {Math.round(dailyProgress.carbs.remaining)}g
              </p>
            </div>
            <div className="rounded-[1.35rem] bg-white/12 px-4 py-3 text-right text-sm">
              <p>{mealTypeLabels[MealType.SNACK]}最适合补足缺口</p>
              <p className="mt-1 text-primary-foreground/70">纤维累计 {Math.round(dailyProgress.fiber)}g</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
          <SectionTitle eyebrow="WEEK" title="本周碳循环" />
          <WeeklyStrip weeklyPlan={weeklyPlan} activeIndex={activeDayIndex} />
        </div>
      </section>
    </div>
  );
}
