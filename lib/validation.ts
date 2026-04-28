import { z } from "zod";

const genderSchema = z.enum(["MALE", "FEMALE"]);
const activityLevelSchema = z.enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"]);
const goalSchema = z.enum(["CUT", "MAINTAIN", "BULK"]);
const mealTypeSchema = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]);
const dayTypeSchema = z.enum(["HIGH_CARB", "MEDIUM_CARB", "LOW_CARB", "REST"]);
const exerciseTypeSchema = z.enum(["STRENGTH", "CARDIO", "HIIT", "FLEXIBILITY"]);
const foodCategorySchema = z.enum([
  "STAPLE",
  "MEAT",
  "VEGETABLE",
  "FRUIT",
  "DAIRY",
  "SNACK",
  "BEVERAGE",
  "OTHER"
]);

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(64),
  gender: genderSchema,
  age: z.number().int().min(12).max(99),
  height: z.number().min(100).max(260),
  weight: z.number().min(25).max(350),
  body_fat_percentage: z.number().min(0).max(75).nullable().optional(),
  training_days: z.array(z.number().int().min(0).max(6)).max(7),
  activity_level: activityLevelSchema,
  goal: goalSchema
});

export const createMealLogSchema = z.object({
  food_item_id: z.number().int().positive(),
  meal_type: mealTypeSchema,
  quantity_grams: z.number().positive().max(5000),
  date: z.string().datetime()
});

export const createDailyPlanSchema = z.object({
  date: z.string().datetime(),
  day_type: dayTypeSchema,
  target_calories: z.number().nonnegative().max(10000),
  target_protein_g: z.number().nonnegative().max(1000),
  target_fat_g: z.number().nonnegative().max(1000),
  target_carbs_g: z.number().nonnegative().max(1000),
  actual_calories: z.number().nonnegative().max(10000).optional(),
  actual_protein_g: z.number().nonnegative().max(1000).optional(),
  actual_fat_g: z.number().nonnegative().max(1000).optional(),
  actual_carbs_g: z.number().nonnegative().max(1000).optional()
});

export const createBodyRecordSchema = z.object({
  date: z.string().datetime(),
  weight: z.number().min(25).max(350),
  body_fat_percentage: z.number().min(0).max(75).nullable().optional(),
  waist_cm: z.number().min(20).max(300).nullable().optional(),
  note: z.string().max(500).optional()
});

export const createExerciseLogSchema = z.object({
  date: z.string().datetime(),
  exercise_name: z.string().trim().min(1).max(100),
  duration_minutes: z.number().int().positive().max(600),
  calories_burned: z.number().nonnegative().max(5000),
  exercise_type: exerciseTypeSchema
});

export const upsertWeeklyPlansSchema = z.object({
  plans: z.array(createDailyPlanSchema).min(1).max(7)
});

export const createFoodItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  name_zh: z.string().trim().min(1).max(100),
  category: foodCategorySchema,
  calories_per_100g: z.number().nonnegative().max(1000),
  protein_per_100g: z.number().nonnegative().max(100),
  fat_per_100g: z.number().nonnegative().max(100),
  carbs_per_100g: z.number().nonnegative().max(100),
  fiber_per_100g: z.number().nonnegative().max(100),
  gi_index: z.number().nonnegative().max(150).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  is_custom: z.boolean().optional()
});

export const barcodeParamSchema = z.object({
  barcode: z.string().trim().min(8).max(32).regex(/^[0-9A-Za-z-]+$/)
});

export const mealTemplateItemSchema = z.object({
  foodItemId: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(1).max(100),
  nameZh: z.string().trim().min(1).max(100),
  category: foodCategorySchema,
  quantityGrams: z.number().positive().max(5000),
  calories: z.number().nonnegative().max(10000),
  protein: z.number().nonnegative().max(1000),
  fat: z.number().nonnegative().max(1000),
  carbs: z.number().nonnegative().max(1000),
  fiber: z.number().nonnegative().max(1000)
});

export const createMealTemplateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  mealType: mealTypeSchema,
  dayTypes: z.array(dayTypeSchema).optional(),
  items: z.array(mealTemplateItemSchema).min(1).max(20)
});

export const upsertWaterLogSchema = z.object({
  date: z.string().datetime(),
  targetMl: z.number().int().positive().max(10000),
  amountMl: z.number().int().nonnegative().max(10000),
  entries: z
    .array(z.number().int().min(-5000).max(5000).refine((value) => value !== 0, "调整值不能为 0"))
    .max(100)
});

export const upsertWeeklySummariesSchema = z.object({
  summaries: z.array(
    z.object({
      weekKey: z.string().min(1).max(32),
      weekLabel: z.string().min(1).max(64),
      adherenceRate: z.number(),
      weightChange: z.number(),
      calorieAverage: z.number(),
      proteinAverage: z.number(),
      fatAverage: z.number(),
      carbsAverage: z.number(),
      motivationalMessage: z.string().min(1).max(500),
      comparisonJson: z.string().nullable().optional()
    })
  ).min(1).max(52)
});

export const upsertAchievementsSchema = z.object({
  achievements: z.array(
    z.object({
      key: z.string().min(1).max(64),
      title: z.string().min(1).max(100),
      description: z.string().min(1).max(500),
      unlocked: z.boolean(),
      unlockedAt: z.string().datetime().nullable().optional(),
      progress: z.number().min(0).max(100)
    })
  ).min(1).max(50)
});

export type CreateFoodItemInput = z.infer<typeof createFoodItemSchema>;
