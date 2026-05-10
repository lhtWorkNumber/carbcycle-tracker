"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Droplets, LoaderCircle, Ruler, Salad, Sparkles, Zap } from "lucide-react";

import { AuthSessionCard } from "@/components/auth/auth-session-card";
import { AchievementBadges } from "@/components/tracker/achievement-badges";
import { FoodImage } from "@/components/tracker/food-image";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UnitInput } from "@/components/ui/unit-input";
import { SectionTitle } from "@/components/tracker/section-title";
import { useToast } from "@/hooks/use-toast";
import { calculateBMR, calculateTDEE, generateCarbCyclingPlan } from "@/lib/calculator";
import {
  ActivityLevel,
  FoodCategory,
  Goal,
  type FoodItemSummary,
  type UserProfile
} from "@/lib/domain";
import { onboardingTrainingDayLabels } from "@/lib/demo-data";
import { getWeekDateKeys } from "@/lib/format";
import { activityLevelLabels, foodCategoryLabels, goalLabels } from "@/lib/ui-config";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useTrackerStore } from "@/store/tracker-store";

const managementCategories = [
  FoodCategory.STAPLE,
  FoodCategory.MEAT,
  FoodCategory.VEGETABLE,
  FoodCategory.FRUIT,
  FoodCategory.DAIRY,
  FoodCategory.SNACK,
  FoodCategory.BEVERAGE,
  FoodCategory.OTHER
] as const;

function parseNumberField(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : Number.NaN;
}

function numberFromPayload(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function SettingsScreen({ initialCustomFoods }: { initialCustomFoods: FoodItemSummary[] }) {
  const profile = useTrackerStore((state) => state.profile);
  const completeOnboarding = useTrackerStore((state) => state.completeOnboarding);
  const theme = useTrackerStore((state) => state.theme);
  const setTheme = useTrackerStore((state) => state.setTheme);
  const achievements = useTrackerStore((state) => state.achievements);
  const meals = useTrackerStore((state) => state.meals);
  const bodyRecords = useTrackerStore((state) => state.bodyRecords);
  const exercises = useTrackerStore((state) => state.exercises);
  const waterLogs = useTrackerStore((state) => state.waterLogs);
  const selectedDate = useTrackerStore((state) => state.selectedDate);
  const setWaterTarget = useTrackerStore((state) => state.setWaterTarget);
  const upsertWaterLogFromServer = useTrackerStore((state) => state.upsertWaterLogFromServer);
  const authUser = useAuthStore((state) => state.user);
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const { toast } = useToast();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [customFoods, setCustomFoods] = useState(initialCustomFoods);
  const [message, setMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingWaterTarget, setIsSavingWaterTarget] = useState(false);
  const [waterTargetDraft, setWaterTargetDraft] = useState("");
  const [isSavingCustomFood, setIsSavingCustomFood] = useState(false);
  const [customFoodForm, setCustomFoodForm] = useState<{
    nameZh: string;
    category: FoodCategory;
    caloriesPer100g: string;
    proteinPer100g: string;
    fatPer100g: string;
    carbsPer100g: string;
    fiberPer100g: string;
    note: string;
  }>({
    nameZh: "",
    category: FoodCategory.OTHER,
    caloriesPer100g: "",
    proteinPer100g: "",
    fatPer100g: "",
    carbsPer100g: "",
    fiberPer100g: "",
    note: ""
  });

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const todayWaterLog = waterLogs.find((entry) => entry.date === selectedDate) ?? {
    date: selectedDate,
    targetMl: 2000,
    amountMl: 0,
    entries: []
  };
  const nextWaterTarget = Number(waterTargetDraft);
  const canSaveWaterTarget =
    Number.isInteger(nextWaterTarget) &&
    nextWaterTarget >= 500 &&
    nextWaterTarget <= 10000 &&
    nextWaterTarget !== todayWaterLog.targetMl;
  const customFoodName = customFoodForm.nameZh.trim();
  const customFoodValues = {
    caloriesPer100g: parseNumberField(customFoodForm.caloriesPer100g),
    proteinPer100g: parseNumberField(customFoodForm.proteinPer100g),
    fatPer100g: parseNumberField(customFoodForm.fatPer100g),
    carbsPer100g: parseNumberField(customFoodForm.carbsPer100g),
    fiberPer100g: parseNumberField(customFoodForm.fiberPer100g)
  };
  const canSaveCustomFood =
    customFoodName.length > 0 &&
    customFoodValues.caloriesPer100g >= 0 &&
    customFoodValues.caloriesPer100g <= 1000 &&
    customFoodValues.proteinPer100g >= 0 &&
    customFoodValues.proteinPer100g <= 100 &&
    customFoodValues.fatPer100g >= 0 &&
    customFoodValues.fatPer100g <= 100 &&
    customFoodValues.carbsPer100g >= 0 &&
    customFoodValues.carbsPer100g <= 100 &&
    customFoodValues.fiberPer100g >= 0 &&
    customFoodValues.fiberPer100g <= 100;

  useEffect(() => {
    setWaterTargetDraft(String(todayWaterLog.targetMl));
  }, [todayWaterLog.targetMl, selectedDate]);

  async function saveProfile(successTitle = "资料已更新") {
    setIsSavingProfile(true);

    try {
      if (isAuthConfigured && !authUser) {
        toast({
          title: "请先登录",
          description: "登录后才能把个人资料保存到正式账号。",
          variant: "error"
        });
        return;
      }

      const nextBmr = calculateBMR(draft.gender, draft.age, draft.weightKg, draft.heightCm);
      const nextTdee = calculateTDEE(nextBmr, draft.activityLevel);
      const nextWeeklyPlan = generateCarbCyclingPlan(nextTdee, draft.goal, draft.trainingDays, draft.weightKg);

      if (isAuthConfigured && authUser) {
        const profileResponse = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: draft.name,
            gender: draft.gender,
            age: draft.age,
            height: draft.heightCm,
            weight: draft.weightKg,
            body_fat_percentage: draft.bodyFatPercentage ?? null,
            training_days: draft.trainingDays,
            activity_level: draft.activityLevel,
            goal: draft.goal
          })
        });

        if (!profileResponse.ok) {
          const payload = await profileResponse.json().catch(() => null);
          throw new Error(payload?.error ?? "保存用户资料失败");
        }

        const weekDates = getWeekDateKeys(selectedDate);
        const planResponse = await fetch("/api/daily-plans", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            plans: nextWeeklyPlan.days.map((day, index) => ({
              date: new Date(`${weekDates[index]}T12:00:00.000Z`).toISOString(),
              day_type: day.dayType,
              target_calories: day.targetCalories,
              target_protein_g: day.targetProteinG,
              target_fat_g: day.targetFatG,
              target_carbs_g: day.targetCarbsG,
              actual_calories: 0,
              actual_protein_g: 0,
              actual_fat_g: 0,
              actual_carbs_g: 0
            }))
          })
        });

        if (!planResponse.ok) {
          const payload = await planResponse.json().catch(() => null);
          throw new Error(payload?.error ?? "同步每日计划失败");
        }
      }

      completeOnboarding(draft);
      toast({
        title: successTitle,
        description: isAuthConfigured ? "新的基础信息和周计划已经保存到账号。" : "新的基础信息和周计划已经保存到本地。",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function saveWaterTarget() {
    if (!canSaveWaterTarget) {
      toast({
        title: "请检查饮水目标",
        description: "目标需要是 500 到 10000 ml 之间的整数。",
        variant: "error"
      });
      return;
    }

    setIsSavingWaterTarget(true);

    if (isAuthConfigured && authUser) {
      try {
        const response = await fetch("/api/water-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            date: new Date(`${selectedDate}T12:00:00.000Z`).toISOString(),
            targetMl: nextWaterTarget,
            amountMl: todayWaterLog.amountMl,
            entries: todayWaterLog.entries
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "保存饮水目标失败");
        }

        const savedLog = await response.json();
        upsertWaterLogFromServer(savedLog);
        toast({
          title: "饮水目标已保存",
          description: `今日目标已调整为 ${nextWaterTarget}ml。`,
          variant: "success"
        });
      } catch (error) {
        toast({
          title: "保存失败",
          description: error instanceof Error ? error.message : "请稍后再试。",
          variant: "error"
        });
      } finally {
        setIsSavingWaterTarget(false);
      }
      return;
    }

    setWaterTarget(nextWaterTarget);
    setIsSavingWaterTarget(false);
    toast({
      title: "饮水目标已保存",
      description: `今日目标已调整为 ${nextWaterTarget}ml。`,
      variant: "success"
    });
  }

  async function createCustomFood() {
    if (isSavingCustomFood) {
      return;
    }

    setMessage("");

    if (!canSaveCustomFood) {
      const errorMessage = "请填写食物名称，并确认每 100g 营养数值有效。";
      setMessage(errorMessage);
      toast({
        title: "请检查食物信息",
        description: errorMessage,
        variant: "error"
      });
      return;
    }

    setIsSavingCustomFood(true);

    try {
      const response = await fetch("/api/food-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: customFoodName,
          name_zh: customFoodName,
          category: customFoodForm.category,
          calories_per_100g: customFoodValues.caloriesPer100g,
          protein_per_100g: customFoodValues.proteinPer100g,
          fat_per_100g: customFoodValues.fatPer100g,
          carbs_per_100g: customFoodValues.carbsPer100g,
          fiber_per_100g: customFoodValues.fiberPer100g,
          gi_index: null,
          image_url: null,
          is_custom: true
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "保存失败，请检查字段后重试。");
      }

      const createdFood = (await response.json()) as Record<string, unknown>;
      const createdFoodSummary: FoodItemSummary = {
        id: numberFromPayload(createdFood.id, Date.now()),
        name: typeof createdFood.name === "string" ? createdFood.name : customFoodName,
        nameZh: typeof createdFood.name_zh === "string" ? createdFood.name_zh : typeof createdFood.nameZh === "string" ? createdFood.nameZh : customFoodName,
        category: (createdFood.category ?? customFoodForm.category) as FoodCategory,
        caloriesPer100g: numberFromPayload(createdFood.calories_per_100g ?? createdFood.caloriesPer100g, customFoodValues.caloriesPer100g),
        proteinPer100g: numberFromPayload(createdFood.protein_per_100g ?? createdFood.proteinPer100g, customFoodValues.proteinPer100g),
        fatPer100g: numberFromPayload(createdFood.fat_per_100g ?? createdFood.fatPer100g, customFoodValues.fatPer100g),
        carbsPer100g: numberFromPayload(createdFood.carbs_per_100g ?? createdFood.carbsPer100g, customFoodValues.carbsPer100g),
        fiberPer100g: numberFromPayload(createdFood.fiber_per_100g ?? createdFood.fiberPer100g, customFoodValues.fiberPer100g),
        giIndex: numberFromPayload(createdFood.gi_index ?? createdFood.giIndex, 0) || null,
        imageUrl:
          typeof createdFood.image_url === "string"
            ? createdFood.image_url
            : typeof createdFood.imageUrl === "string"
              ? createdFood.imageUrl
              : null,
        isCustom: typeof createdFood.is_custom === "boolean" ? createdFood.is_custom : typeof createdFood.isCustom === "boolean" ? createdFood.isCustom : true
      };

      setCustomFoods((current) => [
        createdFoodSummary,
        ...current
      ]);
      setCustomFoodForm({
        nameZh: "",
        category: FoodCategory.OTHER,
        caloriesPer100g: "",
        proteinPer100g: "",
        fatPer100g: "",
        carbsPer100g: "",
        fiberPer100g: "",
        note: ""
      });
      setMessage("自定义食物已加入食物库。");
      toast({
        title: "保存成功",
        description: "新的自定义食物已经加入食物库。",
        variant: "success"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "保存失败，请稍后重试。";
      setMessage(errorMessage);
      toast({
        title: "保存失败",
        description: errorMessage,
        variant: "error"
      });
    } finally {
      setIsSavingCustomFood(false);
    }
  }

  function exportCsv() {
    const rows = [
      ["类型", "日期", "名称", "数值1", "数值2", "数值3", "备注"],
      ...meals.map((meal) => [
        "饮食",
        meal.date,
        meal.nameZh,
        `${meal.quantityGrams}g`,
        `${meal.calories}kcal`,
        `${meal.protein}/${meal.fat}/${meal.carbs}`,
        meal.category
      ]),
      ...bodyRecords.map((record) => [
        "身体记录",
        record.date,
        "体重",
        String(record.weight),
        String(record.bodyFatPercentage ?? ""),
        String(record.waistCm ?? ""),
        record.note ?? ""
      ]),
      ...exercises.map((exercise) => [
        "运动",
        exercise.date,
        exercise.exerciseName,
        String(exercise.durationMinutes),
        String(exercise.caloriesBurned),
        exercise.exerciseType,
        ""
      ])
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "carbcycle-tracker-export.csv";
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    toast({
      title: "导出完成",
      description: "CSV 数据已经准备好。",
      variant: "success"
    });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 safe-px pb-28 pt-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">设置</p>
        <h1 className="text-3xl font-semibold tracking-tight">个人资料与工具</h1>
      </section>

      <AuthSessionCard />

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
          <SectionTitle title="个人资料" />
          <div className="grid gap-3 sm:grid-cols-2">
            <UnitInput label="昵称" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="例如 小林" />
            <UnitInput label="年龄" unit="岁" value={String(draft.age)} onChange={(event) => setDraft((current) => ({ ...current, age: Number(event.target.value) || 0 }))} type="number" inputMode="numeric" min={16} />
            <UnitInput label="身高" unit="cm" value={String(draft.heightCm)} onChange={(event) => setDraft((current) => ({ ...current, heightCm: Number(event.target.value) || 0 }))} type="number" inputMode="decimal" min={120} />
            <UnitInput label="体重" unit="kg" value={String(draft.weightKg)} onChange={(event) => setDraft((current) => ({ ...current, weightKg: Number(event.target.value) || 0 }))} type="number" inputMode="decimal" min={35} step="0.1" />
            <UnitInput label="体脂率" unit="%" value={String(draft.bodyFatPercentage ?? "")} onChange={(event) => setDraft((current) => ({ ...current, bodyFatPercentage: event.target.value ? Number(event.target.value) : undefined }))} type="number" inputMode="decimal" min={0} max={60} step="0.1" placeholder="可选" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">活动量</p>
            <div className="flex flex-wrap gap-2">
              {Object.values(ActivityLevel).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, activityLevel: item }))}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium",
                    draft.activityLevel === item ? "bg-primary text-primary-foreground" : "bg-secondary"
                  )}
                >
                  {activityLevelLabels[item]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">目标</p>
            <div className="flex flex-wrap gap-2">
              {Object.values(Goal).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, goal: item }))}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium",
                    draft.goal === item ? "bg-primary text-primary-foreground" : "bg-secondary"
                  )}
                >
                  {goalLabels[item]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">训练日</p>
            <div className="grid grid-cols-4 gap-2">
              {onboardingTrainingDayLabels.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      trainingDays: current.trainingDays.includes(index)
                        ? current.trainingDays.filter((day) => day !== index)
                        : [...current.trainingDays, index].sort((left, right) => left - right)
                    }))
                  }
                  className={cn(
                    "rounded-[1rem] px-3 py-3 text-sm font-semibold",
                    draft.trainingDays.includes(index) ? "bg-primary text-primary-foreground" : "bg-secondary"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="rounded-full"
              onClick={() => void saveProfile()}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isSavingProfile ? "保存中…" : "保存资料"}
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => void saveProfile("计划已重算")}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              {isSavingProfile ? "保存中…" : "重新计算计划"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
            <SectionTitle title="偏好设置" />
            <div className="mt-4 flex items-center justify-between rounded-[1.4rem] bg-secondary px-4 py-4">
              <div>
                <p className="font-semibold">深色模式</p>
                <p className="text-sm text-muted-foreground">在低光环境下减少视觉疲劳</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] bg-secondary px-4 py-4">
              <div>
                <p className="font-semibold">饮水目标</p>
                <p className="text-sm text-muted-foreground">默认 2L，可按训练量调整</p>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" />
                <UnitInput
                  label="目标值"
                  unit="ml"
                  value={waterTargetDraft}
                  onChange={(event) => setWaterTargetDraft(event.target.value)}
                  type="number"
                  inputMode="numeric"
                  min={500}
                  max={10000}
                  step={100}
                  wrapperClassName="w-32 min-w-0"
                  className="h-10 rounded-xl bg-background pr-10"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-10 rounded-xl px-3"
                  disabled={!canSaveWaterTarget || isSavingWaterTarget}
                  onClick={() => void saveWaterTarget()}
                >
                  {isSavingWaterTarget ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "保存"}
                </Button>
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full rounded-[1.3rem]" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />
              导出 CSV 数据
            </Button>
          </section>

          <section className="rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
            <SectionTitle title="快捷入口" />
            <div className="mt-4 grid gap-3">
              <Link href="/record" className="flex items-center gap-3 rounded-[1.3rem] bg-secondary px-4 py-4">
                <Ruler className="h-5 w-5" />
                身体记录
              </Link>
              <Link href="/exercise" className="flex items-center gap-3 rounded-[1.3rem] bg-secondary px-4 py-4">
                <Zap className="h-5 w-5" />
                运动记录
              </Link>
            </div>
          </section>
        </div>
      </section>

      <AchievementBadges achievements={achievements} />

      <section id="food-library" className="space-y-4 rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
        <SectionTitle title="食物库管理" action={<Salad className="h-5 w-5 text-primary" />} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <UnitInput label="食物名称" value={customFoodForm.nameZh} onChange={(event) => setCustomFoodForm((current) => ({ ...current, nameZh: event.target.value }))} placeholder="例如 鸡胸肉沙拉" />
          <UnitInput label="热量" unit="kcal/100g" value={customFoodForm.caloriesPer100g} onChange={(event) => setCustomFoodForm((current) => ({ ...current, caloriesPer100g: event.target.value }))} type="number" inputMode="decimal" min={0} className="pr-24" />
          <UnitInput label="蛋白质" unit="g/100g" value={customFoodForm.proteinPer100g} onChange={(event) => setCustomFoodForm((current) => ({ ...current, proteinPer100g: event.target.value }))} type="number" inputMode="decimal" min={0} step="0.1" className="pr-20" />
          <UnitInput label="脂肪" unit="g/100g" value={customFoodForm.fatPer100g} onChange={(event) => setCustomFoodForm((current) => ({ ...current, fatPer100g: event.target.value }))} type="number" inputMode="decimal" min={0} step="0.1" className="pr-20" />
          <UnitInput label="碳水" unit="g/100g" value={customFoodForm.carbsPer100g} onChange={(event) => setCustomFoodForm((current) => ({ ...current, carbsPer100g: event.target.value }))} type="number" inputMode="decimal" min={0} step="0.1" className="pr-20" />
          <UnitInput label="纤维" unit="g/100g" value={customFoodForm.fiberPer100g} onChange={(event) => setCustomFoodForm((current) => ({ ...current, fiberPer100g: event.target.value }))} type="number" inputMode="decimal" min={0} step="0.1" className="pr-20" />
        </div>
        <div className="flex flex-wrap gap-2">
          {managementCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCustomFoodForm((current) => ({ ...current, category }))}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium",
                customFoodForm.category === category ? "bg-primary text-primary-foreground" : "bg-secondary"
              )}
            >
              {foodCategoryLabels[category]}
            </button>
          ))}
        </div>
        <Textarea value={customFoodForm.note} onChange={(event) => setCustomFoodForm((current) => ({ ...current, note: event.target.value }))} placeholder="备注：例如烹饪方式、品牌或包装规格" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{message || "新食物会在添加食物页面即时可见。"}</p>
          <Button className="w-full rounded-full sm:w-auto" onClick={() => void createCustomFood()} disabled={isSavingCustomFood || !canSaveCustomFood}>
            {isSavingCustomFood ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSavingCustomFood ? "保存中…" : "保存自定义食物"}
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {customFoods.length > 0 ? (
            customFoods.map((food) => (
              <div key={food.id} className="flex min-w-0 gap-3 rounded-[1.4rem] bg-secondary/80 p-3">
                <FoodImage food={food} className="h-16 w-16 shrink-0 rounded-[1rem]" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{food.nameZh}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {foodCategoryLabels[food.category]} · {Math.round(food.caloriesPer100g)} kcal / 100g
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.4rem] border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
              还没有自定义食物，保存后会显示在这里。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
