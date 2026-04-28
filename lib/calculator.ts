import {
  ActivityLevel,
  DayType,
  Gender,
  Goal,
  MealType,
  type Achievement,
  type BodyRecordEntry,
  type DailyPlan,
  type ExerciseEntry,
  type FoodItemSummary,
  type LoggedMeal,
  type MacroResult,
  type MealTemplateItem,
  type RemainingMacros,
  type SuggestedFood,
  type SuggestedMealPlan,
  type WaterLog,
  type WeeklySummaryReport
} from "@/lib/domain";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  [ActivityLevel.SEDENTARY]: 1.2,
  [ActivityLevel.LIGHT]: 1.375,
  [ActivityLevel.MODERATE]: 1.55,
  [ActivityLevel.ACTIVE]: 1.725,
  [ActivityLevel.VERY_ACTIVE]: 1.9
};

const DAYS_IN_WEEK = 7;
const DEFAULT_REFERENCE_WEIGHT_KG = 70;

export interface FoodItemMacroSource {
  id: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
}

export interface ProgressMetric {
  actual: number;
  target: number;
  remaining: number;
  percentage: number;
}

export interface ProgressResult {
  calories: ProgressMetric;
  protein: ProgressMetric;
  fat: ProgressMetric;
  carbs: ProgressMetric;
  fiber: number;
}

export interface WeeklyMetricStats {
  actual: number;
  target: number;
  delta: number;
  percentage: number;
}

export interface WeeklyStats {
  days: number;
  calories: WeeklyMetricStats;
  protein: WeeklyMetricStats;
  fat: WeeklyMetricStats;
  carbs: WeeklyMetricStats;
}

export interface WeeklyPlanDay {
  dayIndex: number;
  date?: string;
  dayType: DayType;
  targetCalories: number;
  targetProteinG: number;
  targetFatG: number;
  targetCarbsG: number;
}

export interface WeeklyPlan {
  goal: Goal;
  weightKg: number;
  tdee: number;
  trainingDays: number[];
  weeklyMaintenanceCalories: number;
  weeklyTargetCalories: number;
  projectedWeeklyDelta: number;
  days: WeeklyPlanDay[];
}

export function calculateBMR(
  gender: Gender,
  age: number,
  weight_kg: number,
  height_cm: number
): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return roundTo(base + (gender === Gender.MALE ? 5 : -161));
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return roundTo(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function generateCarbCyclingPlan(
  tdee: number,
  goal: Goal,
  trainingDays: number[],
  weightKg = DEFAULT_REFERENCE_WEIGHT_KG
): WeeklyPlan {
  const normalizedTrainingDays = normalizeTrainingDays(trainingDays);
  const assignedDayTypes = assignDayTypes(normalizedTrainingDays);
  const weeklyMaintenanceCalories = tdee * DAYS_IN_WEEK;
  const baseWeeklyCalories = assignedDayTypes.reduce(
    (sum, dayType) => sum + getBaseDayCalories(tdee, dayType),
    0
  );
  const weeklyTargetCalories = getWeeklyTargetCalories(weeklyMaintenanceCalories, goal);
  const scalingFactor = baseWeeklyCalories > 0 ? weeklyTargetCalories / baseWeeklyCalories : 1;

  const days = assignedDayTypes.map((dayType, dayIndex) => {
    const targetCalories = getBaseDayCalories(tdee, dayType) * scalingFactor;
    const targets = buildMacroTargets(dayType, targetCalories, weightKg);

    return {
      dayIndex,
      dayType,
      targetCalories: roundTo(targetCalories),
      targetProteinG: targets.protein,
      targetFatG: targets.fat,
      targetCarbsG: targets.carbs
    };
  });

  const actualWeeklyCalories = days.reduce((sum, day) => sum + day.targetCalories, 0);

  return {
    goal,
    weightKg: roundTo(weightKg),
    tdee: roundTo(tdee),
    trainingDays: normalizedTrainingDays,
    weeklyMaintenanceCalories: roundTo(weeklyMaintenanceCalories),
    weeklyTargetCalories: roundTo(actualWeeklyCalories),
    projectedWeeklyDelta: roundTo(actualWeeklyCalories - weeklyMaintenanceCalories),
    days
  };
}

export function calculateFoodItemMacros(
  foodItem: FoodItemMacroSource,
  quantityGrams: number
): MacroResult {
  const multiplier = quantityGrams / 100;

  return {
    calories: roundTo(foodItem.caloriesPer100g * multiplier),
    protein: roundTo(foodItem.proteinPer100g * multiplier),
    fat: roundTo(foodItem.fatPer100g * multiplier),
    carbs: roundTo(foodItem.carbsPer100g * multiplier),
    fiber: roundTo(foodItem.fiberPer100g * multiplier)
  };
}

export async function calculateMealMacros(
  foodItemId: number,
  quantityGrams: number
): Promise<MacroResult> {
  const { prisma } = await import("@/lib/prisma");

  const foodItem = await prisma.foodItem.findUnique({
    where: { id: foodItemId },
    select: {
      id: true,
      calories_per_100g: true,
      protein_per_100g: true,
      fat_per_100g: true,
      carbs_per_100g: true,
      fiber_per_100g: true
    }
  });

  if (!foodItem) {
    throw new Error(`Food item ${foodItemId} was not found.`);
  }

  return calculateFoodItemMacros(
    {
      id: foodItem.id,
      caloriesPer100g: foodItem.calories_per_100g,
      proteinPer100g: foodItem.protein_per_100g,
      fatPer100g: foodItem.fat_per_100g,
      carbsPer100g: foodItem.carbs_per_100g,
      fiberPer100g: foodItem.fiber_per_100g
    },
    quantityGrams
  );
}

export function calculateDailyProgress(meals: LoggedMeal[], dailyPlan: DailyPlan): ProgressResult {
  const totals = meals.reduce<MacroResult>(
    (sum, meal) => ({
      calories: roundTo(sum.calories + meal.calories),
      protein: roundTo(sum.protein + meal.protein),
      fat: roundTo(sum.fat + meal.fat),
      carbs: roundTo(sum.carbs + meal.carbs),
      fiber: roundTo(sum.fiber + meal.fiber)
    }),
    {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0
    }
  );

  return {
    calories: buildProgressMetric(totals.calories, dailyPlan.targetCalories),
    protein: buildProgressMetric(totals.protein, dailyPlan.targetProteinG),
    fat: buildProgressMetric(totals.fat, dailyPlan.targetFatG),
    carbs: buildProgressMetric(totals.carbs, dailyPlan.targetCarbsG),
    fiber: totals.fiber
  };
}

export function calculateRemainingMacros(progress: ProgressResult): RemainingMacros {
  return {
    calories: Math.max(0, progress.calories.remaining),
    protein: Math.max(0, progress.protein.remaining),
    fat: Math.max(0, progress.fat.remaining),
    carbs: Math.max(0, progress.carbs.remaining),
    fiber: Math.max(0, 25 - progress.fiber)
  };
}

export function calculateWeeklyAverage(dailyPlans: DailyPlan[]): WeeklyStats {
  if (dailyPlans.length === 0) {
    return {
      days: 0,
      calories: emptyWeeklyMetric(),
      protein: emptyWeeklyMetric(),
      fat: emptyWeeklyMetric(),
      carbs: emptyWeeklyMetric()
    };
  }

  const caloriesActual = average(dailyPlans.map((plan) => plan.actualCalories ?? 0));
  const caloriesTarget = average(dailyPlans.map((plan) => plan.targetCalories));
  const proteinActual = average(dailyPlans.map((plan) => plan.actualProteinG ?? 0));
  const proteinTarget = average(dailyPlans.map((plan) => plan.targetProteinG));
  const fatActual = average(dailyPlans.map((plan) => plan.actualFatG ?? 0));
  const fatTarget = average(dailyPlans.map((plan) => plan.targetFatG));
  const carbsActual = average(dailyPlans.map((plan) => plan.actualCarbsG ?? 0));
  const carbsTarget = average(dailyPlans.map((plan) => plan.targetCarbsG));

  return {
    days: dailyPlans.length,
    calories: buildWeeklyMetric(caloriesActual, caloriesTarget),
    protein: buildWeeklyMetric(proteinActual, proteinTarget),
    fat: buildWeeklyMetric(fatActual, fatTarget),
    carbs: buildWeeklyMetric(carbsActual, carbsTarget)
  };
}

export function summarizeTemplateItems(items: MealTemplateItem[]): MacroResult {
  return items.reduce<MacroResult>(
    (totals, item) => ({
      calories: roundTo(totals.calories + item.calories),
      protein: roundTo(totals.protein + item.protein),
      fat: roundTo(totals.fat + item.fat),
      carbs: roundTo(totals.carbs + item.carbs),
      fiber: roundTo(totals.fiber + item.fiber)
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }
  );
}

export function suggestFoodsByRemainingMacros(
  remainingMacros: RemainingMacros,
  foods: FoodItemSummary[],
  limit = 5
): SuggestedFood[] {
  return foods
    .map((food) => {
      const proteinDensity = food.proteinPer100g;
      const carbDensity = food.carbsPer100g;
      const fatDensity = food.fatPer100g;
      const fiberDensity = food.fiberPer100g;
      const lowCarbPenalty = remainingMacros.carbs < 35 ? carbDensity * 2.2 : carbDensity * 0.4;
      const caloriePenalty = remainingMacros.calories > 0 ? food.caloriesPer100g / Math.max(remainingMacros.calories, 1) : 0;
      const proteinScore = remainingMacros.protein > 0 ? proteinDensity * 2.8 : 0;
      const carbScore = remainingMacros.carbs > 30 ? carbDensity * 1.7 : 0;
      const fatScore = remainingMacros.fat > 12 ? fatDensity * 1.4 : 0;
      const fiberScore = (remainingMacros.fiber ?? 0) > 0 ? fiberDensity * 1.2 : 0;
      const balanceBonus =
        proteinDensity > 12 && carbDensity < Math.max(remainingMacros.carbs, 30) ? 12 : 0;
      const score = roundTo(proteinScore + carbScore + fatScore + fiberScore + balanceBonus - lowCarbPenalty - caloriePenalty);

      return {
        ...food,
        score,
        reason: buildSuggestionReason(food, remainingMacros)
      };
    })
    .filter((food) => food.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function generateAiMealPlan(
  remainingMacros: RemainingMacros,
  foods: FoodItemSummary[],
  remainingMealTypes: MealType[]
): SuggestedMealPlan[] {
  const mealSlots = remainingMealTypes.length > 0 ? remainingMealTypes : [MealType.SNACK];
  let remaining = { ...remainingMacros };

  return mealSlots.map((mealType, index) => {
    const slotsLeft = mealSlots.length - index;
    const mealTarget: RemainingMacros = {
      calories: remaining.calories / slotsLeft,
      protein: remaining.protein / slotsLeft,
      fat: remaining.fat / slotsLeft,
      carbs: remaining.carbs / slotsLeft,
      fiber: (remaining.fiber ?? 0) / slotsLeft
    };

    const proteinFood = pickBestFood(
      foods,
      (food) => food.proteinPer100g * 3 - food.carbsPer100g - food.fatPer100g * 0.5
    );
    const carbFood = mealTarget.carbs > 25
      ? pickBestFood(foods, (food) => food.carbsPer100g * 2 + food.fiberPer100g - food.fatPer100g)
      : null;
    const veggieFood = pickBestFood(
      foods,
      (food) => food.fiberPer100g * 3 + food.proteinPer100g - food.caloriesPer100g / 40
    );

    const items: MealTemplateItem[] = [];

    if (proteinFood) {
      items.push(createTemplateItemFromFood(proteinFood, clamp((mealTarget.protein / Math.max(proteinFood.proteinPer100g, 1)) * 100, 80, 220)));
    }

    if (carbFood && carbFood.id !== proteinFood?.id) {
      items.push(createTemplateItemFromFood(carbFood, clamp((mealTarget.carbs / Math.max(carbFood.carbsPer100g, 1)) * 100, 60, 220)));
    }

    if (veggieFood && veggieFood.id !== proteinFood?.id && veggieFood.id !== carbFood?.id) {
      items.push(createTemplateItemFromFood(veggieFood, 120));
    }

    const totals = summarizeTemplateItems(items);
    remaining = {
      calories: Math.max(0, remaining.calories - totals.calories),
      protein: Math.max(0, remaining.protein - totals.protein),
      fat: Math.max(0, remaining.fat - totals.fat),
      carbs: Math.max(0, remaining.carbs - totals.carbs),
      fiber: Math.max(0, (remaining.fiber ?? 0) - totals.fiber)
    };

    return {
      mealType,
      title: buildAiMealTitle(mealType, items),
      foods: items,
      totals
    };
  });
}

export function calculateCheckInStreak({
  meals,
  bodyRecords,
  exercises,
  waterLogs,
  referenceDate = new Date()
}: {
  meals: LoggedMeal[];
  bodyRecords: BodyRecordEntry[];
  exercises: ExerciseEntry[];
  waterLogs: WaterLog[];
  referenceDate?: Date | string;
}) {
  const dateSet = new Set<string>([
    ...meals.map((meal) => meal.date),
    ...bodyRecords.map((record) => record.date),
    ...exercises.map((exercise) => exercise.date),
    ...waterLogs.filter((log) => log.amountMl > 0).map((log) => log.date)
  ]);

  let streak = 0;
  const cursor = toDate(referenceDate);

  while (dateSet.has(formatDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function calculateAchievements({
  bodyRecords,
  weeklySummaries,
  streakDays
}: {
  bodyRecords: BodyRecordEntry[];
  weeklySummaries: WeeklySummaryReport[];
  streakDays: number;
}): Achievement[] {
  const uniqueRecordDays = new Set(bodyRecords.map((record) => record.date)).size;
  const latestSummary = weeklySummaries.at(-1);
  const firstWeight = bodyRecords.at(0)?.weight ?? 0;
  const latestWeight = bodyRecords.at(-1)?.weight ?? 0;
  const lostWeight = Math.max(0, firstWeight - latestWeight);

  return [
    {
      id: "streak-7",
      title: "连续7天达标",
      description: "连续 7 天保持高执行率并完成记录",
      unlocked: streakDays >= 7 && (latestSummary?.adherenceRate ?? 0) >= 90,
      progress: roundTo(Math.min(100, ((streakDays / 7) * 100 + ((latestSummary?.adherenceRate ?? 0) / 90) * 50) / 1.5)),
      unlockedAt: streakDays >= 7 ? new Date().toISOString() : undefined
    },
    {
      id: "record-30",
      title: "记录满30天",
      description: "累计记录满 30 天",
      unlocked: uniqueRecordDays >= 30,
      progress: roundTo(Math.min(100, (uniqueRecordDays / 30) * 100)),
      unlockedAt: uniqueRecordDays >= 30 ? new Date().toISOString() : undefined
    },
    {
      id: "weight-loss-5",
      title: "减重5kg",
      description: "累计体重下降 5kg",
      unlocked: lostWeight >= 5,
      progress: roundTo(Math.min(100, (lostWeight / 5) * 100)),
      unlockedAt: lostWeight >= 5 ? new Date().toISOString() : undefined
    }
  ];
}

export function generateWeeklySummaryReports({
  bodyRecords,
  meals,
  weeklyPlan,
  referenceDate = new Date()
}: {
  bodyRecords: BodyRecordEntry[];
  meals: LoggedMeal[];
  weeklyPlan: WeeklyPlan;
  referenceDate?: Date | string;
}): WeeklySummaryReport[] {
  const allDates = [
    ...bodyRecords.map((record) => record.date),
    ...meals.map((meal) => meal.date)
  ]
    .map((value) => toDate(value))
    .sort((left, right) => left.getTime() - right.getTime());

  if (allDates.length === 0) {
    return [];
  }

  const firstWeekStart = startOfWeek(allDates[0]);
  const lastReferenceDate = toDate(referenceDate);
  const reportWeeks: WeeklySummaryReport[] = [];

  for (let cursor = new Date(firstWeekStart); cursor <= lastReferenceDate; cursor = addDays(cursor, 7)) {
    const weekStart = startOfWeek(cursor);
    const weekEnd = addDays(weekStart, 6);

    if (weekEnd > lastReferenceDate) {
      break;
    }

    const dates = Array.from({ length: 7 }, (_, index) => formatDateKey(addDays(weekStart, index)));
    const dailyPlans = dates.map((date, dayIndex) => {
      const mealsForDay = meals.filter((meal) => meal.date === date);
      const totals = mealsForDay.reduce<MacroResult>(
        (sum, meal) => ({
          calories: sum.calories + meal.calories,
          protein: sum.protein + meal.protein,
          fat: sum.fat + meal.fat,
          carbs: sum.carbs + meal.carbs,
          fiber: sum.fiber + meal.fiber
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }
      );

      const dayPlan = weeklyPlan.days[dayIndex];

      return {
        dayType: dayPlan.dayType,
        targetCalories: dayPlan.targetCalories,
        targetProteinG: dayPlan.targetProteinG,
        targetFatG: dayPlan.targetFatG,
        targetCarbsG: dayPlan.targetCarbsG,
        actualCalories: totals.calories,
        actualProteinG: totals.protein,
        actualFatG: totals.fat,
        actualCarbsG: totals.carbs
      } satisfies DailyPlan;
    });

    const weeklyAverage = calculateWeeklyAverage(dailyPlans);
    const adherenceRate = roundTo(
      average(
        dailyPlans.map((plan) =>
          plan.targetCalories > 0 ? Math.min(1.2, (plan.actualCalories ?? 0) / plan.targetCalories) : 0
        )
      ) * 100
    );
    const bodyRecordsInWeek = bodyRecords
      .filter((record) => record.date >= dates[0] && record.date <= dates[6])
      .sort((left, right) => left.date.localeCompare(right.date));
    const weightChange =
      bodyRecordsInWeek.length > 1
        ? roundTo((bodyRecordsInWeek.at(-1)?.weight ?? 0) - (bodyRecordsInWeek[0]?.weight ?? 0))
        : 0;

    reportWeeks.push({
      weekKey: dates[0],
      weekLabel: `${dates[0].slice(5).replace("-", "/")} - ${dates[6].slice(5).replace("-", "/")}`,
      createdAt: new Date().toISOString(),
      adherenceRate,
      weightChange,
      calorieAverage: weeklyAverage.calories.actual,
      proteinAverage: weeklyAverage.protein.actual,
      fatAverage: weeklyAverage.fat.actual,
      carbsAverage: weeklyAverage.carbs.actual,
      motivationalMessage: buildMotivationalMessage(adherenceRate, weightChange)
    });
  }

  return reportWeeks.map((report, index) => {
    const lastWeek = reportWeeks[index - 1];

    return {
      ...report,
      lastWeekComparison: lastWeek
        ? {
            adherenceRateDelta: roundTo(report.adherenceRate - lastWeek.adherenceRate),
            weightChangeDelta: roundTo(report.weightChange - lastWeek.weightChange),
            caloriesDelta: roundTo(report.calorieAverage - lastWeek.calorieAverage),
            proteinDelta: roundTo(report.proteinAverage - lastWeek.proteinAverage),
            carbsDelta: roundTo(report.carbsAverage - lastWeek.carbsAverage)
          }
        : undefined
    };
  });
}

function buildProgressMetric(actual: number, target: number): ProgressMetric {
  return {
    actual: roundTo(actual),
    target: roundTo(target),
    remaining: roundTo(target - actual),
    percentage: toPercentage(actual, target)
  };
}

function buildWeeklyMetric(actual: number, target: number): WeeklyMetricStats {
  return {
    actual: roundTo(actual),
    target: roundTo(target),
    delta: roundTo(actual - target),
    percentage: toPercentage(actual, target)
  };
}

function emptyWeeklyMetric(): WeeklyMetricStats {
  return {
    actual: 0,
    target: 0,
    delta: 0,
    percentage: 0
  };
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeTrainingDays(trainingDays: number[]): number[] {
  const uniqueDays = Array.from(new Set(trainingDays));

  if (uniqueDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new Error("trainingDays must contain unique integer day indices between 0 and 6.");
  }

  return uniqueDays.sort((a, b) => a - b);
}

function assignDayTypes(trainingDays: number[]): DayType[] {
  if (trainingDays.length === 0) {
    return Array.from({ length: DAYS_IN_WEEK }, () => DayType.REST);
  }

  const trainingSet = new Set(trainingDays);
  const preTrainingSet = new Set(trainingDays.map((day) => (day + 6) % DAYS_IN_WEEK));

  return Array.from({ length: DAYS_IN_WEEK }, (_, dayIndex) => {
    if (trainingSet.has(dayIndex)) {
      return DayType.HIGH_CARB;
    }

    if (preTrainingSet.has(dayIndex)) {
      return DayType.MEDIUM_CARB;
    }

    return DayType.LOW_CARB;
  });
}

function getBaseDayCalories(tdee: number, dayType: DayType): number {
  switch (dayType) {
    case DayType.HIGH_CARB:
      return tdee * 1.1;
    case DayType.MEDIUM_CARB:
      return tdee * 0.95;
    case DayType.LOW_CARB:
      return tdee * 0.75;
    case DayType.REST:
      return tdee * 0.7;
  }
}

function getWeeklyTargetCalories(weeklyMaintenanceCalories: number, goal: Goal): number {
  switch (goal) {
    case Goal.CUT:
      return Math.max(0, weeklyMaintenanceCalories - 3500);
    case Goal.MAINTAIN:
      return weeklyMaintenanceCalories;
    case Goal.BULK:
      return weeklyMaintenanceCalories + 1750;
  }
}

function buildMacroTargets(
  dayType: DayType,
  targetCalories: number,
  weightKg: number
): Omit<MacroResult, "fiber"> {
  switch (dayType) {
    case DayType.HIGH_CARB:
      return fillRemainingWithCarbs(targetCalories, 2 * weightKg, 0.5 * weightKg);
    case DayType.MEDIUM_CARB:
      return fillRemainingWithCarbs(targetCalories, 2.2 * weightKg, 0.8 * weightKg);
    case DayType.LOW_CARB:
      return fillLowCarbTargets(targetCalories, 2.5 * weightKg, weightKg, 49);
    case DayType.REST:
      return fillLowCarbTargets(targetCalories, 2 * weightKg, weightKg, 29);
  }
}

function fillRemainingWithCarbs(
  targetCalories: number,
  protein: number,
  fat: number
): Omit<MacroResult, "fiber"> {
  const remainingCalories = targetCalories - protein * 4 - fat * 9;
  const carbs = Math.max(0, remainingCalories / 4);

  return {
    calories: roundTo(targetCalories),
    protein: roundTo(protein),
    fat: roundTo(fat),
    carbs: roundTo(carbs)
  };
}

function fillLowCarbTargets(
  targetCalories: number,
  protein: number,
  minimumFat: number,
  carbCap: number
): Omit<MacroResult, "fiber"> {
  const maxCarbsByCalories = Math.max(0, (targetCalories - protein * 4 - minimumFat * 9) / 4);
  const carbs = Math.min(carbCap, maxCarbsByCalories);
  const calculatedFat = (targetCalories - protein * 4 - carbs * 4) / 9;
  const fat = Math.max(minimumFat, calculatedFat);

  return {
    calories: roundTo(targetCalories),
    protein: roundTo(protein),
    fat: roundTo(fat),
    carbs: roundTo(carbs)
  };
}

function buildSuggestionReason(food: FoodItemSummary, remainingMacros: RemainingMacros) {
  if (remainingMacros.protein > remainingMacros.carbs && food.proteinPer100g >= 20 && food.carbsPer100g <= 10) {
    return "蛋白质缺口较大，适合补蛋白且不容易超碳水。";
  }

  if (remainingMacros.carbs >= 45 && food.carbsPer100g >= 18) {
    return "当前更需要补碳水，适合回填训练日能量。";
  }

  if (remainingMacros.fat >= 15 && food.fatPer100g >= 8 && food.carbsPer100g <= 15) {
    return "脂肪空间还够，适合补充饱腹感与风味。";
  }

  return "营养结构较均衡，适合作为当前剩余目标的搭配。";
}

function buildAiMealTitle(mealType: MealType, items: MealTemplateItem[]) {
  const mealLabel =
    mealType === MealType.BREAKFAST
      ? "早餐"
      : mealType === MealType.LUNCH
        ? "午餐"
        : mealType === MealType.DINNER
          ? "晚餐"
          : "加餐";

  const leadingFood = items[0]?.nameZh ?? "推荐组合";
  return `AI推荐${mealLabel} · ${leadingFood}`;
}

export function createTemplateItemFromFood(food: FoodItemSummary, quantityGrams: number): MealTemplateItem {
  return {
    foodItemId: food.id,
    name: food.name,
    nameZh: food.nameZh,
    category: food.category,
    quantityGrams: roundTo(quantityGrams),
    ...calculateFoodItemMacros(
      {
        id: food.id,
        caloriesPer100g: food.caloriesPer100g,
        proteinPer100g: food.proteinPer100g,
        fatPer100g: food.fatPer100g,
        carbsPer100g: food.carbsPer100g,
        fiberPer100g: food.fiberPer100g
      },
      quantityGrams
    )
  };
}

function pickBestFood(foods: FoodItemSummary[], scoringFn: (food: FoodItemSummary) => number) {
  return [...foods].sort((left, right) => scoringFn(right) - scoringFn(left))[0] ?? null;
}

function buildMotivationalMessage(adherenceRate: number, weightChange: number) {
  if (adherenceRate >= 92 && weightChange <= -0.2) {
    return "这周执行得很稳，体重趋势也在按计划推进，继续保持。";
  }

  if (adherenceRate >= 85) {
    return "整体执行不错，再把周末和加餐收紧一点，下一周会更漂亮。";
  }

  if (weightChange > 0.3) {
    return "体重略有回弹，优先检查隐形热量和训练后额外加餐。";
  }

  return "先把记录完整度拉起来，连续几天稳定执行后，数据会更有参考价值。";
}

function startOfWeek(date: Date) {
  const clone = new Date(date);
  const day = (clone.getDay() + 6) % 7;
  clone.setHours(0, 0, 0, 0);
  clone.setDate(clone.getDate() - day);
  return clone;
}

function addDays(date: Date, amount: number) {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + amount);
  return clone;
}

function toDate(value: Date | string) {
  return typeof value === "string" ? new Date(value) : new Date(value.getTime());
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toPercentage(actual: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return roundTo((actual / target) * 100);
}

function roundTo(value: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
