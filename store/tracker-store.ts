import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  calculateAchievements,
  calculateBMR,
  calculateCheckInStreak,
  calculateTDEE,
  generateCarbCyclingPlan,
  generateWeeklySummaryReports,
  type WeeklyPlan
} from "@/lib/calculator";
import {
  defaultBodyRecords,
  defaultExerciseEntries,
  defaultMealTemplates,
  defaultMeals,
  defaultUserProfile,
  defaultWaterLogs
} from "@/lib/demo-data";
import {
  type Achievement,
  type BodyRecordEntry,
  type DailyPlan,
  type DayType,
  type ExerciseEntry,
  type LoggedMeal,
  type MealTemplate,
  type MealTemplateItem,
  type MealType,
  type UserProfile,
  type WaterLog,
  type WeeklySummaryReport
} from "@/lib/domain";
import { getTodayDateString, getWeekDateKeys } from "@/lib/format";

type ThemeMode = "light" | "dark";

type PlanTargetField = "targetCalories" | "targetProteinG" | "targetFatG" | "targetCarbsG";

interface AddMealInput extends Omit<LoggedMeal, "id" | "createdAt" | "date"> {
  date?: string;
}

interface AddBodyRecordInput extends Omit<BodyRecordEntry, "id" | "date"> {
  date?: string;
}

interface AddExerciseInput extends Omit<ExerciseEntry, "id" | "date"> {
  date?: string;
}

interface TrackerState {
  hasCompletedOnboarding: boolean;
  selectedDate: string;
  theme: ThemeMode;
  serverDataOwnerId: string | null;
  profile: UserProfile;
  bmr: number;
  tdee: number;
  weeklyPlan: WeeklyPlan;
  meals: LoggedMeal[];
  bodyRecords: BodyRecordEntry[];
  exercises: ExerciseEntry[];
  recentFoodIds: number[];
  mealTemplates: MealTemplate[];
  waterLogs: WaterLog[];
  dailyCheckInStreak: number;
  achievements: Achievement[];
  weeklySummaries: WeeklySummaryReport[];
  completeOnboarding: (profile: UserProfile) => void;
  clearServerData: () => void;
  setServerDataOwnerId: (userId: string | null) => void;
  hydrateProfileFromServer: (profile: UserProfile | null) => void;
  hydrateMealsFromServer: (meals: LoggedMeal[]) => void;
  insertMealFromServer: (meal: LoggedMeal) => void;
  hydrateBodyRecordsFromServer: (records: BodyRecordEntry[]) => void;
  insertBodyRecordFromServer: (record: BodyRecordEntry) => void;
  hydrateExercisesFromServer: (exercises: ExerciseEntry[]) => void;
  insertExerciseFromServer: (exercise: ExerciseEntry) => void;
  hydrateWeeklyPlanFromServer: (plans: DailyPlan[]) => void;
  hydrateMealTemplatesFromServer: (templates: MealTemplate[]) => void;
  insertMealTemplateFromServer: (template: MealTemplate) => void;
  hydrateWaterLogsFromServer: (logs: WaterLog[]) => void;
  upsertWaterLogFromServer: (log: WaterLog) => void;
  hydrateWeeklySummariesFromServer: (summaries: WeeklySummaryReport[]) => void;
  hydrateAchievementsFromServer: (achievements: Achievement[]) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  regeneratePlan: () => void;
  setSelectedDate: (date: string) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  addMeal: (meal: AddMealInput) => void;
  addMeals: (meals: AddMealInput[]) => void;
  addBodyRecord: (record: AddBodyRecordInput) => void;
  addExercise: (exercise: AddExerciseInput) => void;
  addWater: (amountMl: number, date?: string) => void;
  setWaterTarget: (targetMl: number, date?: string) => void;
  saveMealTemplate: (name: string, mealType: MealType, items: MealTemplateItem[]) => void;
  applyMealTemplate: (templateId: string, date?: string) => void;
  swapPlanDays: (fromIndex: number, toIndex: number) => void;
  setPlanDayType: (dayIndex: number, dayType: DayType) => void;
  updatePlanDayTarget: (dayIndex: number, field: PlanTargetField, value: number) => void;
}

function buildPlanState(profile: UserProfile) {
  const bmr = calculateBMR(profile.gender, profile.age, profile.weightKg, profile.heightCm);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const weeklyPlan = generateCarbCyclingPlan(tdee, profile.goal, profile.trainingDays, profile.weightKg);

  return { bmr, tdee, weeklyPlan };
}

function buildDerivedState({
  bodyRecords,
  meals,
  exercises,
  waterLogs,
  weeklyPlan
}: {
  bodyRecords: BodyRecordEntry[];
  meals: LoggedMeal[];
  exercises: ExerciseEntry[];
  waterLogs: WaterLog[];
  weeklyPlan: WeeklyPlan;
}) {
  const weeklySummaries = generateWeeklySummaryReports({
    bodyRecords,
    meals,
    weeklyPlan,
    referenceDate: getTodayDateString()
  });
  const dailyCheckInStreak = calculateCheckInStreak({
    meals,
    bodyRecords,
    exercises,
    waterLogs,
    referenceDate: getTodayDateString()
  });
  const achievements = calculateAchievements({
    bodyRecords,
    weeklySummaries,
    streakDays: dailyCheckInStreak
  });

  return {
    weeklySummaries,
    dailyCheckInStreak,
    achievements
  };
}

function createInitialState() {
  const planState = buildPlanState(defaultUserProfile);
  const derived = buildDerivedState({
    bodyRecords: defaultBodyRecords,
    meals: defaultMeals,
    exercises: defaultExerciseEntries,
    waterLogs: defaultWaterLogs,
    weeklyPlan: planState.weeklyPlan
  });

  return {
    hasCompletedOnboarding: true,
    selectedDate: getTodayDateString(),
    theme: "light" as ThemeMode,
    serverDataOwnerId: null,
    profile: defaultUserProfile,
    bmr: planState.bmr,
    tdee: planState.tdee,
    weeklyPlan: planState.weeklyPlan,
    meals: defaultMeals,
    bodyRecords: defaultBodyRecords,
    exercises: defaultExerciseEntries,
    recentFoodIds: defaultMeals.map((meal) => meal.foodItemId),
    mealTemplates: defaultMealTemplates,
    waterLogs: defaultWaterLogs,
    weeklySummaries: derived.weeklySummaries,
    dailyCheckInStreak: derived.dailyCheckInStreak,
    achievements: derived.achievements
  };
}

function createEmptyServerState() {
  const planState = buildPlanState(defaultUserProfile);

  return {
    hasCompletedOnboarding: false,
    serverDataOwnerId: null,
    profile: defaultUserProfile,
    bmr: planState.bmr,
    tdee: planState.tdee,
    weeklyPlan: planState.weeklyPlan,
    meals: [],
    bodyRecords: [],
    exercises: [],
    recentFoodIds: [],
    mealTemplates: [],
    waterLogs: [],
    weeklySummaries: [],
    dailyCheckInStreak: 0,
    achievements: []
  };
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function recalculateState(state: {
  bodyRecords: BodyRecordEntry[];
  meals: LoggedMeal[];
  exercises: ExerciseEntry[];
  waterLogs: WaterLog[];
  weeklyPlan: WeeklyPlan;
}) {
  return buildDerivedState(state);
}

function normalizeWaterLog(logs: WaterLog[], date: string, targetMl = 2000) {
  const existing = logs.find((log) => log.date === date);
  return existing ?? { date, targetMl, amountMl: 0, entries: [] };
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      clearServerData: () =>
        set(() => ({
          ...createEmptyServerState()
        })),
      setServerDataOwnerId: (serverDataOwnerId) => set({ serverDataOwnerId }),
      completeOnboarding: (profile) =>
        set((state) => {
          const planState = buildPlanState(profile);
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals: state.meals,
            exercises: state.exercises,
            waterLogs: state.waterLogs,
            weeklyPlan: planState.weeklyPlan
          });

          return {
            hasCompletedOnboarding: true,
            profile,
            bmr: planState.bmr,
            tdee: planState.tdee,
            weeklyPlan: planState.weeklyPlan,
            ...derived
          };
        }),
      hydrateProfileFromServer: (profile) =>
        set((state) => {
          if (!profile) {
            const planState = buildPlanState(defaultUserProfile);
            const derived = recalculateState({
              bodyRecords: state.bodyRecords,
              meals: state.meals,
              exercises: state.exercises,
              waterLogs: state.waterLogs,
              weeklyPlan: planState.weeklyPlan
            });

            return {
              hasCompletedOnboarding: false,
              profile: defaultUserProfile,
              bmr: planState.bmr,
              tdee: planState.tdee,
              weeklyPlan: planState.weeklyPlan,
              ...derived
            };
          }

          const planState = buildPlanState(profile);
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals: state.meals,
            exercises: state.exercises,
            waterLogs: state.waterLogs,
            weeklyPlan: planState.weeklyPlan
          });

          return {
            hasCompletedOnboarding: true,
            profile,
            bmr: planState.bmr,
            tdee: planState.tdee,
            weeklyPlan: planState.weeklyPlan,
            ...derived
          };
        }),
      hydrateMealsFromServer: (meals) =>
        set((state) => {
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals,
            exercises: state.exercises,
            waterLogs: state.waterLogs,
            weeklyPlan: state.weeklyPlan
          });

          return {
            meals,
            recentFoodIds: Array.from(new Set(meals.map((meal) => meal.foodItemId))).slice(0, 12),
            ...derived
          };
        }),
      insertMealFromServer: (meal) =>
        set((state) => {
          const meals = [meal, ...state.meals.filter((entry) => entry.id !== meal.id)];
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals,
            exercises: state.exercises,
            waterLogs: state.waterLogs,
            weeklyPlan: state.weeklyPlan
          });

          return {
            meals,
            recentFoodIds: [meal.foodItemId, ...state.recentFoodIds.filter((id) => id !== meal.foodItemId)].slice(0, 12),
            ...derived
          };
        }),
      hydrateBodyRecordsFromServer: (bodyRecords) =>
        set((state) => {
          const sortedRecords = [...bodyRecords].sort((left, right) => right.date.localeCompare(left.date));
          const derived = recalculateState({
            bodyRecords: sortedRecords,
            meals: state.meals,
            exercises: state.exercises,
            waterLogs: state.waterLogs,
            weeklyPlan: state.weeklyPlan
          });

          return {
            bodyRecords: sortedRecords,
            ...derived
          };
        }),
      insertBodyRecordFromServer: (record) =>
        set((state) => {
          const bodyRecords = [record, ...state.bodyRecords.filter((entry) => entry.id !== record.id)].sort((left, right) =>
            right.date.localeCompare(left.date)
          );
          const derived = recalculateState({
            bodyRecords,
            meals: state.meals,
            exercises: state.exercises,
            waterLogs: state.waterLogs,
            weeklyPlan: state.weeklyPlan
          });

          return {
            bodyRecords,
            ...derived
          };
        }),
      hydrateExercisesFromServer: (exercises) =>
        set((state) => {
          const sortedExercises = [...exercises].sort((left, right) => right.date.localeCompare(left.date));
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals: state.meals,
            exercises: sortedExercises,
            waterLogs: state.waterLogs,
            weeklyPlan: state.weeklyPlan
          });

          return {
            exercises: sortedExercises,
            ...derived
          };
        }),
      insertExerciseFromServer: (exercise) =>
        set((state) => {
          const exercises = [exercise, ...state.exercises.filter((entry) => entry.id !== exercise.id)].sort((left, right) =>
            right.date.localeCompare(left.date)
          );
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals: state.meals,
            exercises,
            waterLogs: state.waterLogs,
            weeklyPlan: state.weeklyPlan
          });

          return {
            exercises,
            ...derived
          };
        }),
      hydrateWeeklyPlanFromServer: (plans) =>
        set((state) => {
          const fallbackPlan = buildPlanState(state.profile).weeklyPlan;
          const weekDates = getWeekDateKeys(state.selectedDate);
          const planMap = new Map(
            plans
              .filter((plan) => typeof plan.date === "string")
              .map((plan) => [plan.date as string, plan])
          );

          const days = weekDates.map((date, dayIndex) => {
            const plan = planMap.get(date);

            if (!plan) {
              return {
                ...fallbackPlan.days[dayIndex],
                date
              };
            }

            return {
              dayIndex,
              date,
              dayType: plan.dayType,
              targetCalories: plan.targetCalories,
              targetProteinG: plan.targetProteinG,
              targetFatG: plan.targetFatG,
              targetCarbsG: plan.targetCarbsG
            };
          });

          const weeklyTargetCalories = days.reduce((sum, day) => sum + day.targetCalories, 0);

          const weeklyPlan = {
            ...fallbackPlan,
            trainingDays: days.filter((day) => day.dayType === "HIGH_CARB").map((day) => day.dayIndex),
            weeklyTargetCalories,
            projectedWeeklyDelta: weeklyTargetCalories - state.tdee * 7,
            days
          };
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals: state.meals,
            exercises: state.exercises,
            waterLogs: state.waterLogs,
            weeklyPlan
          });

          return {
            weeklyPlan,
            ...derived
          };
        }),
      hydrateMealTemplatesFromServer: (mealTemplates) =>
        set(() => ({
          mealTemplates
        })),
      insertMealTemplateFromServer: (template) =>
        set((state) => ({
          mealTemplates: [template, ...state.mealTemplates.filter((entry) => entry.id !== template.id)]
        })),
      hydrateWaterLogsFromServer: (waterLogs) =>
        set((state) => {
          const sortedLogs = [...waterLogs].sort((left, right) => right.date.localeCompare(left.date));
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals: state.meals,
            exercises: state.exercises,
            waterLogs: sortedLogs,
            weeklyPlan: state.weeklyPlan
          });

          return {
            waterLogs: sortedLogs,
            ...derived
          };
        }),
      upsertWaterLogFromServer: (log) =>
        set((state) => {
          const waterLogs = [log, ...state.waterLogs.filter((entry) => entry.date !== log.date)].sort((left, right) =>
            right.date.localeCompare(left.date)
          );
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals: state.meals,
            exercises: state.exercises,
            waterLogs,
            weeklyPlan: state.weeklyPlan
          });

          return {
            waterLogs,
            ...derived
          };
        }),
      hydrateWeeklySummariesFromServer: (weeklySummaries) =>
        set(() => ({
          weeklySummaries
        })),
      hydrateAchievementsFromServer: (achievements) =>
        set(() => ({
          achievements
        })),
      updateProfile: (patch) =>
        set((state) => ({
          profile: {
            ...state.profile,
            ...patch
          }
        })),
      regeneratePlan: () =>
        set((state) => {
          const planState = buildPlanState(state.profile);
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals: state.meals,
            exercises: state.exercises,
            waterLogs: state.waterLogs,
            weeklyPlan: planState.weeklyPlan
          });

          return {
            bmr: planState.bmr,
            tdee: planState.tdee,
            weeklyPlan: planState.weeklyPlan,
            ...derived
          };
        }),
      setSelectedDate: (selectedDate) => set({ selectedDate }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "light" ? "dark" : "light"
        })),
      addMeal: (meal) =>
        set((state) => {
          const date = meal.date ?? state.selectedDate;
          const entry: LoggedMeal = {
            ...meal,
            id: createId("meal"),
            date,
            createdAt: new Date().toISOString()
          };
          const meals = [entry, ...state.meals];
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals,
            exercises: state.exercises,
            waterLogs: state.waterLogs,
            weeklyPlan: state.weeklyPlan
          });

          return {
            meals,
            recentFoodIds: [meal.foodItemId, ...state.recentFoodIds.filter((id) => id !== meal.foodItemId)].slice(
              0,
              12
            ),
            ...derived
          };
        }),
      addMeals: (inputMeals) =>
        set((state) => {
          const meals = [
            ...inputMeals.map((meal) => ({
              ...meal,
              id: createId("meal"),
              date: meal.date ?? state.selectedDate,
              createdAt: new Date().toISOString()
            })),
            ...state.meals
          ];
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals,
            exercises: state.exercises,
            waterLogs: state.waterLogs,
            weeklyPlan: state.weeklyPlan
          });

          return {
            meals,
            recentFoodIds: [
              ...inputMeals.map((meal) => meal.foodItemId),
              ...state.recentFoodIds.filter((id) => !inputMeals.some((meal) => meal.foodItemId === id))
            ].slice(0, 12),
            ...derived
          };
        }),
      addBodyRecord: (record) =>
        set((state) => {
          const bodyRecords = [
            {
              ...record,
              id: createId("body"),
              date: record.date ?? state.selectedDate
            },
            ...state.bodyRecords
          ].sort((left, right) => left.date.localeCompare(right.date));
          const derived = recalculateState({
            bodyRecords,
            meals: state.meals,
            exercises: state.exercises,
            waterLogs: state.waterLogs,
            weeklyPlan: state.weeklyPlan
          });

          return {
            bodyRecords,
            ...derived
          };
        }),
      addExercise: (exercise) =>
        set((state) => {
          const exercises = [
            {
              ...exercise,
              id: createId("exercise"),
              date: exercise.date ?? state.selectedDate
            },
            ...state.exercises
          ];
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals: state.meals,
            exercises,
            waterLogs: state.waterLogs,
            weeklyPlan: state.weeklyPlan
          });

          return {
            exercises,
            ...derived
          };
        }),
      addWater: (amountMl, date) =>
        set((state) => {
          const targetDate = date ?? state.selectedDate;
          const log = normalizeWaterLog(state.waterLogs, targetDate);
          const updatedLog: WaterLog = {
            ...log,
            amountMl: log.amountMl + amountMl,
            entries: [...log.entries, amountMl]
          };
          const waterLogs = [
            updatedLog,
            ...state.waterLogs.filter((entry) => entry.date !== targetDate)
          ].sort((left, right) => right.date.localeCompare(left.date));
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals: state.meals,
            exercises: state.exercises,
            waterLogs,
            weeklyPlan: state.weeklyPlan
          });

          return {
            waterLogs,
            ...derived
          };
        }),
      setWaterTarget: (targetMl, date) =>
        set((state) => {
          const targetDate = date ?? state.selectedDate;
          const log = normalizeWaterLog(state.waterLogs, targetDate, targetMl);
          const waterLogs = [
            {
              ...log,
              targetMl
            },
            ...state.waterLogs.filter((entry) => entry.date !== targetDate)
          ].sort((left, right) => right.date.localeCompare(left.date));

          return {
            waterLogs
          };
        }),
      saveMealTemplate: (name, mealType, items) =>
        set((state) => ({
          mealTemplates: [
            {
              id: createId("template"),
              name,
              mealType,
              items
            },
            ...state.mealTemplates
          ]
        })),
      applyMealTemplate: (templateId, date) => {
        const state = get();
        const template = state.mealTemplates.find((entry) => entry.id === templateId);

        if (!template) {
          return;
        }

        get().addMeals(
          template.items
            .filter((item) => item.foodItemId !== undefined)
            .map((item) => ({
              foodItemId: item.foodItemId as number,
              mealType: template.mealType,
              name: item.name,
              nameZh: item.nameZh,
              category: item.category,
              quantityGrams: item.quantityGrams,
              calories: item.calories,
              protein: item.protein,
              fat: item.fat,
              carbs: item.carbs,
              fiber: item.fiber,
              date
            }))
        );
      },
      swapPlanDays: (fromIndex, toIndex) =>
        set((state) => {
          const days = [...state.weeklyPlan.days];
          const fromDay = days[fromIndex];
          const toDay = days[toIndex];

          if (!fromDay || !toDay) {
            return state;
          }

          days[fromIndex] = { ...toDay, dayIndex: fromIndex };
          days[toIndex] = { ...fromDay, dayIndex: toIndex };
          const weeklyPlan = {
            ...state.weeklyPlan,
            days
          };
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals: state.meals,
            exercises: state.exercises,
            waterLogs: state.waterLogs,
            weeklyPlan
          });

          return {
            weeklyPlan,
            ...derived
          };
        }),
      setPlanDayType: (dayIndex, dayType) =>
        set((state) => {
          const weeklyPlan = {
            ...state.weeklyPlan,
            days: state.weeklyPlan.days.map((day) =>
              day.dayIndex === dayIndex
                ? {
                    ...day,
                    dayType
                  }
                : day
            )
          };
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals: state.meals,
            exercises: state.exercises,
            waterLogs: state.waterLogs,
            weeklyPlan
          });

          return {
            weeklyPlan,
            ...derived
          };
        }),
      updatePlanDayTarget: (dayIndex, field, value) =>
        set((state) => {
          const weeklyPlan = {
            ...state.weeklyPlan,
            days: state.weeklyPlan.days.map((day) =>
              day.dayIndex === dayIndex
                ? {
                    ...day,
                    [field]: value
                  }
                : day
            )
          };
          const derived = recalculateState({
            bodyRecords: state.bodyRecords,
            meals: state.meals,
            exercises: state.exercises,
            waterLogs: state.waterLogs,
            weeklyPlan
          });

          return {
            weeklyPlan,
            ...derived
          };
        })
    }),
    {
      name: "carbcycle-tracker-store",
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        selectedDate: state.selectedDate,
        theme: state.theme,
        profile: state.profile,
        bmr: state.bmr,
        tdee: state.tdee,
        weeklyPlan: state.weeklyPlan,
        meals: state.meals,
        bodyRecords: state.bodyRecords,
        exercises: state.exercises,
        recentFoodIds: state.recentFoodIds,
        mealTemplates: state.mealTemplates,
        waterLogs: state.waterLogs,
        weeklySummaries: state.weeklySummaries,
        dailyCheckInStreak: state.dailyCheckInStreak,
        achievements: state.achievements
      })
    }
  )
);
