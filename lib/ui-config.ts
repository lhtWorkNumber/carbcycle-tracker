import {
  ActivityLevel,
  type ActivityLevel as ActivityLevelType,
  DayType,
  type DayType as DayTypeType,
  ExerciseType,
  type ExerciseType as ExerciseTypeType,
  FoodCategory,
  type FoodCategory as FoodCategoryType,
  Goal,
  type Goal as GoalType,
  MealType,
  type MealType as MealTypeType
} from "@/lib/domain";

export const dayTypeMeta: Record<
  DayTypeType,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    softClass: string;
    dotClass: string;
  }
> = {
  [DayType.HIGH_CARB]: {
    label: "高碳日",
    shortLabel: "高碳",
    badgeClass: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/20",
    softClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    dotClass: "bg-emerald-500"
  },
  [DayType.MEDIUM_CARB]: {
    label: "中碳日",
    shortLabel: "中碳",
    badgeClass: "bg-lime-500/12 text-lime-700 dark:text-lime-300 ring-1 ring-inset ring-lime-500/20",
    softClass: "bg-lime-500/10 text-lime-700 dark:text-lime-300",
    dotClass: "bg-lime-500"
  },
  [DayType.LOW_CARB]: {
    label: "低碳日",
    shortLabel: "低碳",
    badgeClass: "bg-teal-500/12 text-teal-700 dark:text-teal-300 ring-1 ring-inset ring-teal-500/20",
    softClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
    dotClass: "bg-teal-500"
  },
  [DayType.REST]: {
    label: "休息日",
    shortLabel: "休息",
    badgeClass: "bg-slate-500/12 text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-500/20",
    softClass: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    dotClass: "bg-slate-500"
  }
};

export const mealTypeLabels: Record<MealTypeType, string> = {
  [MealType.BREAKFAST]: "早餐",
  [MealType.LUNCH]: "午餐",
  [MealType.DINNER]: "晚餐",
  [MealType.SNACK]: "加餐"
};

export const goalLabels: Record<GoalType, string> = {
  [Goal.CUT]: "减脂",
  [Goal.MAINTAIN]: "维持",
  [Goal.BULK]: "增肌"
};

export const activityLevelLabels: Record<ActivityLevelType, string> = {
  [ActivityLevel.SEDENTARY]: "久坐少动",
  [ActivityLevel.LIGHT]: "轻度活动",
  [ActivityLevel.MODERATE]: "中等活动",
  [ActivityLevel.ACTIVE]: "高活动量",
  [ActivityLevel.VERY_ACTIVE]: "非常活跃"
};

export const foodCategoryLabels: Record<FoodCategoryType, string> = {
  [FoodCategory.STAPLE]: "主食",
  [FoodCategory.MEAT]: "肉类",
  [FoodCategory.VEGETABLE]: "蔬菜",
  [FoodCategory.FRUIT]: "水果",
  [FoodCategory.DAIRY]: "乳制品",
  [FoodCategory.SNACK]: "零食",
  [FoodCategory.BEVERAGE]: "饮品",
  [FoodCategory.OTHER]: "其他"
};

export const exerciseTypeLabels: Record<ExerciseTypeType, string> = {
  [ExerciseType.STRENGTH]: "力量训练",
  [ExerciseType.CARDIO]: "有氧",
  [ExerciseType.HIIT]: "HIIT",
  [ExerciseType.FLEXIBILITY]: "柔韧"
};
