"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UnitInput } from "@/components/ui/unit-input";
import { useToast } from "@/hooks/use-toast";
import { calculateBMR, calculateTDEE, generateCarbCyclingPlan } from "@/lib/calculator";
import {
  ActivityLevel,
  Gender,
  Goal,
  type UserProfile
} from "@/lib/domain";
import { onboardingTrainingDayLabels } from "@/lib/demo-data";
import { getWeekDateKeys } from "@/lib/format";
import { activityLevelLabels, dayTypeMeta, goalLabels } from "@/lib/ui-config";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useTrackerStore } from "@/store/tracker-store";

const stepTitles = ["性别", "年龄", "身高", "体重", "体脂", "活动量", "目标", "训练日", "计划预览"] as const;

const initialForm: UserProfile = {
  name: "我的计划",
  gender: Gender.MALE,
  age: 28,
  heightCm: 175,
  weightKg: 70,
  bodyFatPercentage: 18,
  activityLevel: ActivityLevel.MODERATE,
  goal: Goal.CUT,
  trainingDays: [0, 2, 4]
};

export function OnboardingFlow() {
  const router = useRouter();
  const { toast } = useToast();
  const completeOnboarding = useTrackerStore((state) => state.completeOnboarding);
  const authUser = useAuthStore((state) => state.user);
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<UserProfile>(initialForm);
  const [saving, setSaving] = useState(false);

  const bmr = calculateBMR(form.gender, form.age, form.weightKg, form.heightCm);
  const tdee = calculateTDEE(bmr, form.activityLevel);
  const weeklyPlan = generateCarbCyclingPlan(tdee, form.goal, form.trainingDays, form.weightKg);
  const isLastStep = step === stepTitles.length - 1;

  function nextStep() {
    setStep((current) => Math.min(current + 1, stepTitles.length - 1));
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 0));
  }

  function toggleTrainingDay(dayIndex: number) {
    setForm((current) => ({
      ...current,
      trainingDays: current.trainingDays.includes(dayIndex)
        ? current.trainingDays.filter((day) => day !== dayIndex)
        : [...current.trainingDays, dayIndex].sort((left, right) => left - right)
    }));
  }

  async function finishOnboarding() {
    setSaving(true);

    try {
      if (isAuthConfigured && !authUser) {
        toast({
          title: "请先登录",
          description: "登录后才能把你的基础资料正式保存到账号。",
          variant: "error"
        });
        router.push("/login");
        return;
      }

      if (isAuthConfigured && authUser) {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: form.name,
            gender: form.gender,
            age: form.age,
            height: form.heightCm,
            weight: form.weightKg,
            body_fat_percentage: form.bodyFatPercentage ?? null,
            training_days: form.trainingDays,
            activity_level: form.activityLevel,
            goal: form.goal
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "保存用户资料失败");
        }

        const weekDates = getWeekDateKeys(new Date());
        const weeklyPlanResponse = await fetch("/api/daily-plans", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            plans: weeklyPlan.days.map((day, index) => ({
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

        if (!weeklyPlanResponse.ok) {
          const payload = await weeklyPlanResponse.json().catch(() => null);
          throw new Error(payload?.error ?? "保存每日计划失败");
        }

        toast({
          title: "资料已保存",
          description: "你的基础资料已经写入账号，接下来可以继续记录。",
          variant: "success"
        });
      } else {
        toast({
          title: "已保存到本地体验模式",
          description: "当前未连接正式用户体系，资料仅保存在本地浏览器。",
          variant: "default"
        });
      }

      completeOnboarding(form);
      router.push("/");
    } catch (error) {
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-8 safe-px py-10">
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">CARBCYCLE TRACKER</p>
          <div className="space-y-3">
            <h1 className="text-balance text-4xl font-semibold leading-tight md:text-5xl">
              先设置你的基础信息，再开始按计划记录。
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              这一步会为你计算基础代谢、总消耗，并生成一周的高碳 / 中碳 / 低碳安排。
            </p>
          </div>
          <div className="space-y-3 rounded-[2rem] bg-white/72 p-5 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">
                第 {step + 1} 步 / 共 {stepTitles.length} 步
              </span>
              <span className="font-semibold">{stepTitles[step]}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${((step + 1) / stepTitles.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 rounded-[2rem] bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-white/80 duration-300 dark:bg-white/5 dark:ring-white/5 md:p-7">
          <div key={step} className="space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-3 duration-300">
            {!isLastStep ? (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">{stepTitles[step]}</p>
                  <h2 className="text-2xl font-semibold">
                    {step === 0 && "你的性别是？"}
                    {step === 1 && "今年多大了？"}
                    {step === 2 && "输入身高（cm）"}
                    {step === 3 && "输入当前体重（kg）"}
                    {step === 4 && "体脂率（可选）"}
                    {step === 5 && "日常活动量如何？"}
                    {step === 6 && "当前目标是什么？"}
                    {step === 7 && "一周通常训练哪几天？"}
                  </h2>
                </div>

                {step === 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: Gender.MALE, label: "男" },
                      { value: Gender.FEMALE, label: "女" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, gender: option.value }))}
                        className={cn(
                          "rounded-[1.5rem] px-4 py-5 text-left text-lg font-semibold transition-all",
                          form.gender === option.value
                            ? "bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(22,163,74,0.2)]"
                            : "bg-secondary text-secondary-foreground"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                {step === 1 ? (
                  <UnitInput
                    label="年龄"
                    unit="岁"
                    type="number"
                    inputMode="numeric"
                    min={16}
                    value={form.age}
                    onChange={(event) => setForm((current) => ({ ...current, age: Number(event.target.value) || 0 }))}
                    className="h-14 rounded-[1.5rem] text-lg"
                  />
                ) : null}

                {step === 2 ? (
                  <UnitInput
                    label="身高"
                    unit="cm"
                    type="number"
                    inputMode="decimal"
                    min={120}
                    value={form.heightCm}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, heightCm: Number(event.target.value) || 0 }))
                    }
                    className="h-14 rounded-[1.5rem] text-lg"
                  />
                ) : null}

                {step === 3 ? (
                  <UnitInput
                    label="当前体重"
                    unit="kg"
                    type="number"
                    inputMode="decimal"
                    min={35}
                    step="0.1"
                    value={form.weightKg}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, weightKg: Number(event.target.value) || 0 }))
                    }
                    className="h-14 rounded-[1.5rem] text-lg"
                  />
                ) : null}

                {step === 4 ? (
                  <UnitInput
                    label="体脂率"
                    unit="%"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={60}
                    step="0.1"
                    value={form.bodyFatPercentage ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        bodyFatPercentage: event.target.value ? Number(event.target.value) : undefined
                      }))
                    }
                    placeholder="例如 18.5"
                    className="h-14 rounded-[1.5rem] text-lg"
                  />
                ) : null}

                {step === 5 ? (
                  <div className="grid gap-3">
                    {Object.values(ActivityLevel).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, activityLevel: value }))}
                        className={cn(
                          "rounded-[1.4rem] px-4 py-4 text-left transition-all",
                          form.activityLevel === value ? "bg-primary text-primary-foreground" : "bg-secondary"
                        )}
                      >
                        <p className="font-semibold">{activityLevelLabels[value]}</p>
                      </button>
                    ))}
                  </div>
                ) : null}

                {step === 6 ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Object.values(Goal).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, goal: value }))}
                        className={cn(
                          "rounded-[1.4rem] px-4 py-4 text-left transition-all",
                          form.goal === value ? "bg-primary text-primary-foreground" : "bg-secondary"
                        )}
                      >
                        <p className="font-semibold">{goalLabels[value]}</p>
                      </button>
                    ))}
                  </div>
                ) : null}

                {step === 7 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {onboardingTrainingDayLabels.map((label, index) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleTrainingDay(index)}
                        className={cn(
                          "rounded-[1.4rem] px-4 py-4 text-sm font-semibold transition-all",
                          form.trainingDays.includes(index) ? "bg-primary text-primary-foreground" : "bg-secondary"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">计划预览</p>
                  <h2 className="text-2xl font-semibold">你的基础数据和一周碳循环安排</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.5rem] bg-secondary p-4">
                    <p className="text-sm text-muted-foreground">基础代谢 BMR</p>
                    <p className="mt-2 text-2xl font-semibold">{Math.round(bmr)} kcal</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-secondary p-4">
                    <p className="text-sm text-muted-foreground">每日总消耗 TDEE</p>
                    <p className="mt-2 text-2xl font-semibold">{Math.round(tdee)} kcal</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-secondary p-4">
                    <p className="text-sm text-muted-foreground">目标</p>
                    <p className="mt-2 text-2xl font-semibold">{goalLabels[form.goal]}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {weeklyPlan.days.map((day) => (
                    <div key={day.dayIndex} className="rounded-[1.5rem] bg-white/70 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{onboardingTrainingDayLabels[day.dayIndex]}</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${dayTypeMeta[day.dayType].badgeClass}`}>
                          {dayTypeMeta[day.dayType].shortLabel}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <p>热量 {Math.round(day.targetCalories)} kcal</p>
                        <p>蛋白 {Math.round(day.targetProteinG)}g</p>
                        <p>脂肪 {Math.round(day.targetFatG)}g</p>
                        <p>碳水 {Math.round(day.targetCarbsG)}g</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" className="rounded-full" onClick={previousStep} disabled={step === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                上一步
              </Button>
              {isLastStep ? (
                <Button className="rounded-full px-5" onClick={() => void finishOnboarding()} disabled={saving}>
                  {saving ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      保存中…
                    </>
                  ) : (
                    <>
                      开始记录
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button className="rounded-full px-5" onClick={nextStep}>
                  下一步
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
