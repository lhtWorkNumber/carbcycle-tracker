import {
  ActivityLevel,
  DayType,
  ExerciseType,
  FoodCategory,
  Goal,
  MealType,
  type BodyRecordEntry,
  type ExerciseEntry,
  type FoodItemSummary,
  type LoggedMeal,
  type MealTemplate,
  type UserProfile,
  type WaterLog
} from "@/lib/domain";
import {
  calculateBMR,
  calculateFoodItemMacros,
  calculateTDEE,
  createTemplateItemFromFood,
  generateCarbCyclingPlan
} from "@/lib/calculator";
import { addDays, formatDateKey, getTodayDateString } from "@/lib/format";

export const defaultUserProfile: UserProfile = {
  name: "小林",
  gender: "MALE",
  age: 29,
  heightCm: 178,
  weightKg: 72,
  bodyFatPercentage: 16.5,
  activityLevel: ActivityLevel.MODERATE,
  goal: Goal.CUT,
  trainingDays: [0, 2, 4]
};

export const defaultBmr = calculateBMR(
  defaultUserProfile.gender,
  defaultUserProfile.age,
  defaultUserProfile.weightKg,
  defaultUserProfile.heightCm
);

export const defaultTdee = calculateTDEE(defaultBmr, defaultUserProfile.activityLevel);

export const defaultWeeklyPlan = generateCarbCyclingPlan(
  defaultTdee,
  defaultUserProfile.goal,
  defaultUserProfile.trainingDays,
  defaultUserProfile.weightKg
);

export const demoFoodCatalog: FoodItemSummary[] = [
  {
    id: 1001,
    name: "Greek Yogurt Oat Cup",
    nameZh: "希腊酸奶燕麦杯",
    category: FoodCategory.DAIRY,
    caloriesPer100g: 132,
    proteinPer100g: 8.1,
    fatPer100g: 3.8,
    carbsPer100g: 15.4,
    fiberPer100g: 2.4,
    isCustom: false
  },
  {
    id: 1002,
    name: "Chicken Brown Rice Bowl",
    nameZh: "鸡胸肉糙米饭",
    category: FoodCategory.MEAT,
    caloriesPer100g: 158,
    proteinPer100g: 15.2,
    fatPer100g: 3.2,
    carbsPer100g: 18.4,
    fiberPer100g: 1.2,
    isCustom: false
  },
  {
    id: 1003,
    name: "Salmon Sweet Potato Bowl",
    nameZh: "三文鱼红薯碗",
    category: FoodCategory.MEAT,
    caloriesPer100g: 172,
    proteinPer100g: 13.6,
    fatPer100g: 7.8,
    carbsPer100g: 11.8,
    fiberPer100g: 1.1,
    isCustom: false
  },
  {
    id: 1004,
    name: "Boiled Chicken Breast",
    nameZh: "鸡胸肉",
    category: FoodCategory.MEAT,
    caloriesPer100g: 165,
    proteinPer100g: 31,
    fatPer100g: 3.6,
    carbsPer100g: 0,
    fiberPer100g: 0,
    isCustom: false
  },
  {
    id: 1005,
    name: "Steamed White Rice",
    nameZh: "米饭",
    category: FoodCategory.STAPLE,
    caloriesPer100g: 116,
    proteinPer100g: 2.6,
    fatPer100g: 0.3,
    carbsPer100g: 25.9,
    fiberPer100g: 0.3,
    isCustom: false
  },
  {
    id: 1006,
    name: "Broccoli",
    nameZh: "西兰花",
    category: FoodCategory.VEGETABLE,
    caloriesPer100g: 34,
    proteinPer100g: 2.8,
    fatPer100g: 0.4,
    carbsPer100g: 6.6,
    fiberPer100g: 2.6,
    isCustom: false
  },
  {
    id: 1007,
    name: "Sweet Potato",
    nameZh: "红薯",
    category: FoodCategory.STAPLE,
    caloriesPer100g: 86,
    proteinPer100g: 1.6,
    fatPer100g: 0.1,
    carbsPer100g: 20.1,
    fiberPer100g: 3,
    isCustom: false
  },
  {
    id: 1008,
    name: "Salmon",
    nameZh: "三文鱼",
    category: FoodCategory.MEAT,
    caloriesPer100g: 208,
    proteinPer100g: 20.4,
    fatPer100g: 13.4,
    carbsPer100g: 0,
    fiberPer100g: 0,
    isCustom: false
  },
  {
    id: 1009,
    name: "Blueberries",
    nameZh: "蓝莓",
    category: FoodCategory.FRUIT,
    caloriesPer100g: 57,
    proteinPer100g: 0.7,
    fatPer100g: 0.3,
    carbsPer100g: 14.5,
    fiberPer100g: 2.4,
    isCustom: false
  },
  {
    id: 1010,
    name: "Tofu",
    nameZh: "豆腐",
    category: FoodCategory.OTHER,
    caloriesPer100g: 81,
    proteinPer100g: 8.1,
    fatPer100g: 4.8,
    carbsPer100g: 1.9,
    fiberPer100g: 0.3,
    isCustom: false
  }
];

const today = getTodayDateString();

function getFoodById(foodItemId: number) {
  return demoFoodCatalog.find((food) => food.id === foodItemId) ?? demoFoodCatalog[0];
}

function createLoggedMeal({
  id,
  foodItemId,
  mealType,
  quantityGrams,
  date
}: {
  id: string;
  foodItemId: number;
  mealType: MealType;
  quantityGrams: number;
  date: string;
}): LoggedMeal {
  const food = getFoodById(foodItemId);
  const macros = calculateFoodItemMacros(
    {
      id: food.id,
      caloriesPer100g: food.caloriesPer100g,
      proteinPer100g: food.proteinPer100g,
      fatPer100g: food.fatPer100g,
      carbsPer100g: food.carbsPer100g,
      fiberPer100g: food.fiberPer100g
    },
    quantityGrams
  );

  return {
    id,
    foodItemId: food.id,
    name: food.name,
    nameZh: food.nameZh,
    category: food.category,
    mealType,
    quantityGrams,
    date,
    createdAt: `${date}T08:00:00.000Z`,
    ...macros
  };
}

export const defaultMeals: LoggedMeal[] = [
  ...Array.from({ length: 8 }, (_, index) => {
    const date = formatDateKey(addDays(new Date(), -index));
    return [
      createLoggedMeal({
        id: `meal-breakfast-${index}`,
        foodItemId: index % 2 === 0 ? 1001 : 1009,
        mealType: MealType.BREAKFAST,
        quantityGrams: index % 2 === 0 ? 240 : 180,
        date
      }),
      createLoggedMeal({
        id: `meal-lunch-${index}`,
        foodItemId: 1002,
        mealType: MealType.LUNCH,
        quantityGrams: 320 - index * 5,
        date
      }),
      createLoggedMeal({
        id: `meal-dinner-${index}`,
        foodItemId: index % 2 === 0 ? 1003 : 1008,
        mealType: MealType.DINNER,
        quantityGrams: 260,
        date
      })
    ];
  }).flat(),
  createLoggedMeal({
    id: "meal-snack-today",
    foodItemId: 1006,
    mealType: MealType.SNACK,
    quantityGrams: 130,
    date: today
  })
];

export const defaultBodyRecords: BodyRecordEntry[] = Array.from({ length: 30 }, (_, index) => {
  const offset = 29 - index;
  const date = addDays(new Date(), -offset);
  const weight = 73.6 - index * 0.09 + Math.sin(index / 5) * 0.18;
  const bodyFatPercentage = 17.4 - index * 0.04 + Math.cos(index / 6) * 0.08;
  const waistCm = 83.4 - index * 0.08 + Math.sin(index / 4) * 0.15;

  return {
    id: `body-${index}`,
    date: formatDateKey(date),
    weight: Number(weight.toFixed(1)),
    bodyFatPercentage: Number(bodyFatPercentage.toFixed(1)),
    waistCm: Number(waistCm.toFixed(1)),
    note: index % 9 === 0 ? "睡眠充足，状态稳定" : undefined
  };
});

export const defaultExerciseEntries: ExerciseEntry[] = [
  {
    id: "exercise-1",
    date: today,
    exerciseName: "深蹲",
    durationMinutes: 45,
    caloriesBurned: 320,
    exerciseType: ExerciseType.STRENGTH
  },
  {
    id: "exercise-2",
    date: today,
    exerciseName: "跑步",
    durationMinutes: 28,
    caloriesBurned: 260,
    exerciseType: ExerciseType.CARDIO
  },
  {
    id: "exercise-3",
    date: formatDateKey(addDays(new Date(), -1)),
    exerciseName: "卧推",
    durationMinutes: 40,
    caloriesBurned: 240,
    exerciseType: ExerciseType.STRENGTH
  }
];

export const defaultWaterLogs: WaterLog[] = Array.from({ length: 7 }, (_, index) => {
  const date = formatDateKey(addDays(new Date(), -index));
  const entries = index === 0 ? [500, 250, 250, 500] : [500, 500, 250];

  return {
    date,
    targetMl: 2000,
    amountMl: entries.reduce((sum, value) => sum + value, 0),
    entries
  };
});

function buildTemplate(
  id: string,
  name: string,
  mealType: MealType,
  items: Array<{ foodItemId: number; quantityGrams: number }>,
  dayTypes?: DayType[]
): MealTemplate {
  return {
    id,
    name,
    mealType,
    dayTypes,
    builtIn: true,
    items: items.map(({ foodItemId, quantityGrams }) => createTemplateItemFromFood(getFoodById(foodItemId), quantityGrams))
  };
}

export const defaultMealTemplates: MealTemplate[] = [
  buildTemplate("tpl-high-breakfast", "高碳日早餐", MealType.BREAKFAST, [
    { foodItemId: 1001, quantityGrams: 220 },
    { foodItemId: 1005, quantityGrams: 180 },
    { foodItemId: 1009, quantityGrams: 80 }
  ], [DayType.HIGH_CARB]),
  buildTemplate("tpl-low-lunch", "低碳日午餐", MealType.LUNCH, [
    { foodItemId: 1004, quantityGrams: 180 },
    { foodItemId: 1006, quantityGrams: 160 },
    { foodItemId: 1010, quantityGrams: 120 }
  ], [DayType.LOW_CARB, DayType.REST]),
  buildTemplate("tpl-breakfast", "我的早餐模板", MealType.BREAKFAST, [
    { foodItemId: 1001, quantityGrams: 240 },
    { foodItemId: 1009, quantityGrams: 80 }
  ]),
  buildTemplate("tpl-dinner", "训练后晚餐", MealType.DINNER, [
    { foodItemId: 1008, quantityGrams: 180 },
    { foodItemId: 1007, quantityGrams: 220 },
    { foodItemId: 1006, quantityGrams: 120 }
  ], [DayType.HIGH_CARB, DayType.MEDIUM_CARB])
];

export const quickExercises = [
  {
    name: "深蹲",
    exerciseType: ExerciseType.STRENGTH,
    durationMinutes: 45,
    caloriesBurned: 320
  },
  {
    name: "卧推",
    exerciseType: ExerciseType.STRENGTH,
    durationMinutes: 35,
    caloriesBurned: 220
  },
  {
    name: "硬拉",
    exerciseType: ExerciseType.STRENGTH,
    durationMinutes: 35,
    caloriesBurned: 260
  },
  {
    name: "跑步",
    exerciseType: ExerciseType.CARDIO,
    durationMinutes: 30,
    caloriesBurned: 280
  },
  {
    name: "HIIT",
    exerciseType: ExerciseType.HIIT,
    durationMinutes: 20,
    caloriesBurned: 240
  }
] as const;

export const onboardingTrainingDayLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] as const;

export function getTodayPlanDay() {
  const jsDay = new Date().getDay();
  const mondayFirstIndex = (jsDay + 6) % 7;
  return defaultWeeklyPlan.days[mondayFirstIndex] ?? defaultWeeklyPlan.days[0];
}

export function createStatsSnapshot() {
  const bodyRecords = defaultBodyRecords.slice(-30);
  const weeklyAdherence = defaultWeeklyPlan.days.map((day, index) => {
    const biasByDayType =
      day.dayType === DayType.HIGH_CARB ? 0.96 : day.dayType === DayType.MEDIUM_CARB ? 0.92 : 0.9;
    const actualCalories = Math.round(day.targetCalories * (biasByDayType + (index % 2 === 0 ? 0.03 : -0.01)));

    return {
      day: onboardingTrainingDayLabels[index],
      targetCalories: day.targetCalories,
      actualCalories,
      adherence: Number(((actualCalories / day.targetCalories) * 100).toFixed(1))
    };
  });

  return {
    bodyRecords,
    weeklyAdherence,
    macroDistribution: [
      { name: "蛋白质", value: 34, fill: "#0f9f69" },
      { name: "脂肪", value: 26, fill: "#84cc16" },
      { name: "碳水", value: 40, fill: "#bbf7d0" }
    ]
  };
}
