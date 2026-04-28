"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Droplets, Ruler, Salad, Sparkles, Zap } from "lucide-react";

import { AuthSessionCard } from "@/components/auth/auth-session-card";
import { AchievementBadges } from "@/components/tracker/achievement-badges";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UnitInput } from "@/components/ui/unit-input";
import { SectionTitle } from "@/components/tracker/section-title";
import { useToast } from "@/hooks/use-toast";
import {
  ActivityLevel,
  FoodCategory,
  Goal,
  type FoodItemSummary,
  type UserProfile
} from "@/lib/domain";
import { onboardingTrainingDayLabels } from "@/lib/demo-data";
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
  FoodCategory.SNACK
] as const;

export function SettingsScreen({ initialCustomFoods }: { initialCustomFoods: FoodItemSummary[] }) {
  const profile = useTrackerStore((state) => state.profile);
  const completeOnboarding = useTrackerStore((state) => state.completeOnboarding);
  const regeneratePlan = useTrackerStore((state) => state.regeneratePlan);
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

  async function updateWaterTarget(targetMl: number) {
    if (isAuthConfigured && authUser) {
      try {
        const response = await fetch("/api/water-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            date: new Date(`${selectedDate}T12:00:00.000Z`).toISOString(),
            targetMl,
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
      } catch (error) {
        toast({
          title: "保存失败",
          description: error instanceof Error ? error.message : "请稍后再试。",
          variant: "error"
        });
      }
      return;
    }

    setWaterTarget(targetMl);
  }

  async function createCustomFood() {
    setMessage("");
    setIsSavingCustomFood(true);

    try {
      const response = await fetch("/api/food-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: customFoodForm.nameZh,
          name_zh: customFoodForm.nameZh,
          category: customFoodForm.category,
          calories_per_100g: Number(customFoodForm.caloriesPer100g),
          protein_per_100g: Number(customFoodForm.proteinPer100g),
          fat_per_100g: Number(customFoodForm.fatPer100g),
          carbs_per_100g: Number(customFoodForm.carbsPer100g),
          fiber_per_100g: Number(customFoodForm.fiberPer100g),
          gi_index: null,
          image_url: null,
          is_custom: true
        })
      });

      if (!response.ok) {
        throw new Error("保存失败，请检查字段后重试。");
      }

      const createdFood = await response.json();

      setCustomFoods((current) => [
        {
          id: createdFood.id,
          name: createdFood.name,
          nameZh: createdFood.name_zh,
          category: createdFood.category,
          caloriesPer100g: createdFood.calories_per_100g,
          proteinPer100g: createdFood.protein_per_100g,
          fatPer100g: createdFood.fat_per_100g,
          carbsPer100g: createdFood.carbs_per_100g,
          fiberPer100g: createdFood.fiber_per_100g,
          giIndex: createdFood.gi_index,
          imageUrl: createdFood.image_url,
          isCustom: createdFood.is_custom
        },
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
    URL.revokeObjectURL(url);
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
              onClick={() => {
                completeOnboarding(draft);
                toast({
                  title: "资料已更新",
                  description: "新的基础信息和周计划已经保存。",
                  variant: "success"
                });
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              保存资料
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                regeneratePlan();
                toast({
                  title: "计划已重算",
                  description: "新的碳循环安排已经更新。",
                  variant: "success"
                });
              }}
            >
              <Zap className="mr-2 h-4 w-4" />
              重新计算计划
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
            <div className="mt-3 flex items-center justify-between rounded-[1.4rem] bg-secondary px-4 py-4">
              <div>
                <p className="font-semibold">饮水目标</p>
                <p className="text-sm text-muted-foreground">默认 2L，可按训练量调整</p>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" />
                <UnitInput
                  label="目标值"
                  unit="ml"
                  value={String(todayWaterLog.targetMl)}
                  onChange={(event) => void updateWaterTarget(Number(event.target.value) || 2000)}
                  type="number"
                  inputMode="numeric"
                  wrapperClassName="w-32"
                  className="h-10 rounded-xl bg-background pr-10"
                />
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
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{message || "新食物会在添加食物页面即时可见。"}</p>
          <Button className="rounded-full" onClick={() => void createCustomFood()} disabled={isSavingCustomFood}>
            {isSavingCustomFood ? "保存中…" : "保存自定义食物"}
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {customFoods.map((food) => (
            <div key={food.id} className="rounded-[1.4rem] bg-secondary/80 px-4 py-4">
              <p className="font-semibold">{food.nameZh}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {foodCategoryLabels[food.category]} · {Math.round(food.caloriesPer100g)} kcal / 100g
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
