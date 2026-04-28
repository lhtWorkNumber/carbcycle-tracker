export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE"
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export const ActivityLevel = {
  SEDENTARY: "SEDENTARY",
  LIGHT: "LIGHT",
  MODERATE: "MODERATE",
  ACTIVE: "ACTIVE",
  VERY_ACTIVE: "VERY_ACTIVE"
} as const;

export type ActivityLevel = (typeof ActivityLevel)[keyof typeof ActivityLevel];

export const Goal = {
  CUT: "CUT",
  MAINTAIN: "MAINTAIN",
  BULK: "BULK"
} as const;

export type Goal = (typeof Goal)[keyof typeof Goal];

export const FoodCategory = {
  STAPLE: "STAPLE",
  MEAT: "MEAT",
  VEGETABLE: "VEGETABLE",
  FRUIT: "FRUIT",
  DAIRY: "DAIRY",
  SNACK: "SNACK",
  BEVERAGE: "BEVERAGE",
  OTHER: "OTHER"
} as const;

export type FoodCategory = (typeof FoodCategory)[keyof typeof FoodCategory];

export const MealType = {
  BREAKFAST: "BREAKFAST",
  LUNCH: "LUNCH",
  DINNER: "DINNER",
  SNACK: "SNACK"
} as const;

export type MealType = (typeof MealType)[keyof typeof MealType];

export const DayType = {
  HIGH_CARB: "HIGH_CARB",
  MEDIUM_CARB: "MEDIUM_CARB",
  LOW_CARB: "LOW_CARB",
  REST: "REST"
} as const;

export type DayType = (typeof DayType)[keyof typeof DayType];

export const ExerciseType = {
  STRENGTH: "STRENGTH",
  CARDIO: "CARDIO",
  HIIT: "HIIT",
  FLEXIBILITY: "FLEXIBILITY"
} as const;

export type ExerciseType = (typeof ExerciseType)[keyof typeof ExerciseType];

export interface UserProfile {
  name: string;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  bodyFatPercentage?: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  trainingDays: number[];
}

export interface MacroResult {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export interface RemainingMacros {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
}

export interface FoodItemSummary {
  id: number;
  name: string;
  nameZh: string;
  category: FoodCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
  giIndex?: number | null;
  imageUrl?: string | null;
  isCustom: boolean;
}

export interface BootstrapPayload {
  profile: UserProfile | null;
  meals: LoggedMeal[];
  bodyRecords: BodyRecordEntry[];
  exercises: ExerciseEntry[];
  dailyPlans: DailyPlan[];
  mealTemplates: MealTemplate[];
  waterLogs: WaterLog[];
  weeklySummaries: WeeklySummaryReport[];
  achievements: Achievement[];
}

export interface LoggedMeal extends MacroResult {
  id: string;
  foodItemId: number;
  name: string;
  nameZh: string;
  category: FoodCategory;
  mealType: MealType;
  quantityGrams: number;
  date: string;
  createdAt: string;
}

export interface MealTemplateItem extends MacroResult {
  foodItemId?: number;
  name: string;
  nameZh: string;
  category: FoodCategory;
  quantityGrams: number;
}

export interface MealTemplate {
  id: string;
  name: string;
  mealType: MealType;
  items: MealTemplateItem[];
  dayTypes?: DayType[];
  builtIn?: boolean;
}

export interface DailyPlan {
  id?: string | number;
  date?: string | Date;
  dayType: DayType;
  targetCalories: number;
  targetProteinG: number;
  targetFatG: number;
  targetCarbsG: number;
  actualCalories?: number;
  actualProteinG?: number;
  actualFatG?: number;
  actualCarbsG?: number;
}

export interface BodyRecordEntry {
  id: string;
  date: string;
  weight: number;
  bodyFatPercentage?: number;
  waistCm?: number;
  note?: string;
}

export interface ExerciseEntry {
  id: string;
  date: string;
  exerciseName: string;
  durationMinutes: number;
  caloriesBurned: number;
  exerciseType: ExerciseType;
}

export interface WaterLog {
  date: string;
  targetMl: number;
  amountMl: number;
  entries: number[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
}

export interface WeeklySummaryComparison {
  adherenceRateDelta: number;
  weightChangeDelta: number;
  caloriesDelta: number;
  proteinDelta: number;
  carbsDelta: number;
}

export interface WeeklySummaryReport {
  weekKey: string;
  weekLabel: string;
  createdAt: string;
  adherenceRate: number;
  weightChange: number;
  calorieAverage: number;
  proteinAverage: number;
  fatAverage: number;
  carbsAverage: number;
  lastWeekComparison?: WeeklySummaryComparison;
  motivationalMessage: string;
}

export interface SuggestedFood extends FoodItemSummary {
  reason: string;
  score: number;
}

export interface SuggestedMealPlan {
  mealType: MealType;
  title: string;
  foods: MealTemplateItem[];
  totals: MacroResult;
}
