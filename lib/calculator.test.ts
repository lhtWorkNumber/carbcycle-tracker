import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    foodItem: {
      findUnique: findUniqueMock
    }
  }
}));

import {
  calculateBMR,
  calculateDailyProgress,
  calculateFoodItemMacros,
  calculateMealMacros,
  calculateTDEE,
  calculateWeeklyAverage,
  generateCarbCyclingPlan
} from "@/lib/calculator";
import { ActivityLevel, DayType, Gender, Goal, MealType, type DailyPlan, type LoggedMeal } from "@/lib/domain";

describe("calculateBMR", () => {
  it("calculates male BMR with the Mifflin-St Jeor formula", () => {
    expect(calculateBMR(Gender.MALE, 30, 80, 180)).toBe(1780);
  });

  it("calculates female BMR with the Mifflin-St Jeor formula", () => {
    expect(calculateBMR(Gender.FEMALE, 28, 60, 165)).toBe(1330.25);
  });
});

describe("calculateTDEE", () => {
  it("applies the correct activity multiplier", () => {
    expect(calculateTDEE(1780, ActivityLevel.MODERATE)).toBe(2759);
    expect(calculateTDEE(1330.25, ActivityLevel.LIGHT)).toBe(1829.09);
  });
});

describe("generateCarbCyclingPlan", () => {
  it("builds a cut plan with high, medium, and low days and hits the weekly deficit target", () => {
    const plan = generateCarbCyclingPlan(2200, Goal.CUT, [1, 3, 5], 70);

    expect(plan.trainingDays).toEqual([1, 3, 5]);
    expect(plan.days.map((day) => day.dayType)).toEqual([
      DayType.MEDIUM_CARB,
      DayType.HIGH_CARB,
      DayType.MEDIUM_CARB,
      DayType.HIGH_CARB,
      DayType.MEDIUM_CARB,
      DayType.HIGH_CARB,
      DayType.LOW_CARB
    ]);
    expect(plan.weeklyMaintenanceCalories).toBe(15400);
    expect(plan.weeklyTargetCalories).toBeCloseTo(11900, 0);
    expect(plan.projectedWeeklyDelta).toBeCloseTo(-3500, 0);
    expect(plan.days[1].targetCalories).toBeGreaterThan(plan.days[0].targetCalories);
    expect(plan.days[0].targetCalories).toBeGreaterThan(plan.days[6].targetCalories);
    expect(plan.days[6].targetCarbsG).toBeLessThan(50);
  });

  it("falls back to REST days when no training days are provided", () => {
    const plan = generateCarbCyclingPlan(2000, Goal.MAINTAIN, [], 65);

    expect(plan.days).toHaveLength(7);
    expect(plan.days.every((day) => day.dayType === DayType.REST)).toBe(true);
    expect(plan.days.every((day) => day.targetCarbsG < 30)).toBe(true);
  });

  it("rejects invalid day indices", () => {
    expect(() => generateCarbCyclingPlan(2200, Goal.CUT, [0, 7], 70)).toThrow(
      "trainingDays must contain unique integer day indices between 0 and 6."
    );
  });
});

describe("calculateFoodItemMacros", () => {
  it("scales macros from a known food source", () => {
    expect(
      calculateFoodItemMacros(
        {
          id: 1,
          caloriesPer100g: 165,
          proteinPer100g: 31,
          fatPer100g: 3.6,
          carbsPer100g: 0,
          fiberPer100g: 0
        },
        150
      )
    ).toEqual({
      calories: 247.5,
      protein: 46.5,
      fat: 5.4,
      carbs: 0,
      fiber: 0
    });
  });
});

describe("calculateMealMacros", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
  });

  it("loads a food item by id and scales macros", async () => {
    findUniqueMock.mockResolvedValue({
      id: 1,
      calories_per_100g: 165,
      protein_per_100g: 31,
      fat_per_100g: 3.6,
      carbs_per_100g: 0,
      fiber_per_100g: 0
    });

    await expect(calculateMealMacros(1, 150)).resolves.toEqual({
      calories: 247.5,
      protein: 46.5,
      fat: 5.4,
      carbs: 0,
      fiber: 0
    });
  });

  it("throws when the food item does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(calculateMealMacros(999, 100)).rejects.toThrow("Food item 999 was not found.");
  });
});

describe("calculateDailyProgress", () => {
  it("aggregates meal totals against a daily plan", () => {
    const meals: LoggedMeal[] = [
      {
        id: "meal-1",
        foodItemId: 1,
        name: "rice",
        nameZh: "米饭",
        category: "STAPLE",
        mealType: MealType.BREAKFAST,
        quantityGrams: 200,
        date: "2026-04-26",
        createdAt: "2026-04-26T08:00:00Z",
        calories: 232,
        protein: 5.2,
        fat: 0.6,
        carbs: 51.8,
        fiber: 0.6
      },
      {
        id: "meal-2",
        foodItemId: 2,
        name: "chicken",
        nameZh: "鸡胸肉",
        category: "MEAT",
        mealType: MealType.LUNCH,
        quantityGrams: 150,
        date: "2026-04-26",
        createdAt: "2026-04-26T12:00:00Z",
        calories: 247.5,
        protein: 46.5,
        fat: 5.4,
        carbs: 0,
        fiber: 0
      }
    ];

    const dailyPlan: DailyPlan = {
      dayType: DayType.HIGH_CARB,
      targetCalories: 2200,
      targetProteinG: 180,
      targetFatG: 60,
      targetCarbsG: 210
    };

    expect(calculateDailyProgress(meals, dailyPlan)).toEqual({
      calories: {
        actual: 479.5,
        target: 2200,
        remaining: 1720.5,
        percentage: 21.8
      },
      protein: {
        actual: 51.7,
        target: 180,
        remaining: 128.3,
        percentage: 28.72
      },
      fat: {
        actual: 6,
        target: 60,
        remaining: 54,
        percentage: 10
      },
      carbs: {
        actual: 51.8,
        target: 210,
        remaining: 158.2,
        percentage: 24.67
      },
      fiber: 0.6
    });
  });
});

describe("calculateWeeklyAverage", () => {
  it("returns averaged weekly stats from daily plans", () => {
    const dailyPlans: DailyPlan[] = [
      {
        dayType: DayType.HIGH_CARB,
        targetCalories: 2200,
        targetProteinG: 180,
        targetFatG: 60,
        targetCarbsG: 210,
        actualCalories: 2100,
        actualProteinG: 170,
        actualFatG: 58,
        actualCarbsG: 205
      },
      {
        dayType: DayType.LOW_CARB,
        targetCalories: 1700,
        targetProteinG: 185,
        targetFatG: 75,
        targetCarbsG: 49,
        actualCalories: 1600,
        actualProteinG: 180,
        actualFatG: 70,
        actualCarbsG: 45
      }
    ];

    expect(calculateWeeklyAverage(dailyPlans)).toEqual({
      days: 2,
      calories: {
        actual: 1850,
        target: 1950,
        delta: -100,
        percentage: 94.87
      },
      protein: {
        actual: 175,
        target: 182.5,
        delta: -7.5,
        percentage: 95.89
      },
      fat: {
        actual: 64,
        target: 67.5,
        delta: -3.5,
        percentage: 94.81
      },
      carbs: {
        actual: 125,
        target: 129.5,
        delta: -4.5,
        percentage: 96.53
      }
    });
  });

  it("returns zeroed stats for an empty week", () => {
    expect(calculateWeeklyAverage([])).toEqual({
      days: 0,
      calories: {
        actual: 0,
        target: 0,
        delta: 0,
        percentage: 0
      },
      protein: {
        actual: 0,
        target: 0,
        delta: 0,
        percentage: 0
      },
      fat: {
        actual: 0,
        target: 0,
        delta: 0,
        percentage: 0
      },
      carbs: {
        actual: 0,
        target: 0,
        delta: 0,
        percentage: 0
      }
    });
  });
});
